import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { createError } from './errorHandler.js'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

interface JwtPayload {
  userId: string
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('未提供认证令牌', 401)
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw createError('服务器配置错误', 500)
    }

    const decoded = jwt.verify(token, secret) as JwtPayload
    req.userId = decoded.userId

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('无效的认证令牌', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('认证令牌已过期', 401))
    } else {
      next(error)
    }
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.userId

  if (!userId) {
    return next(createError('未认证', 401))
  }

  prisma.user.findUnique({ where: { id: userId } })
    .then((user) => {
      if (!user || user.role !== 'ADMIN') {
        return next(createError('无管理员权限', 403))
      }
      req.userRole = user.role
      next()
    })
    .catch(next)
}
