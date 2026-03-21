import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import tseslint from 'typescript-eslint';

import multilineCallArgumentNewline from './rules/multiline-call-argument-newline.js';
import nonTrivialMultiline from './rules/non-trivial-multiline.js';

const localRules = {
	plugins: {
		local: {
			rules: {
				'multiline-call-argument-newline': multilineCallArgumentNewline,
				'non-trivial-multiline': nonTrivialMultiline,
			},
		},
	},
	rules: {
		'local/multiline-call-argument-newline': 'error',
		'local/non-trivial-multiline': 'error',
	},
} as const;

export function createConfig(options: { tsconfigRootDir: string }) {
	return tseslint.config(
		js.configs.recommended,
		tseslint.configs.recommendedTypeChecked,
		stylistic.configs.customize({
			braceStyle: 'stroustrup',
			indent: 'tab',
			quotes: 'single',
			semi: true,
		}),
		perfectionist.configs['recommended-natural'],
		localRules,
		{
			files: ['src/**/*.ts'],
			languageOptions: {
				parserOptions: {
					project: true,
					tsconfigRootDir: options.tsconfigRootDir,
				},
			},
		},
		{
			// Disable type-checked rules for files outside src (not in tsconfig.json)
			files: ['*.ts', '*.js'],
			...tseslint.configs.disableTypeChecked,
		},
		{
			rules: {
				// One array element per line when any element is multiline
				'@stylistic/array-element-newline': [
					'error',
					{
						consistent: true,
						multiline: true,
					},
				],

				// No trailing commas in function arguments
				'@stylistic/comma-dangle': [
					'error',
					{
						arrays: 'always-multiline',
						functions: 'never',
						objects: 'always-multiline',
					},
				],

				// One argument per line when any argument is on a new line
				'@stylistic/function-call-argument-newline': ['error', 'consistent'],

				// Limit line length
				'@stylistic/max-len': [
					'error',
					{
						code: 120,
					},
				],

				// No multiple statements per line
				'@stylistic/max-statements-per-line': [
					'error',
					{
						max: 1,
					},
				],

				// One object property per line
				'@stylistic/object-curly-newline': [
					'error',
					{
						consistent: true,
						multiline: true,
					},
				],
				'@stylistic/object-property-newline': [
					'error',
					{
						allowAllPropertiesOnSameLine: false,
					},
				],

					// Enforce Array<T> over T[]
				'@typescript-eslint/array-type': ['error', { default: 'generic' }],

				'@typescript-eslint/no-explicit-any': 'off',

				// Require braces for all control structures (no single-line if)
				'curly': ['error', 'all'],

				// No short variable names (min 2 chars)
				// Exceptions: common loop vars, math/coordinate vars
				'id-length': [
					'error',
					{
						exceptions: ['a', 'b', 'i', 'j', 'x', 'y', 'z'],
						min: 2,
					},
				],
			},
		}
	);
}
