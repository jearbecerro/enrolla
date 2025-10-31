import {
	quizSchema,
	submissionSchema,
	backendQuizResponseSchema,
	gradeRequestSchema,
} from './schemas'
import type {
	Quiz,
	Submission,
	BackendQuizResponse,
	GradeRequest,
} from './schemas'

export function validateSubmission(input: Submission): Submission {
	return submissionSchema.parse(input)
}

export function validateQuiz(input: Quiz): Quiz {
	return quizSchema.parse(input)
}

export function validateBackendQuiz(input: BackendQuizResponse): BackendQuizResponse {
	return backendQuizResponseSchema.parse(input)
}

export function validateGradeRequest(input: GradeRequest): GradeRequest {
	return gradeRequestSchema.parse(input)
}
