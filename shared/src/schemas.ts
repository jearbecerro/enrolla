import { z } from 'zod'

export const questionTypeSchema = z.enum(['text', 'checkbox', 'radio'])

export const questionSchema = z.object({
	id: z.string().min(1),
	prompt: z.string().min(1),
	type: questionTypeSchema,
	options: z.array(z.string()).optional(),
})

export const quizSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	questions: z.array(questionSchema).min(1),
})

export const answerSchema = z.object({
	questionId: z.string(),
	value: z.union([z.string(), z.array(z.string())]),
})

export const submissionSchema = z.object({
	quizId: z.string(),
	answers: z.array(answerSchema),
})

export const gradeResultSchema = z.object({
	score: z.number().min(0),
	maxScore: z.number().min(0),
	correctCount: z.number().min(0),
	totalCount: z.number().min(0),
})

export const backendQuestionSchema = z.object({
	id: z.union([z.string(), z.number()]),
	type: questionTypeSchema,
	question: z.string().min(1),
	choices: z.array(z.string()).optional(),
	correctIndex: z.number().int().nonnegative().optional(),
	correctIndexes: z.array(z.number().int().nonnegative()).optional(),
	correctText: z.string().optional(),
}).refine((q) => {
	if (q.type === 'text') return typeof q.correctText === 'string'
	if (q.type === 'radio') return typeof q.correctIndex === 'number' && Array.isArray(q.choices)
	if (q.type === 'checkbox') return Array.isArray(q.correctIndexes) && Array.isArray(q.choices)
	return false
}, { message: 'Invalid grading fields for question type' })

export const backendQuizResponseSchema = z.array(backendQuestionSchema).min(1)

export const gradeRequestSchema = z.object({
	answers: z.array(z.object({
		id: z.union([z.string(), z.number()]),
		value: z.union([
			z.string(),
			z.number(),
			z.array(z.number().int().nonnegative()),
		]),
	})),
})

export const gradeResponseSchema = z.object({
	score: z.number().int().nonnegative(),
	total: z.number().int().nonnegative(),
	results: z.array(z.object({ id: z.union([z.string(), z.number()]), correct: z.boolean() })),
})

export type Question = z.infer<typeof questionSchema>
export type Quiz = z.infer<typeof quizSchema>
export type Answer = z.infer<typeof answerSchema>
export type Submission = z.infer<typeof submissionSchema>
export type GradeResult = z.infer<typeof gradeResultSchema>
export type BackendQuestion = z.infer<typeof backendQuestionSchema>
export type BackendQuizResponse = z.infer<typeof backendQuizResponseSchema>
export type GradeRequest = z.infer<typeof gradeRequestSchema>
export type GradeResponse = z.infer<typeof gradeResponseSchema>
