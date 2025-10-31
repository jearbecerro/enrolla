import type { BackendQuestion, GradeRequest } from './schemas'

export type GradeOutcome = {
	score: number
	total: number
	results: { id: string | number; correct: boolean }[]
}

// Strategy interface for evaluating answers for a specific question type
export interface AnswerEvaluator {
	evaluate(params: { question: BackendQuestion; submittedValue: string | number | number[] }): boolean
}

// Concrete strategies
export class TextAnswerEvaluator implements AnswerEvaluator {
	evaluate({ question, submittedValue }: { question: BackendQuestion; submittedValue: string | number | number[] }): boolean {
		const submittedText = typeof submittedValue === 'string' ? submittedValue : String(submittedValue ?? '')
		const expectedText = (question.correctText ?? '').trim().toLowerCase()
		return submittedText.trim().toLowerCase() === expectedText
	}
}

export class RadioAnswerEvaluator implements AnswerEvaluator {
	evaluate({ question, submittedValue }: { question: BackendQuestion; submittedValue: string | number | number[] }): boolean {
		if (typeof submittedValue === 'number') {
			return submittedValue === (question.correctIndex ?? -1)
		}
		if (typeof submittedValue === 'string') {
			const submittedIndex = (question.choices ?? []).indexOf(submittedValue)
			return submittedIndex === (question.correctIndex ?? -1)
		}
		return false
	}
}

export class CheckboxAnswerEvaluator implements AnswerEvaluator {
	evaluate({ question, submittedValue }: { question: BackendQuestion; submittedValue: string | number | number[] }): boolean {
		if (!Array.isArray(submittedValue)) return false
		const expectedIndexes = new Set<number>(question.correctIndexes ?? [])
		const submittedIndexes = new Set<number>(submittedValue as number[])
		if (expectedIndexes.size !== submittedIndexes.size) return false
		for (const expectedIndex of expectedIndexes) {
			if (!submittedIndexes.has(expectedIndex)) return false
		}
		return true
	}
}

// Open/Closed Grader with pluggable strategies
export class Grader {
	private readonly evaluatorsByType: ReadonlyMap<BackendQuestion['type'], AnswerEvaluator>

	constructor(evaluators?: Partial<Record<BackendQuestion['type'], AnswerEvaluator>>) {
		const defaults: Record<BackendQuestion['type'], AnswerEvaluator> = {
			text: new TextAnswerEvaluator(),
			radio: new RadioAnswerEvaluator(),
			checkbox: new CheckboxAnswerEvaluator(),
		}
		this.evaluatorsByType = new Map<BackendQuestion['type'], AnswerEvaluator>(
			Object.entries({ ...defaults, ...evaluators }) as [BackendQuestion['type'], AnswerEvaluator][],
		)
	}

	grade(gradeRequest: GradeRequest, questions: BackendQuestion[]): GradeOutcome {
		const questionIdToQuestion = new Map(questions.map((question) => [question.id, question]))
		let totalCorrect = 0
		const results = gradeRequest.answers.map((answer) => {
			const question = questionIdToQuestion.get(answer.id)
			if (!question) return { id: answer.id, correct: false }

			const evaluator = this.evaluatorsByType.get(question.type)
			if (!evaluator) return { id: answer.id, correct: false }

			const isCorrect = evaluator.evaluate({ question, submittedValue: answer.value as string | number | number[] })
			if (isCorrect) totalCorrect += 1
			return { id: answer.id, correct: isCorrect }
		})

		return { score: totalCorrect, total: questions.length, results }
	}
}

// Backwards-compatible functional API built on top of the Grader
export function gradeAnswers(gradeRequest: GradeRequest, questions: BackendQuestion[]): GradeOutcome {
	return new Grader().grade(gradeRequest, questions)
}
