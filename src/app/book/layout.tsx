export const dynamic = 'force-dynamic'

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.655-9.018a.75.75 0 00-.878.255l-4.5 6.75a.75.75 0 00.413 1.135l2.753.688-1.526 5.58a.75.75 0 001.27.737l4.5-6.75a.75.75 0 00-.413-1.135l-2.753-.688 1.526-5.58a.75.75 0 00-.391-.884z" clipRule="evenodd" />
            </svg>
            Online Booking
          </h1>
          <div className="text-xs text-gray-500">Secure Booking System</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t bg-white">
        Powered by <span className="font-semibold text-teal-600">EyadTi System</span> &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}