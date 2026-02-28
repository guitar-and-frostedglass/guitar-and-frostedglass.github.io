import { Router } from 'express'
import { body, param } from 'express-validator'
import * as noteController from '../controllers/noteController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

const createValidation = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('标题最长100个字符'),
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
  body('color')
    .optional()
    .isIn(['yellow', 'pink', 'blue', 'green', 'purple', 'orange'])
    .withMessage('无效的颜色'),
  body('layer')
    .optional()
    .isIn(['SURFACE', 'HIDDEN'])
    .withMessage('无效的便签层级'),
]

const updateValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
  body('title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('标题最长100个字符'),
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
  body('color')
    .optional()
    .isIn(['yellow', 'pink', 'blue', 'green', 'purple', 'orange'])
    .withMessage('无效的颜色'),
]

const deleteValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
]

const replyValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('回复内容不能为空'),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('无效的引用回复ID'),
]

const deleteReplyValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
  param('replyId').isUUID().withMessage('无效的回复ID'),
]

const updateReplyValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
  param('replyId').isUUID().withMessage('无效的回复ID'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('回复内容不能为空'),
]

const publishValidation = [
  param('id').isUUID().withMessage('无效的便签ID'),
]

router.get('/', noteController.getNotes)
router.get('/:id', [param('id').isUUID().withMessage('无效的便签ID')], noteController.getNote)
router.post('/', createValidation, noteController.createNote)
router.put('/:id', updateValidation, noteController.updateNote)
router.put('/:id/publish', publishValidation, noteController.publishNote)
router.delete('/:id', deleteValidation, noteController.deleteNote)
router.post('/:id/replies', replyValidation, noteController.createReply)
router.put('/:id/replies/:replyId', updateReplyValidation, noteController.updateReply)
router.delete('/:id/replies/:replyId', deleteReplyValidation, noteController.deleteReply)

export default router
