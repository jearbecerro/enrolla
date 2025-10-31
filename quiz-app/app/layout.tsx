import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/common-ui/Toast'

export const metadata: Metadata = {
	title: {
		default: 'Enrolla Quiz App',
		template: '%s | Enrolla Quiz',
	},
	description: 'Timed and normal quizzes with programming and trivia (React, Next.js, HoloJS).',
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
	icons: {
		icon: '/enrolla_logo.jpg',
		shortcut: '/enrolla_logo.jpg',
		apple: '/enrolla_logo.jpg',
	},
	openGraph: {
		title: 'Enrolla Quiz App',
		description: 'Practice programming, React/Next.js and HoloJS trivia in normal or timed mode.',
		url: '/',
		siteName: 'Enrolla Quiz',
		images: [{ url: '/enrolla_logo.jpg', width: 512, height: 512, alt: 'Enrolla' }],
		type: 'website',
	},
	twitter: {
		card: 'summary',
		title: 'Enrolla Quiz App',
		description: 'Timed and normal quizzes with programming and trivia.',
		images: ['/enrolla_logo.jpg'],
	},
	themeColor: '#1d4ed8',
	viewport: {
		width: 'device-width',
		initialScale: 1,
	},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50 text-gray-900">
				<ToastProvider>
					<div className="mx-auto max-w-2xl p-6">{children}</div>
				</ToastProvider>
			</body>
		</html>
	)
}
