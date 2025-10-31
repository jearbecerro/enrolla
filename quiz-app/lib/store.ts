import { create } from 'zustand'
import type { BackendQuizResponse, GradeResponse } from '@enrolla/shared'

export type AnswerValue = string | number | number[]

type QuizState = {
	loading: boolean
	error: string | null
	quiz: BackendQuizResponse | null
	answers: Record<string | number, AnswerValue>
	submitting: boolean
	result: GradeResponse | null
	setLoading: (isLoading: boolean) => void
	setError: (errorMessage: string | null) => void
	setQuiz: (quizData: BackendQuizResponse | null) => void
	setAnswer: (questionId: string | number, answerValue: AnswerValue) => void
	setSubmitting: (isSubmitting: boolean) => void
	setResult: (gradeResult: GradeResponse | null) => void
	reset: () => void
}

export const useQuizStore = create<QuizState>((set) => ({
	loading: false,
	error: null,
	quiz: null,
	answers: {},
	submitting: false,
	result: null,
	setLoading: (isLoading) => set({ loading: isLoading }),
	setError: (errorMessage) => set({ error: errorMessage }),
	setQuiz: (quizData) => set({ quiz: quizData }),
	setAnswer: (questionId, answerValue) => set((state) => ({ answers: { ...state.answers, [questionId]: answerValue } })),
	setSubmitting: (isSubmitting) => set({ submitting: isSubmitting }),
	setResult: (gradeResult) => set({ result: gradeResult }),
	reset: () => set({ loading: false, error: null, quiz: null, answers: {}, submitting: false, result: null }),
}))
