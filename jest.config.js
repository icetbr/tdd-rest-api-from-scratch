module.exports = {
  bail: 1,
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  testRegex: ".*",
  setupFilesAfterEnv: ["jest-extended"],
  // reporters: [
  //   ["jest-silent-reporter", { "useDots": true }]
  // ],
};
