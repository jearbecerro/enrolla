export type EnvBindings = {
	FRONTEND_URL?: string
	ALLOWED_ORIGINS?: string
}

export function normalizeOrigin(value: string): string {
	try {
		const url = new URL(value)
		return url.origin.toLowerCase()
	} catch {
		return value.replace(/\/$/, '').toLowerCase()
	}
}

export function getAllowedOrigins(env?: EnvBindings): string[] {
	const list = env?.ALLOWED_ORIGINS
		?.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
		.map(normalizeOrigin)
	if (list && list.length > 0) return Array.from(new Set(list))
	const single = normalizeOrigin(env?.FRONTEND_URL || 'http://localhost:3000')
	return [single]
}
