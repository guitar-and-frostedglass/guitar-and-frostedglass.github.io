import { Router } from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

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
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('请输入邀请码'),
]

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('请输入邮箱或昵称'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少为6位'),
]

const updateProfileValidation = [
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度为1-50个字符'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
]

router.post('/register', registerValidation, authController.register)
router.post('/login', loginValidation, authController.login)
router.get('/me', authenticate, authController.getCurrentUser)
router.put('/avatar', authenticate, authController.updateAvatar)
router.put('/password', authenticate, changePasswordValidation, authController.changePassword)
router.put('/profile', authenticate, updateProfileValidation, authController.updateProfile)

export default router
