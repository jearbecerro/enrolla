'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BackendQuestion } from '@enrolla/shared'
import { useQuizStore } from '@/lib/store'
import { CATEGORIES, type QuizCategory, SECONDS_PER_QUESTION } from '@enrolla/shared'
import { API_ENDPOINTS } from '@/lib/api'
import { useToast } from '@/components/common-ui/Toast'
import { getUserAnswerTextFrom, getCorrectAnswerTextFrom } from '@/lib/answers.utils'
import { shuffleArray } from '@/lib/shuffle'

export default function TimeQuiz() {
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

	const { addToast } = useToast()
	const loadedToastShownRef = useRef(false)

	const [currentIndex, setCurrentIndex] = useState(0)
	const [remaining, setRemaining] = useState(SECONDS_PER_QUESTION)
	const timerRef = useRef<number | null>(null)
	const [startedAt, setStartedAt] = useState<number | null>(null)
	const [finalElapsedSeconds, setFinalElapsedSeconds] = useState<number | null>(null)
	const [examineeName, setExamineeName] = useState('')
	const [category, setCategory] = useState<QuizCategory>('all')
	const [started, setStarted] = useState(false)
	const [, setTick] = useState(0)
	const [expandedQuestions, setExpandedQuestions] = useState<Set<string | number>>(new Set())
	const [perQuestionRemaining, setPerQuestionRemaining] = useState<Record<string | number, number>>({})

	const elapsedSeconds = finalElapsedSeconds ?? (startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)

	// Update elapsed time display every second
	useEffect(() => {
		if (!started || result || !startedAt || finalElapsedSeconds !== null) return
		const intervalId = setInterval(() => {
			setTick((previousTick) => previousTick + 1)
		}, 1000)
		return () => clearInterval(intervalId)
	}, [started, result, startedAt, finalElapsedSeconds])

	useEffect(() => {
		let isCancelled = false
		async function loadQuiz() {
			reset()
			setLoading(true)
			setError(null)
			try {
				const abortController = new AbortController()
				const abortTimer = setTimeout(() => abortController.abort(), 10000)
				const response = await fetch(API_ENDPOINTS.quiz, { cache: 'no-store', signal: abortController.signal })
				clearTimeout(abortTimer)
				if (!response.ok) throw new Error('Failed to fetch quiz')
				const quizPayload = await response.json()
				if (!isCancelled) setQuiz(shuffleArray(quizPayload))
				if (!loadedToastShownRef.current) {
					addToast('Quiz Loaded Successfuly', 'success', 2000)
					loadedToastShownRef.current = true
				}
			} catch (error: unknown) {
				if (!isCancelled) {
					const errorMessage = error instanceof Error ? error.message : 'Error fetching quiz'
					setError(errorMessage)
					addToast(errorMessage, 'error')
				}
			} finally {
				if (!isCancelled) setLoading(false)
			}
		}
		loadQuiz()
		return () => {
			isCancelled = true
			if (timerRef.current) window.clearInterval(timerRef.current)
		}
	}, [addToast, reset, setError, setLoading, setQuiz])

	const filteredQuiz = useMemo(() => {
		if (!quiz) return null
		if (category === 'all') return quiz
		if (category === 'programming') return quiz.filter((question) => String(question.id).startsWith('p'))
		if (category === 'react-next') return quiz.filter((question) => String(question.id) === 'r1' || String(question.id) === 'n1')
		if (category === 'holojs') return quiz.filter((question) => String(question.id).startsWith('h'))
		if (category === 'general') return quiz.filter((question) => /^[0-9]+$/.test(String(question.id)))
		return quiz
	}, [quiz, category])

	const total = filteredQuiz?.length ?? 0
	const current = useMemo(() => (filteredQuiz && filteredQuiz[currentIndex]) || null, [filteredQuiz, currentIndex])

	// Manage per-question countdown
	useEffect(() => {
		if (!current || !started) return
		// initialize remaining for this question from map or default
		const questionId = current.id
		const initial = perQuestionRemaining[questionId] ?? SECONDS_PER_QUESTION
		setRemaining(initial)

		if (timerRef.current) window.clearInterval(timerRef.current)
		timerRef.current = window.setInterval(() => {
			setRemaining((previousRemaining) => {
				const nextValue = previousRemaining <= 1 ? 0 : previousRemaining - 1
				setPerQuestionRemaining((prev) => ({ ...prev, [questionId]: nextValue }))
				if (nextValue === 0) {
					window.clearInterval(timerRef.current!)
					// auto-advance if time ran out and not already last question
					if (currentIndex + 1 < (filteredQuiz?.length ?? 0)) {
						setCurrentIndex((previousIndex) => previousIndex + 1)
					} else {
						submitAll()
					}
				}
				return nextValue
			})
		}, 1000)
		return () => {
			if (timerRef.current) window.clearInterval(timerRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentIndex, total, started])

	function next() {
		if (!filteredQuiz || !current) return
		// persist remaining for current question
		setPerQuestionRemaining((prev) => ({ ...prev, [current.id]: remaining }))
		if (currentIndex + 1 < filteredQuiz.length) {
			setCurrentIndex((previousIndex) => previousIndex + 1)
		}
	}

	function back() {
		if (!filteredQuiz || !current) return
		setPerQuestionRemaining((prev) => ({ ...prev, [current.id]: remaining }))
		setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1))
	}

	function hasAllAnswersFilled(): boolean {
		if (!filteredQuiz) return false
		for (const question of filteredQuiz) {
			const value = answers[question.id]
			if (question.type === 'text') {
				if (!String(value ?? '').trim()) return false
			}
			if (question.type === 'radio') {
				if (!(typeof value === 'number' || typeof value === 'string')) return false
			}
			if (question.type === 'checkbox') {
				if (!Array.isArray(value) || value.length === 0) return false
			}
		}
		return true
	}

	async function submitAll() {
		if (!filteredQuiz) return
		setSubmitting(true)
		setError(null)
		// Stop elapsed time
		if (startedAt) {
			setFinalElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
		}
		try {
			const requestBody = {
				answers: Object.entries(answers).map(([questionId, submittedValue]) => ({
					id: isNaN(Number(questionId)) ? questionId : Number(questionId),
					value: submittedValue,
				})),
			}
			const abortController = new AbortController()
			const abortTimer = setTimeout(() => abortController.abort(), 10000)
			const response = await fetch(API_ENDPOINTS.grade, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: abortController.signal,
			})
			clearTimeout(abortTimer)
			if (!response.ok) throw new Error('Failed to grade')
			const gradeOutcome = await response.json()
			setResult(gradeOutcome)
			addToast('Submission successful!', 'success')
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? (error.name === 'AbortError' ? 'Request timed out' : error.message || 'Error submitting answers') : 'Error submitting answers'
			setError(errorMessage)
			addToast(errorMessage, 'error')
		} finally {
			setSubmitting(false)
		}
	}

	function renderQuestion() {
		if (!current) return null
		return (
			<div className="rounded border bg-white p-4 shadow-sm">
                <div className="font-medium mb-3 whitespace-pre-wrap">{renderQuestionText(current.question)}</div>
				{current.type === 'text' && (
				<input
					type="text"
					className="w-full rounded border px-3 py-2"
					value={(answers[current.id] as string) ?? ''}
					onChange={(event) => setAnswer(current.id, event.target.value)}
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
										onChange={(event) => {
											const nextSelectedIndexes = new Set(selectedIndexes)
											if (event.target.checked) nextSelectedIndexes.add(choiceIndex)
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
		if (!examineeName.trim()) {
			addToast('Please enter your name.', 'error')
			return
		}
		setStarted(true)
		setCurrentIndex(0)
		setRemaining(perQuestionRemaining[(filteredQuiz?.[0]?.id as string | number) ?? ''] ?? SECONDS_PER_QUESTION)
		setStartedAt(Date.now())
	}

    function formatTime(totalSeconds: number) {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    async function handleTryAgain() {
        try {
            reset()
            setError(null)
            setSubmitting(false)
            setResult(null)
            setCurrentIndex(0)
            setRemaining(SECONDS_PER_QUESTION)
            setFinalElapsedSeconds(null)
            setExpandedQuestions(new Set())
            setPerQuestionRemaining({})
            const response = await fetch(API_ENDPOINTS.quiz, { cache: 'no-store' })
            if (response.ok) {
                const payload = await response.json()
                setQuiz(shuffleArray(payload))
                addToast('Quiz reloaded', 'success', 1500)
            }
            setStarted(true)
            setStartedAt(Date.now())
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset quiz'
            setError(errorMessage)
            addToast(errorMessage, 'error')
        }
    }

	function getUserAnswerText(question: BackendQuestion | undefined): string {
		return getUserAnswerTextFrom(question, answers)
	}

	function getCorrectAnswerText(question: BackendQuestion | undefined): string {
		return getCorrectAnswerTextFrom(question)
	}

	function renderQuestionText(text: string) {
		const parts: JSX.Element[] = []
		let remainingText = text
		let partIndex = 0
		while (true) {
			const codeBlockStart = remainingText.indexOf('```')
			if (codeBlockStart === -1) {
				if (remainingText) parts.push(<span key={`text-${partIndex++}`}>{remainingText}</span>)
				break
			}
			const textBeforeCode = remainingText.slice(0, codeBlockStart)
			if (textBeforeCode) parts.push(<span key={`text-${partIndex++}`}>{textBeforeCode}</span>)
			const afterStartMarker = remainingText.slice(0 + 3 + codeBlockStart)
			const codeBlockEnd = afterStartMarker.indexOf('```')
			if (codeBlockEnd === -1) {
				parts.push(<span key={`text-${partIndex++}`}>{'```'}{afterStartMarker}</span>)
				break
			}
			let codeContent = afterStartMarker.slice(0, codeBlockEnd)
			const textAfterCode = afterStartMarker.slice(codeBlockEnd + 3)
			const languageMarkerIndex = codeContent.indexOf('\n')
			if (languageMarkerIndex !== -1 && languageMarkerIndex <= 10) {
				codeContent = codeContent.slice(languageMarkerIndex + 1)
			}
			parts.push(
				<pre key={`code-${partIndex++}`} className="my-2 rounded-md bg-[#1e1e1e] text-gray-100 p-3 overflow-auto text-sm">
					<code className="font-mono">{codeContent}</code>
				</pre>
			)
			remainingText = textAfterCode
		}
		return <>{parts}</>
	}

	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Timed Quiz</h2>
			{loading && <p className="text-gray-500">Loading quiz…</p>}
			{error && (
				<div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
			)}
			{quiz && !result && !started && (
				<div className="space-y-4">
					<div className="rounded border bg-white p-4 shadow-sm space-y-4">
						<h3 className="text-lg font-semibold">Enter details</h3>
						<label className="block">
							<span className="text-sm text-gray-700">Examinee name</span>
						<input
							type="text"
							className="mt-1 w-full rounded border px-3 py-2"
							placeholder="Your name"
							value={examineeName}
							onChange={(event) => setExamineeName(event.target.value)}
						/>
						</label>
						<label className="block">
							<span className="text-sm text-gray-700">Category</span>
							<select
								className="mt-1 w-full rounded border px-3 py-2"
								value={category}
								onChange={(event) => {
									const value = event.target.value
									if (CATEGORIES.includes(value as QuizCategory)) {
										setCategory(value as QuizCategory)
									}
								}}
							>
								{CATEGORIES.map((categoryOption) => (
									<option key={categoryOption} value={categoryOption}>
										{categoryOption === 'all' ? 'All' : categoryOption === 'react-next' ? 'React + Next' : categoryOption.charAt(0).toUpperCase() + categoryOption.slice(1)}
									</option>
								))}
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
					<div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b py-2">
                        <div className="flex items-center justify-between">
							<p className="text-sm text-gray-700">{examineeName ? `Examinee: ${examineeName}` : '\u00A0'}</p>
						<p className="text-xl font-semibold text-blue-700">{remaining}s</p>
							<p className="text-sm text-gray-600">Question {currentIndex + 1} / {total}</p>
						</div>
						<div className="mt-2 h-2 w-full bg-gray-200 rounded">
							<div className="h-2 bg-blue-600 rounded" style={{ width: `${progressPct}%` }} />
						</div>
                    <p className="mt-1 text-xs text-gray-600">Elapsed: {formatTime(elapsedSeconds)} / {formatTime(total * SECONDS_PER_QUESTION)}</p>
					</div>
					{renderQuestion()}
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
				<div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-600 text-xl font-bold text-blue-700">
							{Math.round((result.score / result.total) * 100)}%
						</div>
						<div>
							<p className="font-semibold text-lg">{examineeName ? `${examineeName}'s ` : ''}Score</p>
							<p className="text-gray-700">{result.score} correct out of {result.total}</p>
							<p className="text-sm text-gray-600 mt-1">Elapsed: {formatTime(elapsedSeconds)} / {formatTime(result.total * SECONDS_PER_QUESTION)}</p>
						</div>
					</div>
					<div className="mt-4 grid grid-cols-1 gap-2 text-sm">
						{result.results.map((resultItem, index) => {
							const question = (filteredQuiz ?? quiz)?.find((q: BackendQuestion) => q.id === resultItem.id)
							const isExpanded = expandedQuestions.has(resultItem.id)
							const toggleExpanded = () => {
								setExpandedQuestions((previous) => {
									const next = new Set(previous)
									if (next.has(resultItem.id)) {
										next.delete(resultItem.id)
									} else {
										next.add(resultItem.id)
									}
									return next
								})
							}
							return (
								<div key={resultItem.id} className={`rounded border ${resultItem.correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
									<button
										onClick={toggleExpanded}
										className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-opacity-80 transition-colors"
									>
										<span className={`font-medium ${resultItem.correct ? 'text-green-800' : 'text-red-800'}`}>
											Question {index + 1} — {resultItem.correct ? 'Correct' : 'Incorrect'}
										</span>
										<svg
											className={`w-4 h-4 transition-transform ${resultItem.correct ? 'text-green-800' : 'text-red-800'} ${isExpanded ? 'rotate-180' : ''}`}
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>
									{isExpanded && question && (
										<div className={`px-3 pb-3 border-t ${resultItem.correct ? 'border-green-200' : 'border-red-200'}`}>
											<div className="mt-3 space-y-3">
												<div>
													<p className="font-medium text-gray-700 mb-1">Question:</p>
													<div className="whitespace-pre-wrap">{renderQuestionText(question.question)}</div>
												</div>
												{(question.type === 'radio' || question.type === 'checkbox') && question.choices && (
													<div>
														<p className="font-medium text-gray-700 mb-1">Choices:</p>
														<ul className="list-disc list-inside space-y-1 text-gray-600">
															{question.choices.map((choice, choiceIndex) => (
																<li key={choiceIndex}>{choice}</li>
															))}
														</ul>
													</div>
												)}
												<div>
													<p className="font-medium text-gray-700 mb-1">Your Answer:</p>
													<p className={`font-semibold ${resultItem.correct ? 'text-green-700' : 'text-red-700'}`}>{getUserAnswerText(question)}</p>
												</div>
												<div>
													<p className="font-medium text-gray-700 mb-1">Correct Answer:</p>
													<p className="text-green-700 font-semibold">{getCorrectAnswerText(question)}</p>
												</div>
											</div>
										</div>
									)}
								</div>
							)
						})}
					</div>
					<div className="mt-5 flex items-center justify-end gap-2">
						<button
							onClick={handleTryAgain}
							className="rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-black disabled:opacity-50"
							disabled={submitting}
						>
							Try again
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

function formatTime(totalSeconds: number) {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}


