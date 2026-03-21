import type { Rule } from 'eslint';
import type { Node } from 'estree';

const COMPLEX_TYPES = new Set([
	'ArrayExpression',
	'ArrowFunctionExpression',
	'FunctionExpression',
	'ObjectExpression',
]);

function isNonTrivial(node: Node): boolean {
	if (node.type === 'NewExpression' || node.type === 'CallExpression') {
		return true;
	}
	if (node.type === 'ObjectExpression') {
		return node.properties.some(
			prop => prop.type === 'Property' && prop.value && COMPLEX_TYPES.has(prop.value.type)
		);
	}
	if (node.type === 'ArrayExpression') {
		return node.elements.some(el => el && COMPLEX_TYPES.has(el.type));
	}
	return false;
}

const rule: Rule.RuleModule = {
	create(context) {
		function checkItems(
			node: Rule.ReportDescriptorNode,
			items: Node[],
			openToken: { range?: [number, number]; loc: { start: { line: number; column: number } } }
		) {
			if (items.length < 2) {
				return;
			}

			const firstItem = items[0];

			// Only apply when all items are on the same line as the opening token
			if (firstItem.loc!.start.line !== openToken.loc.start.line) {
				return;
			}

			if (!items.some(isNonTrivial)) {
				return;
			}

			context.report({
				fix(fixer) {
					const indent = '\t'.repeat(openToken.loc.start.column) + '\t';
					return fixer.replaceTextRange(
						[openToken.range![1], firstItem.range![0]],
						`\n${indent}`
					);
				},
				message: 'Expand to multiple lines when items are non-trivial.',
				node,
			});
		}

		function checkCall(node: Parameters<Rule.NodeListener['CallExpression']>[0]) {
			const source = context.sourceCode;
			const openParen = source.getTokenBefore(node.arguments[0]);
			if (!openParen) {
				return;
			}
			checkItems(node, node.arguments as unknown as Node[], openParen);
		}

		function checkArray(node: Parameters<Rule.NodeListener['ArrayExpression']>[0]) {
			const elements = node.elements.filter(Boolean) as NonNullable<typeof node.elements[0]>[];
			if (elements.length < 2) {
				return;
			}

			// For arrays, any object/array/function element is non-trivial
			const hasComplexElement = elements.some(el => COMPLEX_TYPES.has(el.type));
			if (!hasComplexElement) {
				return;
			}

			const source = context.sourceCode;
			const openBracket = source.getTokenBefore(elements[0]);
			const firstElement = elements[0];

			if (!openBracket) {
				return;
			}

			if (firstElement.loc!.start.line !== openBracket.loc.start.line) {
				return;
			}

			context.report({
				fix(fixer) {
					const indent = '\t'.repeat(openBracket.loc.start.column) + '\t';
					return fixer.replaceTextRange(
						[openBracket.range![1], firstElement.range![0]],
						`\n${indent}`
					);
				},
				message: 'Expand array to multiple lines when elements are non-trivial.',
				node,
			});
		}

		return {
			ArrayExpression: checkArray,
			CallExpression(node) {
				if (node.arguments.length >= 2) {
					checkCall(node);
				}
			},
			NewExpression(node) {
				if (node.arguments.length >= 2) {
					checkCall(node);
				}
			},
		};
	},
	meta: {
		docs: { description: 'Force multiline when call arguments contain non-trivial expressions' },
		fixable: 'whitespace',
		schema: [],
		type: 'layout',
	},
};

export default rule;
