// API configuration for Hono backend
const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export const API_ENDPOINTS = {
	quiz: `${API_BASE_URL}/api/quiz`,
	grade: `${API_BASE_URL}/api/grade`,
} as const

