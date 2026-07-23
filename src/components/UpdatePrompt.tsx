import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (registration) {
        console.log('[FastFeast] 📡 Service worker registered:', registration.scope)
      }
    },
    onRegisterError(error: unknown) {
      console.error('[FastFeast] ❌ Service worker registration error:', error)
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    updateServiceWorker(false)
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-[60] max-w-md mx-auto"
        >
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#e94560]/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">New Update Available</h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  A fresh version of FastFeast is ready. Refresh to get the latest features!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
