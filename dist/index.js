// src/index.ts
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

// src/rules/multiline-call-argument-newline.ts
var rule = {
  create(context) {
    function check(node) {
      const args = node.arguments;
      if (args.length < 2) {
        return;
      }
      const source = context.sourceCode;
      const openParen = source.getTokenBefore(args[0]);
      const closeParen = source.getTokenAfter(args[args.length - 1], { filter: (token) => token.value === ")" });
      if (!openParen || !closeParen) {
        return;
      }
      if (openParen.loc.start.line === closeParen.loc.end.line) {
        return;
      }
      for (let i = 1;i < args.length; i++) {
        const prev = args[i - 1];
        const curr = args[i];
        if (prev.loc.end.line === curr.loc.start.line) {
          const comma = source.getTokenAfter(prev);
          const indent = " ".repeat(curr.loc.start.column);
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange([comma.range[1], curr.range[0]], `
${indent}`);
            },
            message: "Arguments must each be on their own line when the call spans multiple lines.",
            node: curr
          });
        }
      }
      const lastArg = args[args.length - 1];
      if (lastArg.loc.end.line === closeParen.loc.start.line) {
        const closeIndent = " ".repeat(openParen.loc.start.column);
        context.report({
          fix(fixer) {
            return fixer.replaceTextRange([lastArg.range[1], closeParen.range[0]], `
${closeIndent}`);
          },
          message: "Closing parenthesis must be on its own line when the call spans multiple lines.",
          node: closeParen
        });
      }
    }
    function checkArray(node) {
      const elements = node.elements.filter(Boolean);
      if (elements.length < 1) {
        return;
      }
      const source = context.sourceCode;
      const openBracket = source.getTokenBefore(elements[0]);
      const closeBracket = source.getTokenAfter(elements[elements.length - 1], { filter: (token) => token.value === "]" });
      if (!openBracket || !closeBracket) {
        return;
      }
      if (openBracket.loc.start.line === closeBracket.loc.end.line) {
        return;
      }
      for (let i = 1;i < elements.length; i++) {
        const prev = elements[i - 1];
        const curr = elements[i];
        if (prev.loc.end.line === curr.loc.start.line) {
          const comma = source.getTokenAfter(prev);
          const indent = " ".repeat(curr.loc.start.column);
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange([comma.range[1], curr.range[0]], `
${indent}`);
            },
            message: "Elements must each be on their own line when the array spans multiple lines.",
            node: curr
          });
        }
      }
      const lastElement = elements[elements.length - 1];
      if (lastElement.loc.end.line === closeBracket.loc.start.line) {
        const closeIndent = " ".repeat(openBracket.loc.start.column);
        context.report({
          fix(fixer) {
            return fixer.replaceTextRange([lastElement.range[1], closeBracket.range[0]], `
${closeIndent}`);
          },
          message: "Closing bracket must be on its own line when the array spans multiple lines.",
          node: closeBracket
        });
      }
    }
    return {
      ArrayExpression: checkArray,
      CallExpression: check,
      NewExpression: check
    };
  },
  meta: {
    docs: { description: "Require each argument on its own line when a call spans multiple lines" },
    fixable: "whitespace",
    schema: [],
    type: "layout"
  }
};
var multiline_call_argument_newline_default = rule;

