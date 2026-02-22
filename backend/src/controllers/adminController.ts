import { Response, NextFunction } from 'express'
import crypto from 'crypto'
import { prisma } from '../utils/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'
import { sendInviteEmail } from '../utils/mailer.js'

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
        avatar: true,
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
        avatar: true,
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

    const { email } = req.body as { email?: string }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        expiresAt,
        creatorId: userId,
      },
    })

    let emailSent = false
    if (email) {
      try {
        await sendInviteEmail(email, code, expiresAt)
        emailSent = true
      } catch (err) {
        console.error('[invite] Failed to send email:', err)
      }
    }

    res.status(201).json({ success: true, data: { ...inviteCode, emailSent } })
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

export async function getDeletedReplies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const deletedReplies = await prisma.deletedReply.findMany({
      orderBy: { deletedAt: 'desc' },
      take: 100,
    })

    res.json({ success: true, data: deletedReplies })
  } catch (error) {
    next(error)
  }
}

export async function getDeletedNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const deletedNotes = await prisma.deletedNote.findMany({
      orderBy: { deletedAt: 'desc' },
      take: 100,
    })

    res.json({ success: true, data: deletedNotes })
  } catch (error) {
    next(error)
  }
}

export async function restoreNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params

    const deletedNote = await prisma.deletedNote.findUnique({ where: { id } })
    if (!deletedNote) throw createError('删除记录不存在', 404)

    const ownerExists = await prisma.user.findUnique({
      where: { id: deletedNote.noteUserId },
    })
    if (!ownerExists) throw createError('原作者账号已不存在，无法恢复', 400)

    const repliesData = deletedNote.replies as Array<{
      id: string
      content: string
      userId: string
      createdAt: string
    }>

    const existingUserIds = new Set(
      (
        await prisma.user.findMany({
          where: { id: { in: repliesData.map((r) => r.userId) } },
          select: { id: true },
        })
      ).map((u) => u.id)
    )
    const restorableReplies = repliesData.filter((r) =>
      existingUserIds.has(r.userId)
    )

    await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          id: deletedNote.originalNoteId,
          title: deletedNote.title,
          content: deletedNote.content,
          color: deletedNote.color,
          userId: deletedNote.noteUserId,
          createdAt: deletedNote.noteCreatedAt,
          lastActivityAt:
            restorableReplies.length > 0
              ? new Date(
                  restorableReplies[restorableReplies.length - 1].createdAt
                )
              : deletedNote.noteCreatedAt,
        },
      })

      if (restorableReplies.length > 0) {
        await tx.reply.createMany({
          data: restorableReplies.map((r) => ({
            id: r.id,
            content: r.content,
            noteId: note.id,
            userId: r.userId,
            createdAt: new Date(r.createdAt),
          })),
        })
      }

      await tx.deletedNote.delete({ where: { id } })
    })

    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}

export async function permanentlyDeleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params

    const deletedNote = await prisma.deletedNote.findUnique({ where: { id } })
    if (!deletedNote) throw createError('删除记录不存在', 404)

    await prisma.deletedNote.delete({ where: { id } })

    res.json({ success: true, data: null })
  } catch (error) {
    next(error)
  }
}
