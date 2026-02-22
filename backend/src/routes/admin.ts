import { Router } from 'express'
import { param, body } from 'express-validator'
import * as adminController from '../controllers/adminController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/users', adminController.getAllUsers)

router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('无效的用户ID')],
  adminController.deleteUser
)

router.put(
  '/users/:id/role',
  [
    param('id').isUUID().withMessage('无效的用户ID'),
    body('role').isIn(['USER', 'ADMIN']).withMessage('无效的角色'),
  ],
  adminController.updateUserRole
)

router.post(
  '/invite-codes',
  [body('email').optional().isEmail().withMessage('邮箱格式不正确')],
  adminController.generateInviteCode
)
router.get('/invite-codes', adminController.getInviteCodes)
router.get('/deleted-replies', adminController.getDeletedReplies)

router.get('/deleted-notes', adminController.getDeletedNotes)
router.post(
  '/deleted-notes/:id/restore',
  [param('id').isUUID().withMessage('无效的记录ID')],
  adminController.restoreNote
)
router.delete(
  '/deleted-notes/:id',
  [param('id').isUUID().withMessage('无效的记录ID')],
  adminController.permanentlyDeleteNote
)

export default router
