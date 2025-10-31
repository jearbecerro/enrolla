import { validateBackendQuiz, validateGradeRequest, validateQuiz, validateSubmission } from '../../src/validator'

describe('validator', () => {
	it('validateBackendQuiz accepts valid questions array', () => {
		const arr = validateBackendQuiz([
			{ id: 1, type: 'text', question: 'q', correctText: 'a' },
		])
		expect(arr[0].id).toBe(1)
	})

	it('validateBackendQuiz throws on invalid config', () => {
		expect(() => validateBackendQuiz([{ id: 2, type: 'radio', question: 'q' } as any])).toThrow()
	})

	it('validateGradeRequest accepts mixed answer types', () => {
		const req = validateGradeRequest({
			answers: [
				{ id: 1, value: 'foo' },
				{ id: 2, value: 0 },
				{ id: 3, value: [1, 2] },
			],
		})
		expect(req.answers).toHaveLength(3)
	})

	it('validateGradeRequest throws on wrong value type', () => {
		expect(() => validateGradeRequest({ answers: [{ id: 1, value: { bad: true } as any }] })).toThrow()
	})

	it('validateQuiz and validateSubmission basic acceptance', () => {
		const quiz = validateQuiz({
			id: 'qz',
			title: 'Sample',
			questions: [{ id: 'q1', prompt: 'P?', type: 'text', options: ['a', 'b'] }],
		})
		expect(quiz.title).toBe('Sample')

		const submission = validateSubmission({
			quizId: 'qz',
			answers: [{ questionId: 'q1', value: 'a' }],
		})
		expect(submission.quizId).toBe('qz')
	})
})


