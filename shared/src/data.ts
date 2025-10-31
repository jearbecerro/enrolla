import { backendQuestionSchema } from './schemas'
import type { BackendQuestion } from './schemas'

export type QuizCategory = 'all' | 'programming' | 'react-next' | 'holojs' | 'general'

export const CATEGORIES: readonly QuizCategory[] = ['all', 'programming', 'react-next', 'holojs', 'general'] as const

export const SECONDS_PER_QUESTION = 30

// In-memory question bank (demo/stable). 8-12 questions
export const QUESTION_BANK: BackendQuestion[] = backendQuestionSchema.array().parse([
	{
		id: 1,
		type: 'text',
		question: 'What is the capital of France?',
		correctText: 'paris',
	},
	{
		id: 2,
		type: 'radio',
		question: '2 + 2 = ?',
		choices: ['3', '4', '5'],
		correctIndex: 1,
	},
	{
		id: 3,
		type: 'checkbox',
		question: 'Select prime numbers',
		choices: ['2', '3', '4', '5'],
		correctIndexes: [0, 1, 3],
	},
	{
		id: 'q4',
		type: 'radio',
		question: 'The color of the sky on a clear day?',
		choices: ['Green', 'Blue', 'Red'],
		correctIndex: 1,
	},
	{
		id: 'q5',
		type: 'text',
		question: 'Type the word "hello" in lowercase',
		correctText: 'hello',
	},
	{
		id: 'q6',
		type: 'checkbox',
		question: 'Select even numbers',
		choices: ['1', '2', '3', '4'],
		correctIndexes: [1, 3],
	},
	{
		id: 7,
		type: 'radio',
		question: 'Largest planet?',
		choices: ['Earth', 'Jupiter', 'Mars'],
		correctIndex: 1,
	},
	{
		id: 8,
		type: 'text',
		question: 'Abbreviation for Cascading Style Sheets?',
		correctText: 'css',
	},
	// Programming output and framework trivia
	{
		id: 'p1',
		type: 'radio',
		question: 'What is the output of the following code?\n```js\nconsole.log(typeof null)\n```',
		choices: ['null', 'object', 'undefined', 'number'],
		correctIndex: 1,
	},
	{
		id: 'p2',
		type: 'radio',
		question: 'What does this print?\n```js\nlet x = 0;\n(async () => {\n  x += await Promise.resolve(2);\n  console.log(x);\n})();\n```',
		choices: ['0', '2', 'NaN', 'undefined'],
		correctIndex: 1,
	},
	{
		id: 'r1',
		type: 'radio',
		question: 'In React, which hook memoizes a computed value?',
		choices: ['useEffect', 'useMemo', 'useCallback', 'useRef'],
		correctIndex: 1,
	},
	{
		id: 'n1',
		type: 'radio',
		question: 'In Next.js App Router, components are by default…',
		choices: ['Client Components', 'Server Components', 'Edge Components', 'Static Components only'],
		correctIndex: 1,
	},
	{
		id: 'h1',
		type: 'radio',
		question: 'HoloJS is primarily associated with which platform?',
		choices: ['HoloLens', 'React Native', 'Electron', 'Chrome Extensions'],
		correctIndex: 0,
	},
])
