import { Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { prisma } from '../utils/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

export async function getNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    res.json({ success: true, data: notes })
  } catch (error) {
    next(error)
  }
}

export async function getNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const noteId = req.params.id

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    })

    if (!note) throw createError('便签不存在', 404)

    res.json({ success: true, data: note })
  } catch (error) {
    next(error)
  }
}

export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const { title = '', content = '', color = 'yellow' } = req.body

    const note = await prisma.note.create({
      data: { title, content, color, userId },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    res.status(201).json({ success: true, data: note })
  } catch (error) {
    next(error)
  }
}

export async function updateNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId
    const noteId = req.params.id
    if (!userId) throw createError('未认证', 401)

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, userId },
    })

    if (!existingNote) {
      throw createError('便签不存在或无权修改', 404)
    }

    const { title, content, color } = req.body

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
      },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    res.json({ success: true, data: note })
  } catch (error) {
    next(error)
  }
}

export async function deleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    const noteId = req.params.id
    if (!userId) throw createError('未认证', 401)

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, userId },
    })

    if (!existingNote) {
      throw createError('便签不存在或无权删除', 404)
    }

    await prisma.note.delete({ where: { id: noteId } })

    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}

export async function createReply(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400)
    }

    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const noteId = req.params.id
    const { content } = req.body

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) throw createError('便签不存在', 404)

    const reply = await prisma.reply.create({
      data: { content, noteId, userId },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
      },
    })

    res.status(201).json({ success: true, data: reply })
  } catch (error) {
    next(error)
  }
}
