import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createError } from './errorHandler.js'

export interface AuthRequest extends Request {
  userId?: string
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

