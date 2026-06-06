import { NotificationChannel, NotificationPayload } from "../types";
import { prisma } from "@/lib/prisma";

export class WhatsAppProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.patientPhone) return false;

    try {
      // 1. نجيب اسم الـ Instance الخاص بالعيادة
      const clinicSettings = await prisma.clinicSettings.findUnique({
        where: { clinicId: payload.clinicId },
        select: { whatsappInstanceName: true },
      });

      if (!clinicSettings?.whatsappInstanceName) {
        console.warn(`WhatsApp Instance not configured for clinic: ${payload.clinicId}`);
        return false;
      }

      // 2. نجيب بيانات الـ API من الـ .env
      const apiUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (!apiUrl || !apiKey) {
        console.error("EVOLUTION_API_URL or EVOLUTION_API_KEY is missing in .env");
        return false;
      }

      const instanceName = clinicSettings.whatsappInstanceName;

      // 3. تنظيف رقم الموبايل
      const cleanPhone = payload.patientPhone.replace(/[^0-9]/g, "");
      
      // لو الرقم بيبدأ بـ 0 (مصر مثلاً) بنحوله لـ 20، ولو مبدأش بـ كود الدولة بنسيبه
      const basePhone = cleanPhone.startsWith("0") ? `2${cleanPhone.substring(1)}` : cleanPhone;
      
      // في الـ Baileys، أفضل طريقة إن الرقم يتبعت بالـ JID بتاع الواتساب
      const formattedPhone = `${basePhone}@s.whatsapp.net`;

      // نتأكد إن الرسالة مش فاضية
      const messageBody = payload.externalMessage || payload.message || "New Notification";

      // 4. بناء الـ Request الخاص بـ Evolution API
      const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "ngrok-skip-browser-warning": "true", // ↓↓↓ أضف السطر ده عشان يتخطى صفحة التحذير ↓↓↓
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: messageBody, // ↓↓↓ التعديل هنا: شيلنا textMessage وحطينا text على طول ↓↓↓
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: false
          }
        }),
      });

      const data = await response.json();

      // 5. التحقق من النتيجة وطباعة الخطأ بالتفصيل لو فيه
      if (!response.ok) {
        console.error("❌ Evolution API Detailed Error:", JSON.stringify(data, null, 2));
        return false;
      }

      console.log(`✅ WhatsApp message sent successfully to ${formattedPhone} via ${instanceName}`);
      return true;
      
    } catch (error) {
      console.error("❌ Error in WhatsAppProvider:", error);
      return false;
    }
  }
}