/**
 * ドメインロジック（src/lib/ 配下の純粋関数）のテスト設定。
 * Supabase・React に依存しないモジュールのみを対象にする。
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
};
