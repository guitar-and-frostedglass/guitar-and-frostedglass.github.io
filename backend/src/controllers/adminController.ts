import { Response, NextFunction } from 'express'
import crypto from 'crypto'
import { prisma } from '../utils/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

export async function getAllUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { notes: true, replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
}

export async function deleteUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const targetId = req.params.id

    if (targetId === req.userId) {
      throw createError('不能删除自己的账号', 400)
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } })
    if (!target) {
      throw createError('用户不存在', 404)
    }

    await prisma.user.delete({ where: { id: targetId } })

    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}

export async function updateUserRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const targetId = req.params.id
    const { role } = req.body

    if (!['USER', 'ADMIN'].includes(role)) {
      throw createError('无效的角色', 400)
    }

    if (targetId === req.userId) {
      throw createError('不能修改自己的角色', 400)
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

export async function generateInviteCode(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        expiresAt,
        creatorId: userId,
      },
    })

    res.status(201).json({ success: true, data: inviteCode })
  } catch (error) {
    next(error)
  }
}

export async function getInviteCodes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const codes = await prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        creator: {
          select: { displayName: true },
        },
      },
    })

    res.json({ success: true, data: codes })
  } catch (error) {
    next(error)
  }
}
