module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@pretext-native/core$': '<rootDir>/../core/src',
  },
};
