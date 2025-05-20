// jest.config.ts
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../../tsconfig.json';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../../',
  }),
  roots: ['<rootDir>/src', '<rootDir>/../../libs/api-contracts/src'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transformIgnorePatterns: [],
};
