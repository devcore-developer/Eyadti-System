import Link from "next/link"
import { FileText } from "lucide-react"

export const metadata = {
  title: "Terms & Conditions — Nexora",
  description: "Terms and conditions for using the Nexora clinic management system.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/" className="text-sm text-[#6B9CFF] hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-[#6B9CFF]/10">
            <FileText className="h-6 w-6 text-[#6B9CFF]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Nexora, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service. These terms apply to all users including clinic owners, doctors, staff, and administrators.</p>

          <h2>2. Service Description</h2>
          <p>Nexora is a Software-as-a-Service (SaaS) platform for clinic management. It provides tools for patient records, appointment scheduling, invoicing, prescriptions, online booking, analytics, and WhatsApp notifications. The service is provided "as is" without warranties of any kind.</p>

          <h2>3. Account Registration</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your login credentials. You must be at least 18 years old to create an account. Each clinic is limited to one account unless explicitly authorized by Nexora support.</p>

          <h2>4. Trial Period</h2>
          <p>New clinics receive a 5-day trial period with full access to the features included in their selected plan. No payment is required during the trial. At the end of the trial, the subscription expires automatically. You can upgrade to a paid plan at any time to continue using Nexora.</p>

          <h2>5. Subscription Plans & Payments</h2>
          <p>Nexora offers multiple subscription plans with different features and limits. By subscribing, you agree to pay the listed price for the selected billing cycle (monthly or yearly). Prices are subject to change with 30 days notice.</p>
          <ul>
            <li>Subscription fees are billed in advance at the start of each cycle.</li>
            <li>Plan upgrades take effect immediately with prorated billing.</li>
            <li>Plan downgrades take effect at the next billing cycle.</li>
            <li>Failed payments may result in service suspension after a grace period.</li>
          </ul>

          <h2>6. User Responsibilities</h2>
          <ul>
            <li>Keep your password secure and do not share it with anyone.</li>
            <li>Ensure all patient data entered is accurate and up-to-date.</li>
            <li>Comply with local medical data protection regulations.</li>
            <li>Not use Nexora for any illegal or unauthorized purpose.</li>
            <li>Not attempt to reverse engineer, decompile, or compromise the system.</li>
          </ul>

          <h2>7. Data Ownership</h2>
          <p>You retain full ownership of all data you enter into Nexora, including patient records, medical files, and clinic information. We do not claim ownership of your data. You can export or delete your data at any time.</p>

          <h2>8. Account Suspension</h2>
          <p>We reserve the right to suspend or restrict your account if:</p>
          <ul>
            <li>Payment is significantly overdue.</li>
            <li>Terms of service are violated.</li>
            <li>Suspicious or fraudulent activity is detected.</li>
            <li>Required by law enforcement.</li>
          </ul>
          <p>Suspended accounts retain their data and can be reactivated upon resolution.</p>

          <h2>9. Account Termination</h2>
          <p>You may terminate your account at any time by contacting support. Upon termination, your data will be retained for 30 days and then permanently deleted. We are not responsible for any data loss after this period.</p>

          <h2>10. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Nexora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>

          <h2>11. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Nexora, its developers, and affiliates from any claims, damages, or expenses arising from your use of the service or violation of these terms.</p>

          <h2>12. Contact Information</h2>
          <p>For questions about these terms, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> support@nexora.app</li>
            <li><strong>WhatsApp:</strong> +20 127 597 6195</li>
          </ul>
        </div>
      </div>
    </div>
  )
}