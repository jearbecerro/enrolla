import { gradeAnswers } from '../../src/logic'
import { QUESTION_BANK } from '../../src/data'

describe('logic: gradeAnswers', () => {
	it('grades all-correct submission', () => {
		const request = {
			answers: [
				{ id: 1, value: 'paris' }, // text
				{ id: 2, value: 1 }, // radio index
				{ id: 3, value: [0, 1, 3] }, // checkbox indexes
				{ id: 'q4', value: 1 },
				{ id: 'q5', value: 'hello' },
				{ id: 'q6', value: [1, 3] },
				{ id: 7, value: 1 }, // radio by index (Jupiter is at index 1)
				{ id: 8, value: 'css' },
			],
		}
		const outcome = gradeAnswers(request as any, QUESTION_BANK)
		expect(outcome.total).toBe(QUESTION_BANK.length)
		expect(outcome.score).toBe(request.answers.length)
		expect(outcome.results.every((result) => result.correct)).toBe(true)
		expect(outcome.results.length).toBe(request.answers.length)
	})

	it('grades some incorrect answers', () => {
		const request = {
			answers: [
				{ id: 1, value: 'lyon' }, // wrong
				{ id: 2, value: 0 }, // wrong
				{ id: 3, value: [0, 1] }, // wrong (missing 3)
				{ id: 'q4', value: 1 }, // correct
			],
		}
		const outcome = gradeAnswers(request as any, QUESTION_BANK)
		expect(outcome.total).toBe(QUESTION_BANK.length)
		expect(outcome.score).toBeLessThan(outcome.total)
		const byId = new Map(outcome.results.map((result) => [result.id, result.correct]))
		expect(byId.get('q4')).toBe(true)
		expect(byId.get(1)).toBe(false)
	})
})
