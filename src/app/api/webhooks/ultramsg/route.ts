import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // UltraMsg بيبعت Event اسمه message_received لما مريض يبعت رسالة
    if (body.event === "message_received") {
      const from = body.data.from; // رقم المريض
      const text = body.data.body; // نص الرسالة
      
      console.log(`Received WhatsApp message from ${from}: ${text}`);

      // TODO: هنا تقدر تعمل أي Logic
      // مثلاً: لو المريض بعت "تأكيد"، تغير حالة الحجز في الداتابيز
    }

    // لازم ترجع 200 عشان UltraMsg ميحاولش يبعت الرسالة تاني
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("UltraMsg Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// الـ GET مش محتاجينه هنا، UltraMsg مش بيعمل Verification زي فيسبوك