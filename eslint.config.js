import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default [
    // Bloc pour ignorer des fichiers
    {
        ignores: [
            'node_modules/',
            '**/node_modules/',
            '/**/node_modules/*',
            'dist/',
            '.nuxt/*'
        ],
    },

    // Base ESLint recommended rules
    js.configs.recommended,

    // Vue 3 recommended rules
    ...vue.configs['flat/recommended'],

    {
        plugins: {
            '@stylistic': stylistic
        },
        files: ['**/*.js', '**/*.vue', '**/*.mjs', '**/*.cjs'],

        rules: {
            'indent': ['error', 4],
            'vue/html-indent': ['error', 4],
            'vue/script-indent': 'off',
            'space-before-function-paren': ['error', 'always'],
            'space-infix-ops': ['error'],
            'vue/component-name-in-template-casing': ['error', 'PascalCase'],
            'semi': ['error', 'always'],
            'quotes': [
                'error',
                'single',
                {
                    'avoidEscape': true
                }
            ],
            'no-multi-spaces': 'error',
            'object-curly-spacing': ['error', 'always'],
            'no-empty': 'off',
            'no-cond-assign': 'error',
            'no-unused-vars': 'warn',
            'eqeqeq': 'error',
            'require-await': 'error',
            'no-unmodified-loop-condition': 'error',
            'one-var': [
                'error',
                {
                    'var': 'always',
                    'let': 'never',
                    'const': 'never'
                }
            ],
            'keyword-spacing': 'error',
            'arrow-spacing': 'error',
            'spaced-comment': 'error',
            'prefer-const': 'error',
            'no-undef': 'off',
            'vue/html-self-closing': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    // eslint-disable-next-line no-restricted-syntax
                    'selector': 'Literal[value=/’/]',
                    // eslint-disable-next-line no-restricted-syntax
                    'message': "Use straight apostrophes (') instead of curly ones (’)."
                },
                {
                    // eslint-disable-next-line no-restricted-syntax
                    'selector': 'TemplateElement[value.cooked=/’/]',
                    // eslint-disable-next-line no-restricted-syntax
                    'message': "Use straight apostrophes (') instead of curly ones (’)."
                }
            ],
            'vue/order-in-components': ['error', {
                'order': [
                    'el',
                    'name',
                    'key',
                    'parent',
                    'functional',
                    ['delimiters', 'comments'],
                    ['components', 'directives', 'filters'],
                    'extends',
                    'mixins',
                    ['provide', 'inject'],
                    'ROUTER_GUARDS',
                    'layout',
                    'middleware',
                    'validate',
                    'scrollToTop',
                    'transition',
                    'loading',
                    'inheritAttrs',
                    'model',
                    ['props', 'propsData'],
                    'emits',
                    'setup',
                    'asyncData',
                    'data',
                    'fetch',
                    'head',
                    'LIFECYCLE_HOOKS',
                    'computed',
                    'watch',
                    'watchQuery',
                    'methods',
                    ['template', 'render'],
                    'renderError'
                ]
            }]
        },
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        }
    }
];