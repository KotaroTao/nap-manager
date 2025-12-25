/**
 * メール送信ユーティリティ
 *
 * 開発環境ではコンソール出力、本番環境では実際のメール送信を行います。
 * 将来的にSMTP、SendGrid、AWS SESなどのプロバイダーを追加できます。
 */

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * メールを送信する
 *
 * 環境変数 EMAIL_PROVIDER によって送信方法を切り替えます:
 * - "console" (default): コンソールに出力（開発用）
 * - "smtp": SMTP経由で送信（将来実装）
 * - "sendgrid": SendGrid経由で送信（将来実装）
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || "console"

  switch (provider) {
    case "console":
      return sendViaConsole(options)
    case "smtp":
      return sendViaSMTP(options)
    case "sendgrid":
      return sendViaSendGrid(options)
    default:
      return sendViaConsole(options)
  }
}

/**
 * コンソール出力（開発用）
 */
async function sendViaConsole(options: EmailOptions): Promise<EmailResult> {
  console.log("═══════════════════════════════════════")
  console.log("📧 メール送信（開発モード）")
  console.log("═══════════════════════════════════════")
  console.log(`宛先: ${options.to}`)
  console.log(`件名: ${options.subject}`)
  console.log("───────────────────────────────────────")
  console.log(options.text || options.html || "(本文なし)")
  console.log("═══════════════════════════════════════")

  return {
    success: true,
    messageId: `dev-${Date.now()}`,
  }
}

/**
 * SMTP経由で送信（将来実装）
 */
async function sendViaSMTP(options: EmailOptions): Promise<EmailResult> {
  // 必要な環境変数:
  // - SMTP_HOST
  // - SMTP_PORT
  // - SMTP_USER
  // - SMTP_PASSWORD
  // - SMTP_FROM

  const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"]
  const missing = requiredVars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    console.warn(`SMTP設定が不完全です。不足: ${missing.join(", ")}`)
    console.warn("開発モードにフォールバックします")
    return sendViaConsole(options)
  }

  // TODO: nodemailer等を使用したSMTP送信を実装
  // 以下はスケルトン
  /*
  const nodemailer = require("nodemailer")
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })

  return {
    success: true,
    messageId: result.messageId,
  }
  */

  console.warn("SMTP送信は未実装です。開発モードにフォールバックします")
  return sendViaConsole(options)
}

/**
 * SendGrid経由で送信（将来実装）
 */
async function sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
  // 必要な環境変数:
  // - SENDGRID_API_KEY
  // - SENDGRID_FROM

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM) {
    console.warn("SendGrid設定が不完全です")
    console.warn("開発モードにフォールバックします")
    return sendViaConsole(options)
  }

  // TODO: @sendgrid/mailを使用した送信を実装
  // 以下はスケルトン
  /*
  const sgMail = require("@sendgrid/mail")
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to: options.to,
    from: process.env.SENDGRID_FROM,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  const [response] = await sgMail.send(msg)
  return {
    success: true,
    messageId: response.headers["x-message-id"],
  }
  */

  console.warn("SendGrid送信は未実装です。開発モードにフォールバックします")
  return sendViaConsole(options)
}

/**
 * パスワードリセットメールを送信
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<EmailResult> {
  const subject = "【デンタルNAPマネージャー】パスワードリセット"
  const text = `
デンタルNAPマネージャーのパスワードリセットをリクエストしました。

以下のリンクからパスワードをリセットしてください：
${resetUrl}

このリンクは1時間有効です。

心当たりがない場合は、このメールを無視してください。
アカウントのパスワードは変更されません。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
デンタルNAPマネージャー
`.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">パスワードリセット</h2>
    <p>デンタルNAPマネージャーのパスワードリセットをリクエストしました。</p>
    <p>以下のボタンをクリックしてパスワードをリセットしてください：</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        パスワードをリセット
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">
      このリンクは1時間有効です。
    </p>
    <p style="color: #666; font-size: 14px;">
      心当たりがない場合は、このメールを無視してください。<br>
      アカウントのパスワードは変更されません。
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">
      デンタルNAPマネージャー
    </p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to: email, subject, text, html })
}

/**
 * 新規不一致通知メールを送信
 */
export async function sendMismatchNotificationEmail(
  email: string,
  clinicName: string,
  siteName: string,
  detailsUrl: string
): Promise<EmailResult> {
  const subject = `【デンタルNAPマネージャー】新しい不一致が検出されました - ${clinicName}`
  const text = `
新しいNAP情報の不一致が検出されました。

医院名: ${clinicName}
サイト: ${siteName}

詳細を確認するには以下のリンクをクリックしてください：
${detailsUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
デンタルNAPマネージャー
`.trim()

  return sendEmail({ to: email, subject, text })
}
