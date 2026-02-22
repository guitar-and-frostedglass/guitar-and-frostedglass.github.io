import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const { email, password, displayName, inviteCode } = req.body

    if (!inviteCode) {
      throw createError('请输入邀请码', 400)
    }

    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    })

    if (!invite) {
      throw createError('邀请码无效', 400)
    }

    if (invite.used) {
      throw createError('邀请码已被使用', 400)
    }

    if (new Date() > invite.expiresAt) {
      throw createError('邀请码已过期', 400)
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw createError('该邮箱已被注册', 400)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { used: true, usedBy: newUser.id },
      })

      return newUser
    })

    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      data: { user, token },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const { identifier, password } = req.body

    const isEmail = identifier.includes('@')
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findFirst({ where: { displayName: identifier } })

    if (!user) {
      throw createError('账号或密码错误', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw createError('账号或密码错误', 401)
    }

    const token = generateToken(user.id)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId

    if (!userId) {
      throw createError('未认证', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw createError('用户不存在', 404)
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw createError('服务器配置错误', 500)
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  )
}

/**
 * Seeds the initial admin user on startup if no admin exists.
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD from env.
 */
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) return

  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (adminExists) return

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })
    console.log(`[Seed] 已将 ${email} 升级为管理员`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log(`[Seed] 已创建管理员账号: ${email}`)
}
