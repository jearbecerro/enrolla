import { NextResponse } from 'next/server'
import { backendQuizResponseSchema, QUESTION_BANK } from '@enrolla/shared'

export async function GET() {
	try {
		const payload = backendQuizResponseSchema.parse(QUESTION_BANK)
		return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to load quiz'
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
