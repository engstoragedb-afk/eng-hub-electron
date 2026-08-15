import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from "@/components/organisms/Sidebar"
import TopBar from "@/components/organisms/TopBar"
import { useUIStore } from "@/store/uiStore"

import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from "@/components/providers/AuthProvider"
import { Poppins } from 'next/font/google'
import '../styles/globals.css'

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')
  const isMaintenance = router.pathname.startsWith('/maintenance')
  const hasSidebar = isAdmin || isMaintenance
  const { isSidebarOpen, isFullscreen, setFullscreen } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setFullscreen(false);
        } else {
          if (typeof window !== "undefined" && window.ipc) {
            window.ipc.invoke('request-quit');
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, setFullscreen])

  const showNav = hasSidebar && !isFullscreen

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider>
      <div className={`${poppins.variable} font-sans min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/10 shadow-xl backdrop-blur-md',
          success: {
            iconTheme: {
              primary: '#0ea5e9', // sky-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e', // rose-500
              secondary: '#fff',
            },
          },
        }}
      />
      {showNav && <Sidebar heading={isAdmin ? "Admin" : "Maintenance"} />}
      
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${showNav ? (isSidebarOpen ? "ml-[260px]" : "ml-20") : ""}`}>
        {showNav && <TopBar />}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: 'easeIn' }}
            className="flex-1 flex flex-col"
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default MyApp
