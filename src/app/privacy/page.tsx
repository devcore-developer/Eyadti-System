import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — Nexora",
  description: "Learn how Nexora collects, uses, and protects your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/" className="text-sm text-[#6B9CFF] hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-[#6B9CFF]/10">
            <ShieldCheck className="h-6 w-6 text-[#6B9CFF]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="prose prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly when using Nexora, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, and password.</li>
            <li><strong>Clinic Data:</strong> Clinic name, address, phone, logo, working hours, and branch details.</li>
            <li><strong>Patient Records:</strong> Full name, phone, date of birth, gender, address, medical history, allergies, and surgical history.</li>
            <li><strong>Medical Records:</strong> Visit notes, diagnoses, complaints, treatment plans, and prescriptions.</li>
            <li><strong>Attachments:</strong> Lab results, X-rays, MRI scans, CT scans, and other medical documents uploaded to the system.</li>
            <li><strong>Financial Data:</strong> Invoice details, payment records, and subscription information.</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, and actions performed within the system.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the Nexora service.</li>
            <li>To process appointments, invoices, and prescriptions.</li>
            <li>To send appointment reminders via WhatsApp, SMS, and email.</li>
            <li>To generate analytics and reports for clinic owners.</li>
            <li>To improve our service and user experience.</li>
            <li>To communicate important updates about your account.</li>
          </ul>

          <h2>3. Data Storage & Security</h2>
          <p>All data is stored securely using:</p>
          <ul>
            <li><strong>Database:</strong> PostgreSQL hosted on a secure cloud provider with SSL encryption in transit.</li>
            <li><strong>File Storage:</strong> Cloudinary with encrypted connections and access controls.</li>
            <li><strong>Passwords:</strong> Hashed using industry-standard algorithms (bcrypt). We never store plaintext passwords.</li>
            <li><strong>Authentication:</strong> JWT-based sessions with secure, HTTP-only cookies.</li>
          </ul>

          <h2>4. Third-Party Integrations</h2>
          <ul>
            <li><strong>Cloudinary:</strong> Used for secure file storage (images, PDFs, medical documents).</li>
            <li><strong>UltraMsg (WhatsApp):</strong> Used to send appointment reminders and notifications. Phone numbers are shared only when you enable this feature.</li>
            <li><strong>Email/SMS Providers:</strong> Used for notification delivery when configured by the clinic.</li>
            <li>We do not sell, rent, or share your data with third parties for marketing purposes.</li>
          </ul>

          <h2>5. Cookies</h2>
          <p>Nexora uses essential cookies for authentication and session management. We do not use advertising or tracking cookies. Required cookies include:</p>
          <ul>
            <li><strong>next-auth.session-token:</strong> Keeps you logged in securely.</li>
            <li><strong>support_clinic_id:</strong> Remembers the clinic context during support mode (admin only).</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>Your data is retained as long as your account is active. If you cancel your subscription, your data remains accessible until the end of your billing period. If you request account deletion, all data is permanently removed within 30 days.</p>

          <h2>7. Your Rights</h2>
          <ul>
            <li><strong>Access:</strong> You can request a copy of all your data at any time.</li>
            <li><strong>Correction:</strong> You can update or correct your personal information.</li>
            <li><strong>Deletion:</strong> You can request permanent deletion of your account and all associated data.</li>
            <li><strong>Export:</strong> You can export your patient records and invoices at any time.</li>
          </ul>

          <h2>8. Children&apos;s Privacy</h2>
          <p>Nexora is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children.</p>

          <h2>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes via email or in-app notification. Your continued use of Nexora after changes constitutes acceptance of the updated policy.</p>

          <h2>10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> support@nexora.app</li>
            <li><strong>WhatsApp:</strong> +20 127 597 6195</li>
          </ul>
        </div>
      </div>
    </div>
  )
}