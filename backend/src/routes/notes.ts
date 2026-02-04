import { Router } from 'express'
import { body, param } from 'express-validator'
import * as noteController from '../controllers/noteController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// 所有便签路由都需要认证
router.use(authenticate)

// 创建便签验证规则
const createValidation = [
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
  body('color')
    .optional()
    .isIn(['yellow', 'pink', 'blue', 'green', 'purple', 'orange'])
    .withMessage('无效的颜色'),
  body('positionX')
    .optional()
    .isInt({ min: 0 })
    .withMessage('位置X必须是非负整数'),
  body('positionY')
    .optional()
    .isInt({ min: 0 })
    .withMessage('位置Y必须是非负整数'),
]

// 更新便签验证规则
const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('无效的便签ID'),
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
  body('color')
    .optional()
    .isIn(['yellow', 'pink', 'blue', 'green', 'purple', 'orange'])
    .withMessage('无效的颜色'),
  body('positionX')
    .optional()
    .isInt({ min: 0 })
    .withMessage('位置X必须是非负整数'),
  body('positionY')
    .optional()
    .isInt({ min: 0 })
    .withMessage('位置Y必须是非负整数'),
]

// 删除便签验证规则
const deleteValidation = [
  param('id')
    .isUUID()
    .withMessage('无效的便签ID'),
]

// 获取所有便签
router.get('/', noteController.getNotes)

// 创建便签
router.post('/', createValidation, noteController.createNote)

// 更新便签
router.put('/:id', updateValidation, noteController.updateNote)

// 删除便签
router.delete('/:id', deleteValidation, noteController.deleteNote)

export default router

