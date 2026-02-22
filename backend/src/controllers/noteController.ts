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
      where: {
        OR: [
          { status: 'PUBLISHED' },
          { status: 'DRAFT', userId },
        ],
      },
      orderBy: { lastActivityAt: 'desc' },
      include: {
        user: {
          select: { id: true, displayName: true, avatar: true },
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
          select: { id: true, displayName: true, avatar: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, displayName: true, avatar: true },
            },
          },
        },
      },
    })

    if (!note) throw createError('便签不存在', 404)

    if (note.status === 'DRAFT' && note.userId !== userId) {
      throw createError('便签不存在', 404)
    }

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

    const { title = '', content = '', color = 'yellow', isDraft = false } = req.body
    const status = isDraft ? 'DRAFT' : 'PUBLISHED'

    const note = await prisma.note.create({
      data: { title, content, color, status, userId },
      include: {
        user: {
          select: { id: true, displayName: true, avatar: true },
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

    const contentChanged =
      (title !== undefined && title !== existingNote.title) ||
      (content !== undefined && content !== existingNote.content)
    const shouldSaveHistory = existingNote.status === 'PUBLISHED' && contentChanged

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser) throw createError('用户不存在', 404)

    const operations: Parameters<typeof prisma.$transaction>[0] = []

    if (shouldSaveHistory) {
      operations.push(
        prisma.noteEditHistory.create({
          data: {
            noteId,
            title: existingNote.title,
            content: existingNote.content,
            editedById: userId,
            editedByName: currentUser.displayName,
          },
        })
      )
    }

    operations.push(
      prisma.note.update({
        where: { id: noteId },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(color !== undefined && { color }),
        },
        include: {
          user: {
            select: { id: true, displayName: true, avatar: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      })
    )

    const results = await prisma.$transaction(operations)
    const note = results[results.length - 1]

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

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser) throw createError('用户不存在', 404)

    const isAdmin = currentUser.role === 'ADMIN'

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        user: { select: { id: true, displayName: true } },
        replies: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!existingNote) throw createError('便签不存在', 404)
    if (existingNote.userId !== userId && !isAdmin) {
      throw createError('无权删除该便签', 403)
    }

    const repliesSnapshot = existingNote.replies.map((r) => ({
      id: r.id,
      content: r.content,
      userId: r.userId,
      userName: r.user.displayName,
      createdAt: r.createdAt.toISOString(),
    }))

    await prisma.$transaction([
      prisma.deletedNote.create({
        data: {
          originalNoteId: existingNote.id,
          title: existingNote.title,
          content: existingNote.content,
          color: existingNote.color,
          noteUserId: existingNote.userId,
          noteUserName: existingNote.user.displayName,
          replies: repliesSnapshot,
          deletedById: userId,
          deletedByName: currentUser.displayName,
          noteCreatedAt: existingNote.createdAt,
        },
      }),
      prisma.note.delete({ where: { id: noteId } }),
    ])

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

    const [reply] = await prisma.$transaction([
      prisma.reply.create({
        data: { content, noteId, userId },
        include: {
          user: {
            select: { id: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.note.update({
        where: { id: noteId },
        data: { lastActivityAt: new Date() },
      }),
    ])

    res.status(201).json({ success: true, data: reply })
  } catch (error) {
    next(error)
  }
}

export async function publishNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    const noteId = req.params.id
    if (!userId) throw createError('未认证', 401)

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, userId, status: 'DRAFT' },
    })

    if (!existingNote) {
      throw createError('草稿不存在或无权操作', 404)
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: 'PUBLISHED', lastActivityAt: new Date() },
      include: {
        user: {
          select: { id: true, displayName: true, avatar: true },
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

export async function updateReply(
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

    const { id: noteId, replyId } = req.params
    const { content } = req.body

    const existingReply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: { note: { select: { id: true } } },
    })

    if (!existingReply) throw createError('回复不存在', 404)
    if (existingReply.noteId !== noteId) throw createError('回复不属于该便签', 400)
    if (existingReply.userId !== userId) throw createError('无权编辑该回复', 403)

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser) throw createError('用户不存在', 404)

    const [, reply] = await prisma.$transaction([
      prisma.replyEditHistory.create({
        data: {
          replyId,
          content: existingReply.content,
          editedById: userId,
          editedByName: currentUser.displayName,
        },
      }),
      prisma.reply.update({
        where: { id: replyId },
        data: { content },
        include: {
          user: {
            select: { id: true, displayName: true, avatar: true },
          },
        },
      }),
    ])

    res.json({ success: true, data: reply })
  } catch (error) {
    next(error)
  }
}

export async function deleteReply(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId
    if (!userId) throw createError('未认证', 401)

    const { id: noteId, replyId } = req.params

    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: {
        user: { select: { id: true, displayName: true } },
        note: { select: { id: true, title: true } },
      },
    })

    if (!reply) throw createError('回复不存在', 404)
    if (reply.noteId !== noteId) throw createError('回复不属于该便签', 400)

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser) throw createError('用户不存在', 404)

    const isOwner = reply.userId === userId
    const isAdmin = currentUser.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      throw createError('无权删除该回复', 403)
    }

    await prisma.$transaction([
      prisma.deletedReply.create({
        data: {
          originalReplyId: reply.id,
          content: reply.content,
          noteId: reply.noteId,
          noteTitle: reply.note.title || '',
          replyUserId: reply.userId,
          replyUserName: reply.user.displayName,
          deletedById: userId,
          deletedByName: currentUser.displayName,
          replyCreatedAt: reply.createdAt,
        },
      }),
      prisma.reply.delete({ where: { id: replyId } }),
    ])

    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}
