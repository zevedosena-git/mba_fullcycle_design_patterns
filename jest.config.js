/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Os testes de integração fecham o mesmo período no mesmo banco; em paralelo, duas substituições concorrentes duplicam faturas.
  maxWorkers: 1,
};
