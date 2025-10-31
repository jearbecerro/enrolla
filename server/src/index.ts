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
import { getAllowedOrigins, type EnvBindings } from './utils'

type Env = EnvBindings

const app = new Hono<{ Bindings: Env }>()

// CORS middleware - allow headers through; validate in next middleware
app.use(
	'/*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
)

// Validate CORS origin and return 400 if not allowed (after CORS headers are set)
app.use('/*', async (context, next) => {
	const requestOriginHeader = context.req.header('origin')
	const allowedOrigins = getAllowedOrigins(context.env)

	if (!requestOriginHeader || context.req.method === 'OPTIONS') {
		return next()
	}

	const requested = requestOriginHeader

	if (!allowedOrigins.includes(requested.toLowerCase().replace(/\/$/, ''))) {
		context.header('Access-Control-Allow-Origin', requestOriginHeader)
		console.error(
			`CORS rejection: requested origin "${requested}" not in allowed list [${allowedOrigins.join(', ')}]`,
		)
		return context.json(
			{
				error: 'CORS: Origin not allowed',
				details: {
					requested,
					allowed: allowedOrigins,
					hint:
						"Set ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL in Cloudflare Workers' environment variables",
				},
			},
			400,
		)
	}

	context.header('Access-Control-Allow-Origin', requestOriginHeader)
	return next()
})

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
