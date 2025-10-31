'use client'

import { useEffect, useState } from 'react'

type Category = 'all' | 'programming' | 'react-next' | 'holojs' | 'general'

export default function StartOptionsModal({
	open,
	onClose,
	onStart,
	defaultName = '',
	defaultCategory = 'all',
}: {
	open: boolean
	onClose: () => void
	onStart: (name: string, category: Category) => void
	defaultName?: string
	defaultCategory?: Category
}) {
	const [name, setName] = useState(defaultName)
	const [category, setCategory] = useState<Category>(defaultCategory)

	useEffect(() => {
		setName(defaultName)
		setCategory(defaultCategory)
	}, [defaultName, defaultCategory, open])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
			<div className="relative w-full max-w-md rounded bg-white p-5 shadow-xl">
				<h3 className="text-lg font-semibold mb-4">Enter details</h3>
				<label className="block">
					<span className="text-sm text-gray-700">Examinee name</span>
					<input
						type="text"
						className="mt-1 w-full rounded border px-3 py-2"
						placeholder="Your name"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</label>
				<label className="block mt-3">
					<span className="text-sm text-gray-700">Category</span>
					<select
						className="mt-1 w-full rounded border px-3 py-2"
						value={category}
						onChange={(event) => setCategory(event.target.value as Category)}
					>
						<option value="all">All</option>
						<option value="programming">Programming</option>
						<option value="react-next">React + Next</option>
						<option value="holojs">HoloJS</option>
						<option value="general">General</option>
					</select>
				</label>
				<div className="mt-5 flex items-center justify-end gap-2">
					<button className="rounded px-3 py-1.5 border" onClick={onClose}>Cancel</button>
					<button
						className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={!name.trim()}
						onClick={() => onStart(name.trim(), category)}
					>
						Start
					</button>
				</div>
			</div>
		</div>
	)
}


