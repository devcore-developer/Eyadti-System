import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShieldOff, LogOut, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export default async function SuspendedPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/50 p-8 text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldOff className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">Subscription Suspended</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your clinic access has been suspended by the platform administrator. Please contact support to resolve any outstanding issues and reactivate your account.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <a href="mailto:support@nexora.com">
            <Button className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
              <Mail className="h-4 w-4 mr-2" /> Contact Support
            </Button>
          </a>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl" 
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  )
}