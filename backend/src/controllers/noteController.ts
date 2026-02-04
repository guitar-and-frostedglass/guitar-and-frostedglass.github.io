import { Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { prisma } from '../utils/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

// 获取所有便签
export async function getNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId

    if (!userId) {
      throw createError('未认证', 401)
    }

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: notes,
    })
  } catch (error) {
    next(error)
  }
}

// 创建便签
export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId

    if (!userId) {
      throw createError('未认证', 401)
    }

    const { content = '', color = 'yellow', positionX = 50, positionY = 50 } = req.body

    const note = await prisma.note.create({
      data: {
        content,
        color,
        positionX,
        positionY,
        userId,
      },
    })

    res.status(201).json({
      success: true,
      data: note,
    })
  } catch (error) {
    next(error)
  }
}

// 更新便签
export async function updateNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId
    const noteId = req.params.id

    if (!userId) {
      throw createError('未认证', 401)
    }

    // 检查便签是否存在且属于当前用户
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
    })

    if (!existingNote) {
      throw createError('便签不存在', 404)
    }

    const { content, color, positionX, positionY } = req.body

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
      },
    })

    res.json({
      success: true,
      data: note,
    })
  } catch (error) {
    next(error)
  }
}

// 删除便签
export async function deleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId
    const noteId = req.params.id

    if (!userId) {
      throw createError('未认证', 401)
    }

    // 检查便签是否存在且属于当前用户
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
    })

    if (!existingNote) {
      throw createError('便签不存在', 404)
    }

    await prisma.note.delete({
      where: { id: noteId },
    })

    res.json({
      success: true,
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

