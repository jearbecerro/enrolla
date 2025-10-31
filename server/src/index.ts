import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ZodError } from 'zod'
import {
	backendQuizResponseSchema,
	validateBackendQuiz,
	validateGradeRequest,
	gradeAnswers,
	QUESTION_BANK,
	type GradeRequest,
} from '@enrolla/shared'
import { getAllowedOrigins, type EnvBindings, normalizeOrigin } from './utils'

type Env = EnvBindings

const app = new Hono<{ Bindings: Env }>()

// Single CORS middleware that validates allowed origins and supports preflight
app.use(
	'/*',
	cors({
		origin: (origin, context) => {
			const allowedOrigins = getAllowedOrigins(context.env)
			if (!origin) return allowedOrigins[0]
			const requested = normalizeOrigin(origin)
			return allowedOrigins.includes(requested) ? origin : ''
		},
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['*'],
	})
)

app.get('/', ({ text }) => text('OK'))

app.get('/health', ({ json }) => json({ ok: true }))

// Validate question bank on startup
const VALID_QUESTIONS = validateBackendQuiz(QUESTION_BANK)

app.get('/api/quiz', ({ header, json }) => {
	try {
		const quizPayload = backendQuizResponseSchema.parse(VALID_QUESTIONS)
		header('Cache-Control', 'no-store')
		return json(quizPayload)
	} catch (error) {
		return json({ error: 'Failed to load quiz' }, 500)
	}
})

app.post('/api/grade', async ({ req, header, json }) => {
	let gradeRequest: GradeRequest
	try {
		gradeRequest = (await req.json()) as GradeRequest
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid JSON'
		return json({ error: errorMessage }, 400)
	}

	let validatedRequest
	try {
		validatedRequest = validateGradeRequest(gradeRequest)
	} catch (validationError) {
		const errorDetails = validationError instanceof ZodError ? validationError.errors : 'Invalid payload'
		return json({ error: errorDetails }, 400)
	}

	const outcome = gradeAnswers(validatedRequest, VALID_QUESTIONS)
	header('Cache-Control', 'no-store')
	return json({ score: outcome.score, total: outcome.total, results: outcome.results })
})

export default app
