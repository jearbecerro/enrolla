import type { BackendQuestion } from '@enrolla/shared'

export function getUserAnswerTextFrom(
	question: BackendQuestion | undefined,
	answers: Record<string | number, unknown>,
): string {
	if (!question) return 'No answer'
	const userAnswer = answers[question.id]
	if (userAnswer === undefined || userAnswer === null || userAnswer === '') return 'No answer'
	if (question.type === 'text') {
		return String(userAnswer)
	}
	if (question.type === 'radio') {
		if (typeof userAnswer === 'number') {
			return question.choices?.[userAnswer] || `Choice ${userAnswer}`
		}
		if (typeof userAnswer === 'string') {
			const index = question.choices?.indexOf(userAnswer)
			return index !== undefined && index !== -1 && question.choices ? question.choices[index] : userAnswer
		}
		return String(userAnswer)
	}
	if (question.type === 'checkbox' && Array.isArray(userAnswer)) {
		if (!question.choices) return (userAnswer as number[]).join(', ')
		return (userAnswer as number[])
			.map((index: number) => question.choices![index] || `Choice ${index}`)
			.filter(Boolean)
			.join(', ')
	}
	return String(userAnswer)
}

export function getCorrectAnswerTextFrom(question: BackendQuestion | undefined): string {
	if (!question) return ''
	if (question.type === 'text' && question.correctText) {
		return question.correctText
	}
	if (question.type === 'radio' && typeof question.correctIndex === 'number' && question.choices) {
		return question.choices[question.correctIndex] || ''
	}
	if (question.type === 'checkbox' && Array.isArray(question.correctIndexes) && question.choices) {
		return question.correctIndexes
			.map((index: number) => question.choices![index])
			.filter(Boolean)
			.join(', ')
	}
	return ''
}
