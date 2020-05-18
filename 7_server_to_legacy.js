const Hapi = require('@hapi/hapi');
const db = require('./db');
const ObjectId = require('mongodb').ObjectID;

const server = Hapi.server({
  port: 3000,
  host: 'localhost',
  debug: { request: ['error'] },
});

const getMetadata = (user) => {
  const _id = new ObjectId();

  return {
    _id,
    uniqueKey: _id.toString(),
    updatedBy: user,
    updatedAt: new Date(),
    isDeleted: false,
  };
};

const toLegacy = (employee) => {
  return {
    fullname: employee.name,
    occupation: employee.jobTitle,
  };
};

server.route({
  method: 'POST',
  path: '/employees',
  handler: async request => {
    await db.initialize();

    const metadata = getMetadata('mary@hr.com'); // you would get this from request.auth,
    const employeeAsLegacy = { ...toLegacy(request.payload), ...metadata };

    await db.collection('employees').insertOne(employeeAsLegacy);
    await db.collection('employees_history').insertOne({ ...employeeAsLegacy, _id: new ObjectId() });

    return { ...request.payload, ...metadata }; // only needed result.ops[0] because of the _id
  },
});

module.exports = server;