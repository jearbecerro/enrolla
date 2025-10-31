'use client'

import { useEffect, useState } from 'react'
import NormalQuiz from '@/components/page-layouts/NormalQuiz'
import TimeQuiz from '@/components/page-layouts/TimeQuiz'
import StartModeModal from '@/components/common-ui/StartModeModal'
import Image from 'next/image'

export default function Page() {
	const [mode, setMode] = useState<'normal' | 'timed'>('normal')
	const [modeModalOpen, setModeModalOpen] = useState(true)

	useEffect(() => {
		// Open on first load; could be persisted later
		setModeModalOpen(true)
	}, [])
	return (
		<main>
			<div className="mb-6 flex items-center gap-3">
				<Image src="/enrolla_logo.jpg" alt="Enrolla" width={48} height={48} className="rounded" />
				<h1 className="text-4xl font-semibold">Enrolla Quiz App</h1>
			</div>
			<div className="mb-4 flex items-center gap-3">
				<button
					className="rounded bg-gray-700 px-3 py-1.5 text-white hover:bg-gray-800"
					onClick={() => setModeModalOpen(true)}
				>
					Change mode
				</button>
				<span className="text-sm text-gray-600">Current: {mode === 'normal' ? 'Normal' : 'Timed'}</span>
			</div>
			<StartModeModal
				open={modeModalOpen}
				onClose={() => setModeModalOpen(false)}
				onChoose={(selectedMode) => {
					setMode(selectedMode)
					setModeModalOpen(false)
				}}
				defaultMode={mode}
			/>
			{mode === 'normal' ? <NormalQuiz /> : <TimeQuiz />}
		</main>
	)
}
