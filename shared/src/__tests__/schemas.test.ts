import { backendQuestionSchema, gradeRequestSchema, backendQuizResponseSchema } from '../../src/schemas'

describe('schemas: backendQuestionSchema', () => {
	it('validates text question with correctText', () => {
		const value = backendQuestionSchema.parse({
			id: 't1',
			type: 'text',
			question: 'Your name?',
			correctText: 'alice',
		})
		expect(value.correctText).toBe('alice')
	})

	it('rejects text question without correctText', () => {
		expect(() => backendQuestionSchema.parse({ id: 1, type: 'text', question: 'q' })).toThrow(
			/Invalid grading fields for question type/,
		)
	})

	it('validates radio question with choices and correctIndex', () => {
		const value = backendQuestionSchema.parse({
			id: 2,
			type: 'radio',
			question: 'Pick one',
			choices: ['a', 'b'],
			correctIndex: 1,
		})
		expect(value.correctIndex).toBe(1)
	})

	it('rejects radio question missing choices or correctIndex', () => {
		expect(() =>
			backendQuestionSchema.parse({ id: 2, type: 'radio', question: 'Pick one', choices: ['a', 'b'] }),
		).toThrow(/Invalid grading fields/)
		expect(() =>
			backendQuestionSchema.parse({ id: 2, type: 'radio', question: 'Pick one', correctIndex: 0 }),
		).toThrow(/Invalid grading fields/)
	})

	it('validates checkbox question with choices and correctIndexes', () => {
		const value = backendQuestionSchema.parse({
			id: 3,
			type: 'checkbox',
			question: 'Pick many',
			choices: ['a', 'b', 'c'],
			correctIndexes: [0, 2],
		})
		expect(value.correctIndexes).toEqual([0, 2])
	})

	it('rejects checkbox question missing choices or correctIndexes', () => {
		expect(() =>
			backendQuestionSchema.parse({ id: 3, type: 'checkbox', question: 'Pick many', choices: ['a'] }),
		).toThrow(/Invalid grading fields/)
		expect(() =>
			backendQuestionSchema.parse({ id: 3, type: 'checkbox', question: 'Pick many', correctIndexes: [0] }),
		).toThrow(/Invalid grading fields/)
	})
})

describe('schemas: containers', () => {
	it('accepts a valid backend quiz response array', () => {
		const arr = backendQuizResponseSchema.parse([
			{ id: 1, type: 'text', question: 'q', correctText: 'a' },
		])
		expect(arr).toHaveLength(1)
	})

	it('validates grade request answers of mixed types', () => {
		const req = gradeRequestSchema.parse({
			answers: [
				{ id: 1, value: 'foo' },
				{ id: 2, value: 1 },
				{ id: 3, value: [0, 2] },
			],
		})
		expect(req.answers[2].value).toEqual([0, 2])
	})
})