// src/rules/non-trivial-multiline.ts
var COMPLEX_TYPES = new Set([
  "ArrayExpression",
  "ArrowFunctionExpression",
  "FunctionExpression",
  "ObjectExpression"
]);
function isNonTrivial(node) {
  if (node.type === "NewExpression" || node.type === "CallExpression") {
    return true;
  }
  if (node.type === "ObjectExpression") {
    return node.properties.some((prop) => prop.type === "Property" && prop.value && COMPLEX_TYPES.has(prop.value.type));
  }
  if (node.type === "ArrayExpression") {
    return node.elements.some((el) => el && COMPLEX_TYPES.has(el.type));
  }
  return false;
}
var rule2 = {
  create(context) {
    function checkItems(node, items, openToken) {
      if (items.length < 2) {
        return;
      }
      const firstItem = items[0];
      if (firstItem.loc.start.line !== openToken.loc.start.line) {
        return;
      }
      if (!items.some(isNonTrivial)) {
        return;
      }
      context.report({
        fix(fixer) {
          const indent = "\t".repeat(openToken.loc.start.column) + "\t";
          return fixer.replaceTextRange([openToken.range[1], firstItem.range[0]], `
${indent}`);
        },
        message: "Expand to multiple lines when items are non-trivial.",
        node
      });
    }
    function checkCall(node) {
      const source = context.sourceCode;
      const openParen = source.getTokenBefore(node.arguments[0]);
      if (!openParen) {
        return;
      }
      checkItems(node, node.arguments, openParen);
    }
    function checkArray(node) {
      const elements = node.elements.filter(Boolean);
      if (elements.length < 2) {
        return;
      }
      const hasComplexElement = elements.some((el) => COMPLEX_TYPES.has(el.type));
      if (!hasComplexElement) {
        return;
      }
      const source = context.sourceCode;
      const openBracket = source.getTokenBefore(elements[0]);
      const firstElement = elements[0];
      if (!openBracket) {
        return;
      }
      if (firstElement.loc.start.line !== openBracket.loc.start.line) {
        return;
      }
      context.report({
        fix(fixer) {
          const indent = "\t".repeat(openBracket.loc.start.column) + "\t";
          return fixer.replaceTextRange([openBracket.range[1], firstElement.range[0]], `
${indent}`);
        },
        message: "Expand array to multiple lines when elements are non-trivial.",
        node
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
      }
    };
  },
  meta: {
    docs: { description: "Force multiline when call arguments contain non-trivial expressions" },
    fixable: "whitespace",
    schema: [],
    type: "layout"
  }
};
var non_trivial_multiline_default = rule2;

// src/index.ts
var localRules = {
  plugins: {
    local: {
      rules: {
        "multiline-call-argument-newline": multiline_call_argument_newline_default,
        "non-trivial-multiline": non_trivial_multiline_default
      }
    }
  },
  rules: {
    "local/multiline-call-argument-newline": "error",
    "local/non-trivial-multiline": "error"
  }
};
function createConfig(options) {
  return tseslint.config(js.configs.recommended, tseslint.configs.recommendedTypeChecked, stylistic.configs.customize({
    braceStyle: "stroustrup",
    indent: "tab",
    quotes: "single",
    semi: true
  }), perfectionist.configs["recommended-natural"], localRules, {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: options.tsconfigRootDir
      }
    }
  }, {
    files: ["*.ts", "*.js"],
    ...tseslint.configs.disableTypeChecked
  }, {
    rules: {
      "@stylistic/array-element-newline": [
        "error",
        {
          consistent: true,
          multiline: true
        }
      ],
      "@stylistic/comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          functions: "never",
          objects: "always-multiline"
        }
      ],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/max-len": [
        "error",
        {
          code: 120
        }
      ],
      "@stylistic/max-statements-per-line": [
        "error",
        {
          max: 1
        }
      ],
      "@stylistic/object-curly-newline": [
        "error",
        {
          consistent: true,
          multiline: true
        }
      ],
      "@stylistic/object-property-newline": [
        "error",
        {
          allowAllPropertiesOnSameLine: false
        }
      ],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-explicit-any": "off",
      curly: ["error", "all"],
      "id-length": [
        "error",
        {
          exceptions: ["a", "b", "i", "j", "x", "y", "z"],
          min: 2
        }
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          customGroups: [
            {
              elementNamePattern: "^_",
              groupName: "private-variables",
              selector: "property"
            },
            {
              groupName: "variables",
              selector: "property"
            },
            {
              groupName: "functions",
              selector: "method"
            }
          ],
          groups: ["private-variables", "variables", "functions", "unknown"],
          newlinesBetween: 1,
          order: "asc",
          type: "natural"
        }
      ]
    }
  });
}
export {
  createConfig
};
