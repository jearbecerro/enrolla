import type { Config } from 'jest'

const config: Config = {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				useESM: true,
				tsconfig: {
					module: 'esnext',
					esModuleInterop: true,
				},
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	testMatch: ['**/__tests__/**/*.test.ts'],
}

export default config


