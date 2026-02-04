import { Router } from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// 注册验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6位'),
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度为1-50个字符'),
]

// 登录验证规则
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
]

// 注册
router.post('/register', registerValidation, authController.register)

// 登录
router.post('/login', loginValidation, authController.login)

// 获取当前用户信息
router.get('/me', authenticate, authController.getCurrentUser)

export default router

