import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  // The Worker is a separate package with its own tsconfig and runtime globals;
  // it is linted and type-checked from worker/, not here.
  globalIgnores(['dist', 'dev-dist', 'worker']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // A provider and its own accessor hook belong together; splitting them
    // across files would serve nothing but the fast-refresh heuristic.
    files: ['src/contexts/*.tsx', 'src/modals/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowExportNames: ['useAuth', 'useGoals', 'useSession', 'useModal', 'fmt'] },
      ],
    },
  },
])
