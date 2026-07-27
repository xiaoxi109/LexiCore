import { useCallback, useState, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: ReactNode
  type: ToastType
}

let nextId = 0

export function useToast(duration = 3000) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (message: ReactNode, type: ToastType = 'info') => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    },
    [duration],
  )

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

const TYPE_STYLE: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white dark:bg-slate-700',
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onRemove(t.id)}
          className={`animate-toast-in cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg transition hover:opacity-90 ${TYPE_STYLE[t.type]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
