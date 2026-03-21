import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
	create(context) {
		function check(node: Parameters<Rule.NodeListener['CallExpression']>[0]) {
			const args = node.arguments;
			if (args.length < 2) {
				return;
			}

			const source = context.sourceCode;
			const openParen = source.getTokenBefore(args[0]);
			const closeParen = source.getTokenAfter(
				args[args.length - 1],
				{ filter: (token: { value: string }) => token.value === ')' }
			);

			if (!openParen || !closeParen) {
				return;
			}

			// Only apply when the call spans multiple lines
			if (openParen.loc.start.line === closeParen.loc.end.line) {
				return;
			}

			for (let i = 1; i < args.length; i++) {
				const prev = args[i - 1];
				const curr = args[i];

				if (prev.loc!.end.line === curr.loc!.start.line) {
					const comma = source.getTokenAfter(prev);
					const indent = ' '.repeat(curr.loc!.start.column);

					context.report({
						fix(fixer) {
							return fixer.replaceTextRange(
								[comma!.range![1], curr.range![0]],
								`\n${indent}`
							);
						},
						message: 'Arguments must each be on their own line when the call spans multiple lines.',
						node: curr,
					});
				}
			}

			const lastArg = args[args.length - 1];
			if (lastArg.loc!.end.line === closeParen.loc.start.line) {
				const closeIndent = ' '.repeat(openParen.loc.start.column);

				context.report({
					fix(fixer) {
						return fixer.replaceTextRange(
							[lastArg.range![1], closeParen.range![0]],
							`\n${closeIndent}`
						);
					},
					message: 'Closing parenthesis must be on its own line when the call spans multiple lines.',
					node: closeParen as unknown as Rule.ReportDescriptorNode,
				});
			}
		}

		function checkArray(node: Parameters<Rule.NodeListener['ArrayExpression']>[0]) {
			const elements = node.elements.filter(Boolean) as NonNullable<typeof node.elements[0]>[];
			if (elements.length < 1) {
				return;
			}

			const source = context.sourceCode;
			const openBracket = source.getTokenBefore(elements[0]);
			const closeBracket = source.getTokenAfter(
				elements[elements.length - 1],
				{ filter: (token: { value: string }) => token.value === ']' }
			);

			if (!openBracket || !closeBracket) {
				return;
			}

			// Only apply when the array spans multiple lines
			if (openBracket.loc.start.line === closeBracket.loc.end.line) {
				return;
			}

			for (let i = 1; i < elements.length; i++) {
				const prev = elements[i - 1];
				const curr = elements[i];

				if (prev.loc!.end.line === curr.loc!.start.line) {
					const comma = source.getTokenAfter(prev);
					const indent = ' '.repeat(curr.loc!.start.column);

					context.report({
						fix(fixer) {
							return fixer.replaceTextRange(
								[comma!.range![1], curr.range![0]],
								`\n${indent}`
							);
						},
						message: 'Elements must each be on their own line when the array spans multiple lines.',
						node: curr,
					});
				}
			}

			const lastElement = elements[elements.length - 1];
			if (lastElement.loc!.end.line === closeBracket.loc.start.line) {
				const closeIndent = ' '.repeat(openBracket.loc.start.column);

				context.report({
					fix(fixer) {
						return fixer.replaceTextRange(
							[lastElement.range![1], closeBracket.range![0]],
							`\n${closeIndent}`
						);
					},
					message: 'Closing bracket must be on its own line when the array spans multiple lines.',
					node: closeBracket as unknown as Rule.ReportDescriptorNode,
				});
			}
		}

		return {
			ArrayExpression: checkArray,
			CallExpression: check,
			NewExpression: check,
		};
	},
	meta: {
		docs: { description: 'Require each argument on its own line when a call spans multiple lines' },
		fixable: 'whitespace',
		schema: [],
		type: 'layout',
	},
};

export default rule;
