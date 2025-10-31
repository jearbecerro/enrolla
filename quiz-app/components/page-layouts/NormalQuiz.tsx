'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BackendQuestion } from '@enrolla/shared'
import { useQuizStore } from '@/lib/store'
import { CATEGORIES, type QuizCategory } from '@enrolla/shared'
import { API_ENDPOINTS } from '@/lib/api'
import { useToast } from '@/components/common-ui/Toast'
import { getUserAnswerTextFrom, getCorrectAnswerTextFrom } from '@/lib/answers.utils'

export default function NormalQuiz() {
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
	} = useQuizStore()

	const { addToast } = useToast()
	const loadedToastShownRef = useRef(false)

    const [started, setStarted] = useState(false)
    const [examineeName, setExamineeName] = useState('')
    const [category, setCategory] = useState<QuizCategory>('all')
    const elapsedRef = useRef<number | null>(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string | number>>(new Set())

	useEffect(() => {
		let isCancelled = false
		async function loadQuiz() {
			setLoading(true)
			setError(null)
			try {
				const abortController = new AbortController()
				const abortTimer = setTimeout(() => abortController.abort(), 10000)
				const response = await fetch(API_ENDPOINTS.quiz, { cache: 'no-store', signal: abortController.signal })
				clearTimeout(abortTimer)
				if (!response.ok) throw new Error('Failed to fetch quiz')
				const quizPayload = await response.json()
				if (!isCancelled) setQuiz(quizPayload)
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
		}
	}, [addToast, setError, setLoading, setQuiz])

    // Start/stop elapsed timer
    useEffect(() => {
        if (!started || result) {
            if (elapsedRef.current) {
                window.clearInterval(elapsedRef.current)
                elapsedRef.current = null
            }
            return
        }
        if (elapsedRef.current) window.clearInterval(elapsedRef.current)
        elapsedRef.current = window.setInterval(() => setElapsedSeconds((previousSeconds) => previousSeconds + 1), 1000)
        return () => {
            if (elapsedRef.current) {
                window.clearInterval(elapsedRef.current)
                elapsedRef.current = null
            }
        }
    }, [started, result])

	const filteredQuiz = useMemo(() => {
		if (!quiz) return null
		if (category === 'all') return quiz
		if (category === 'programming') return quiz.filter((question) => String(question.id).startsWith('p'))
		if (category === 'react-next') return quiz.filter((question) => String(question.id) === 'r1' || String(question.id) === 'n1')
		if (category === 'holojs') return quiz.filter((question) => String(question.id).startsWith('h'))
		if (category === 'general') return quiz.filter((question) => /^[0-9]+$/.test(String(question.id)))
		return quiz
	}, [quiz, category])

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

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault()
        if (!filteredQuiz) return
		if (!hasAllAnswersFilled()) {
			addToast('Please answer all questions before submitting.', 'error')
			return
		}
		setSubmitting(true)
		setError(null)
		// Stop elapsed timer
		if (elapsedRef.current) {
			window.clearInterval(elapsedRef.current)
			elapsedRef.current = null
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
			const afterStartMarker = remainingText.slice(codeBlockStart + 3)
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

	function formatTime(totalSeconds: number) {
		const minutes = Math.floor(totalSeconds / 60)
		const seconds = totalSeconds % 60
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
	}

	async function handleTryAgain() {
		try {
			setResult(null)
			setSubmitting(false)
			setError(null)
			setElapsedSeconds(0)
			setExpandedQuestions(new Set())
			const response = await fetch(API_ENDPOINTS.quiz, { cache: 'no-store' })
			if (response.ok) {
				const payload = await response.json()
				setQuiz(payload)
				addToast('Quiz reloaded', 'success', 1500)
			}
			setStarted(true)
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

	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Normal Quiz</h2>
			{loading && <p className="text-gray-500">Loading quiz…</p>}
			{error && (
				<div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
			)}
            {quiz && !started && (
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
                        </div>
                        <button
                            onClick={() => {
								if (!examineeName.trim()) {
									addToast('Please enter your name.', 'error')
									return
								}
								setStarted(true)
							}}
                            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            disabled={!examineeName.trim() || (filteredQuiz?.length ?? 0) === 0}
                        >
                            Start
                        </button>
                    </div>
                </div>
            )}
            {filteredQuiz && started && (
				<form onSubmit={onSubmit} className="space-y-6">
					{filteredQuiz.map((question) => (
						<div key={question.id} className="rounded border bg-white p-4 shadow-sm">
                            <div className="font-medium mb-3 whitespace-pre-wrap">{renderQuestionText(question.question)}</div>
							{question.type === 'text' && (
								<input
									type="text"
									className="w-full rounded border px-3 py-2"
									value={(answers[question.id] as string) ?? ''}
									onChange={(event) => setAnswer(question.id, event.target.value)}
								/>
							)}
							{question.type === 'radio' && (
								<div className="space-y-2">
									{(question.choices ?? []).map((choice: string, choiceIndex: number) => (
										<label key={choiceIndex} className="flex items-center gap-2">
											<input
												type="radio"
												name={`q-${question.id}`}
												checked={answers[question.id] === choiceIndex || answers[question.id] === choice}
												onChange={() => setAnswer(question.id, choiceIndex)}
											/>
											<span>{choice}</span>
										</label>
									))}
								</div>
							)}
							{question.type === 'checkbox' && (
								<div className="space-y-2">
									{(question.choices ?? []).map((choice: string, choiceIndex: number) => {
										const selectedIndexes = Array.isArray(answers[question.id]) ? (answers[question.id] as number[]) : []
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
														setAnswer(question.id, Array.from(nextSelectedIndexes))
													}}
												/>
												<span>{choice}</span>
											</label>
										)
									})}
								</div>
							)}
						</div>
					))}
					<button
						type="submit"
						className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={submitting}
					>
						{submitting ? 'Submitting…' : 'Submit'}
					</button>
				</form>
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
                            <p className="text-sm text-gray-600 mt-1">Elapsed: {formatTime(elapsedSeconds)}</p>
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


