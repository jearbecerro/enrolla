'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuizStore } from '@/lib/store'

const SECONDS_PER_QUESTION = 30

export default function TimeQuizPage() {
	const {
		loading,
		error,
		quiz,
		answers,
		result,
		submitting,
		setLoading,
		setError,
		setQuiz,
		setAnswer,
		setSubmitting,
		setResult,
		reset,
	} = useQuizStore()

	const [currentIndex, setCurrentIndex] = useState(0)
	const [remaining, setRemaining] = useState(SECONDS_PER_QUESTION)
	const timerRef = useRef<number | null>(null)

	// start screen state
	const [examineeName, setExamineeName] = useState('')
	const [category, setCategory] = useState<'all' | 'programming' | 'react-next' | 'holojs' | 'general'>('all')
	const [started, setStarted] = useState(false)

	useEffect(() => {
		let isCancelled = false
		async function loadQuiz() {
			reset()
			setLoading(true)
			setError(null)
			try {
				const abortController = new AbortController()
				const abortTimer = setTimeout(() => abortController.abort(), 10000)
				const response = await fetch('/api/quiz', { cache: 'no-store', signal: abortController.signal })
				clearTimeout(abortTimer)
				if (!response.ok) throw new Error('Failed to fetch quiz')
				const quizPayload = await response.json()
				if (!isCancelled) setQuiz(quizPayload)
			} catch (error: any) {
				if (!isCancelled) setError(error?.message ?? 'Error fetching quiz')
			} finally {
				if (!isCancelled) setLoading(false)
			}
		}
		loadQuiz()
		return () => {
			isCancelled = true
			if (timerRef.current) window.clearInterval(timerRef.current)
		}
	}, [reset, setError, setLoading, setQuiz])

	// Filtered questions once the quiz is started
	const filteredQuiz = useMemo(() => {
		if (!quiz) return null
		if (category === 'all') return quiz
		if (category === 'programming') return quiz.filter((q: any) => String(q.id).startsWith('p'))
		if (category === 'react-next') return quiz.filter((q: any) => String(q.id) === 'r1' || String(q.id) === 'n1')
		if (category === 'holojs') return quiz.filter((q: any) => String(q.id).startsWith('h'))
		if (category === 'general') return quiz.filter((q: any) => /^[0-9]+$/.test(String(q.id)))
		return quiz
	}, [quiz, category])

	const total = filteredQuiz?.length ?? 0
	const current = useMemo(() => (filteredQuiz && filteredQuiz[currentIndex]) || null, [filteredQuiz, currentIndex])

	// timer per question
	useEffect(() => {
		if (!current) return
		setRemaining(SECONDS_PER_QUESTION)
		if (timerRef.current) window.clearInterval(timerRef.current)
		timerRef.current = window.setInterval(() => {
			setRemaining((s) => {
				if (s <= 1) {
					window.clearInterval(timerRef.current!)
					next()
					return 0
				}
				return s - 1
			})
		}, 1000)
		return () => {
			if (timerRef.current) window.clearInterval(timerRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentIndex, total])

	function next() {
		if (!quiz) return
		if (currentIndex + 1 < (filteredQuiz?.length ?? 0)) {
			setCurrentIndex((i) => i + 1)
		} else {
			submitAll()
		}
	}

	function back() {
		setCurrentIndex((i) => Math.max(0, i - 1))
	}

	async function submitAll() {
		if (!quiz) return
		setSubmitting(true)
		setError(null)
		try {
			const requestBody = {
				answers: Object.entries(answers).map(([questionId, submittedValue]) => ({
					id: isNaN(Number(questionId)) ? questionId : Number(questionId),
					value: submittedValue,
				})),
			}
			const abortController = new AbortController()
			const abortTimer = setTimeout(() => abortController.abort(), 10000)
			const response = await fetch('/api/grade', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: abortController.signal,
			})
			clearTimeout(abortTimer)
			if (!response.ok) throw new Error('Failed to grade')
			const gradeOutcome = await response.json()
			setResult(gradeOutcome)
		} catch (error: any) {
			setError(error?.name === 'AbortError' ? 'Request timed out' : error?.message ?? 'Error submitting answers')
		} finally {
			setSubmitting(false)
		}
	}

	function renderQuestion() {
		if (!current) return null
		return (
			<div className="rounded border bg-white p-4 shadow-sm">
				<p className="font-medium mb-3 whitespace-pre-wrap">
					{current.question}
				</p>
				{current.type === 'text' && (
					<input
						type="text"
						className="w-full rounded border px-3 py-2"
						value={(answers[current.id] as string) ?? ''}
						onChange={(e) => setAnswer(current.id, e.target.value)}
					/>
				)}
				{current.type === 'radio' && (
					<div className="space-y-2">
						{(current.choices ?? []).map((choice: string, choiceIndex: number) => (
							<label key={choiceIndex} className="flex items-center gap-2">
								<input
									type="radio"
									name={`q-${current.id}`}
									checked={answers[current.id] === choiceIndex || answers[current.id] === choice}
									onChange={() => setAnswer(current.id, choiceIndex)}
								/>
								<span>{choice}</span>
							</label>
						))}
					</div>
				)}
				{current.type === 'checkbox' && (
					<div className="space-y-2">
						{(current.choices ?? []).map((choice: string, choiceIndex: number) => {
							const selectedIndexes = Array.isArray(answers[current.id]) ? (answers[current.id] as number[]) : []
							const isChecked = selectedIndexes.includes(choiceIndex)
							return (
								<label key={choiceIndex} className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={isChecked}
										onChange={(e) => {
											const nextSelectedIndexes = new Set(selectedIndexes)
											if (e.target.checked) nextSelectedIndexes.add(choiceIndex)
											else nextSelectedIndexes.delete(choiceIndex)
											setAnswer(current.id, Array.from(nextSelectedIndexes))
										}}
									/>
									<span>{choice}</span>
								</label>
							)
						})}
					</div>
				)}
			</div>
		)
	}

	const progressPct = total ? Math.round(((currentIndex + 1) / total) * 100) : 0

	function startQuiz() {
		if (!quiz) return
		setStarted(true)
		setCurrentIndex(0)
		setRemaining(SECONDS_PER_QUESTION)
	}

	return (
		<main>
			<h1 className="text-2xl font-semibold mb-4">Timed Quiz</h1>
			{loading && <p className="text-gray-500">Loading quiz…</p>}
			{error && (
				<div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
			)}
			{quiz && !result && !started && (
				<div className="space-y-4">
					<div className="rounded border bg-white p-4 shadow-sm space-y-4">
						<h2 className="text-lg font-semibold">Start Timed Quiz</h2>
						<label className="block">
							<span className="text-sm text-gray-700">Examinee name</span>
							<input
								type="text"
								className="mt-1 w-full rounded border px-3 py-2"
								placeholder="Your name"
								value={examineeName}
								onChange={(e) => setExamineeName(e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="text-sm text-gray-700">Category</span>
							<select
								className="mt-1 w-full rounded border px-3 py-2"
								value={category}
								onChange={(e) => setCategory(e.target.value as any)}
							>
								<option value="all">All</option>
								<option value="programming">Programming</option>
								<option value="react-next">React + Next</option>
								<option value="holojs">HoloJS</option>
								<option value="general">General</option>
							</select>
						</label>
						<div className="flex items-center justify-between text-sm text-gray-600">
							<p>Questions available: {filteredQuiz?.length ?? 0}</p>
							<p>Time per question: {SECONDS_PER_QUESTION}s</p>
						</div>
						<button
							onClick={startQuiz}
							className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
							disabled={!examineeName.trim() || (filteredQuiz?.length ?? 0) === 0}
						>
							Start
						</button>
					</div>
				</div>
			)}

			{quiz && !result && started && (
				<div className="space-y-4">
					{/* Sticky header with timer and progress */}
					<div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b py-2">
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-700">{examineeName ? `Examinee: ${examineeName}` : '\u00A0'}</p>
							<p className="text-xl font-semibold text-blue-700">{remaining}s</p>
							<p className="text-sm text-gray-600">Question {currentIndex + 1} / {total}</p>
						</div>
						<div className="mt-2 h-2 w-full bg-gray-200 rounded">
							<div className="h-2 bg-blue-600 rounded" style={{ width: `${progressPct}%` }} />
						</div>
					</div>
					{renderQuestion()}
					{/* Sticky footer with nav buttons */}
					<div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur border-t py-2">
						<div className="flex items-center justify-between">
							<button
								onClick={back}
								className="rounded bg-gray-600 px-3 py-1.5 text-white hover:bg-gray-700 disabled:opacity-50"
								disabled={currentIndex === 0}
							>
								Back
							</button>
							<button
								onClick={next}
								className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
							>
								{currentIndex + 1 < total ? 'Next' : 'Finish'}
							</button>
						</div>
					</div>
				</div>
			)}

			{result && (
				<div className="mt-6 rounded border bg-white p-4 shadow-sm">
					<p className="font-semibold">{examineeName ? `${examineeName}'s ` : ''}Score: {result.score} / {result.total}</p>
					<ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
						{result.results.map((questionResult) => (
							<li key={questionResult.id}>
								Question {String(questionResult.id)}: {questionResult.correct ? 'Correct' : 'Incorrect'}
							</li>
						))}
					</ul>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 rounded bg-gray-700 px-3 py-1.5 text-white hover:bg-gray-800 disabled:opacity-50"
						disabled={submitting}
					>
						Try again
					</button>
				</div>
			)}
		</main>
	)
}


