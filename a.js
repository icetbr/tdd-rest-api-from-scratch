const expect = require('chai').expect;
const ObjectID = require('mongodb').ObjectID;

test('ObjectId comparison', () => {
  expect(ObjectID()).to.deep.equal(ObjectID());
});