import { NotificationChannel, NotificationPayload } from "../types"

export class EmailProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Email] To: ${payload.userId} - ${payload.message}`)
    return true
  }

  // دالة مخصصة لإرسال كود التأكيد
  async sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
    // TODO: لما تيجي تربط سيرفر إيميلات حقيقي (زي Resend)، هتشيل الـ console.log وتحط الـ API بتاعك هنا
    console.log(`\n========================================`)
    console.log(`[OTP EMAIL] To: ${toEmail}`)
    console.log(`[OTP EMAIL] Your Verification Code is: ${otpCode}`)
    console.log(`========================================\n`)
    return true
  }
}