import nodemailer from 'nodemailer'

const smtpConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS

let transporter: nodemailer.Transporter | null = null

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://guitar-and-frostedglass.github.io'

export async function sendInviteEmail(
  to: string,
  code: string,
  expiresAt: Date
) {
  if (!transporter) {
    console.warn('[mailer] SMTP not configured — skipping invite email')
    return
  }

  const registerUrl = `${FRONTEND_URL}/register?code=${encodeURIComponent(code)}`
  const expiresStr = expiresAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: '你收到了一封来自 Guitar & Frosted Glass 的邀请',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="text-align: center; color: #1e293b; margin-bottom: 8px;">Guitar &amp; Frosted Glass</h2>
        <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 28px;">你被邀请加入我们</p>

        <div style="background: #ffffff; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 12px;">你的邀请码</p>
          <p style="font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a; margin: 0 0 12px;">${code}</p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">有效期至 ${expiresStr}</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${registerUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">立即注册</a>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
          邀请码将在 15 分钟后过期，请尽快完成注册。<br/>
          如果你不认识发件人，请忽略此邮件。
        </p>
      </div>
    `,
  })
}
