import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'd.ts'],
    testPathIgnorePatterns: ['^.*\.(\\.d\\.ts)$'],
    roots: [
        "./ts/",
    ]
};
export default config;