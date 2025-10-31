'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export type Toast = {
	id: number
	message: string
	type: ToastType
}

type ToastContextValue = {
	addToast: (message: string, type?: ToastType, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])
	const idRef = useRef(1)

	const removeToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	const addToast = useCallback((message: string, type: ToastType = 'info', durationMs = 3000) => {
		const id = idRef.current++
		setToasts((prev) => [...prev, { id, message, type }])
		const timer = setTimeout(() => removeToast(id), durationMs)
		return () => clearTimeout(timer)
	}, [removeToast])

	const value = useMemo(() => ({ addToast }), [addToast])

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={[
							'pointer-events-auto rounded-md px-4 py-3 shadow-lg text-sm text-white',
							toast.type === 'success' && 'bg-green-600',
							toast.type === 'error' && 'bg-red-600',
							toast.type === 'info' && 'bg-gray-800',
						]
							.filter(Boolean)
							.join(' ')}
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	)
}
