import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { QUESTION_BANK, validateGradeRequest, type GradeRequest, gradeAnswers } from '@enrolla/shared'

export async function POST(req: Request) {
	let requestBody: GradeRequest
	try {
		requestBody = (await req.json()) as GradeRequest
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid JSON'
		return NextResponse.json({ error: errorMessage }, { status: 400 })
	}

	let validatedRequest
	try {
		validatedRequest = validateGradeRequest(requestBody)
	} catch (error) {
		const errorDetails = error instanceof ZodError ? error.errors : 'Invalid payload'
		return NextResponse.json({ error: errorDetails }, { status: 400 })
	}

	const outcome = gradeAnswers(validatedRequest, QUESTION_BANK)
	return NextResponse.json(
		{ score: outcome.score, total: outcome.total, results: outcome.results },
		{ headers: { 'Cache-Control': 'no-store' } },
	)
}
