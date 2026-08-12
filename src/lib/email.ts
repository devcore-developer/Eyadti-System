import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const fromEmail = process.env.RESEND_FROM_EMAIL || "Nexora <noreply@nexora.app>"

interface PasswordResetEmailParams {
  to: string
  name: string
  resetUrl: string
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailParams) {
  if (!resend) {
    console.log("\n========================================")
    console.log("[PASSWORD RESET] To:", to)
    console.log("[PASSWORD RESET] Name:", name)
    console.log("[PASSWORD RESET] URL:", resetUrl)
    console.log("[PASSWORD RESET] ⚠️  RESEND_API_KEY not set — email NOT sent")
    console.log("========================================\n")
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: "Reset Your Nexora Password",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="text-align:center;margin-bottom:32px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#5BC0BE,#6B9CFF)">
              <span style="color:#fff;font-size:20px;font-weight:800">N</span>
            </div>
          </div>
          <h1 style="font-size:24px;font-weight:700;color:#0F172A;margin:0 0 8px">Password Reset</h1>
          <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 32px">
            Hi ${name},<br><br>
            We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
          </p>
          <div style="text-align:center;margin-bottom:32px">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#5BC0BE,#6B9CFF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px">
              Reset Password
            </a>
          </div>
          <p style="font-size:13px;color:#94A3B8;line-height:1.5;margin:0">
            If you didn't request this, you can safely ignore this email.
          </p>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center">
            <p style="font-size:12px;color:#94A3B8;margin:0">© ${new Date().getFullYear()} Nexora. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[RESEND_ERROR]", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("[PASSWORD_RESET_EMAIL_ERROR]", error)
    throw error
  }
}