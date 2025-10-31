'use client'

export default function StartModeModal({
	open,
	onClose,
	onChoose,
	defaultMode = 'normal',
}: {
	open: boolean
	onClose: () => void
	onChoose: (mode: 'normal' | 'timed') => void
	defaultMode?: 'normal' | 'timed'
}) {
	if (!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
			<div className="relative w-full max-w-md rounded bg-white p-5 shadow-xl">
				<h3 className="text-lg font-semibold mb-3">Choose Quiz Mode</h3>
				<p className="text-sm text-gray-600 mb-4">Select how you want to take the quiz.</p>
				<div className="grid grid-cols-1 gap-3">
					<button
						className={`rounded border px-4 py-2 text-left hover:border-blue-500 ${
							defaultMode === 'normal' ? 'border-blue-500' : 'border-gray-300'
						}`}
						onClick={() => onChoose('normal')}
					>
						<span className="block font-medium">Normal Quiz</span>
						<span className="block text-sm text-gray-600">Answer at your own pace, submit when ready.</span>
					</button>
					<button
						className={`rounded border px-4 py-2 text-left hover:border-blue-500 ${
							defaultMode === 'timed' ? 'border-blue-500' : 'border-gray-300'
						}`}
						onClick={() => onChoose('timed')}
					>
						<span className="block font-medium">Timed Quiz</span>
						<span className="block text-sm text-gray-600">Each question has a countdown and auto-advance.</span>
					</button>
				</div>
				<div className="mt-4 flex justify-end">
					<button className="rounded px-3 py-1.5 border" onClick={onClose}>Close</button>
				</div>
			</div>
		</div>
	)
}


