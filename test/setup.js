// trying to use jest and mocha together

process.env.NODE_PATH = 'src/';
const chai = require('chai');
chai.use(require('chai-deep-match'));
// chai/jest compability
// https://medium.com/@RubenOostinga/combining-chai-and-jest-matchers-d12d1ffd0303

// Make sure chai and jasmine ".not" play nice together
const originalNot = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, 'not').get;
Object.defineProperty(chai.Assertion.prototype, 'not', {
  get() {
    Object.assign(this, this.assignedNot);
    return originalNot.apply(this);
  },
  set(newNot) {
    this.assignedNot = newNot;
    return newNot;
  },
});

// Combine both jest and chai matchers on expect
const originalExpect = global.expect;

global.expect = (actual) => {
  const originalMatchers = originalExpect(actual);
  const chaiMatchers = chai.expect(actual);
  const combinedMatchers = Object.assign(chaiMatchers, originalMatchers);
  return combinedMatchers;
};


// const Code = require('@hapi/code');
// const { expect } = require('@hapi/code');
// const { describe, it, test } = exports.lab = require('@hapi/lab').script();

// Code.settings.truncateMessages = true;

// Object.defineProperty(Code.internals.Assertion.prototype, 'deep', {
//   get: function () {

//     return this;
//   },
//   configurable: true
// });

// global.expect = expect;
// global.describe = describe;
// global.it = it;
// global.test = test;

