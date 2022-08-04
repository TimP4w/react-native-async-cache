module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest/setup.js"],
  modulePathIgnorePatterns: ["<rootDir>/examples/"],
};
