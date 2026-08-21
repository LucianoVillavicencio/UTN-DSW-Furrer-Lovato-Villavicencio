// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // CODESTYLE §7: `any` is banned — use `unknown` plus narrowing instead.
      '@typescript-eslint/no-explicit-any': 'error',
      // CODESTYLE §4: an unawaited promise loses its rejection, so a failure
      // disappears instead of reaching a catch or the Nest exception filter.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          // `const { password: _password, ...safeUser } = user` is how the
          // services strip the hash before returning a user.
          ignoreRestSiblings: true,
        },
      ],
      // Where a library hands back `any` — getRequest(), class-transformer's
      // callbacks — type the value at the boundary instead (see
      // AuthenticatedRequest in common/interfaces). The codebase is clean of
      // these, so keep them errors.
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      // CODESTYLE §4: the backend logs through the Nest Logger, never console.
      'no-console': 'error',
    },
  },
);
