export default {
  rootDir: "./",
  coverageReporters: ["json", "html", "cobertura", "text-summary", "lcov"],
  // this path is duplicated in the build.cake for xUnit tests
  coverageDirectory: "./coverage",
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    // '*/.ts',
    "!*/node_modules/*",
    "!*/.d.ts",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testEnvironment: "node",
  verbose: true,
};
