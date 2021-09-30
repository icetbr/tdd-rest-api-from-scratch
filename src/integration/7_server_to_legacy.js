const Hapi = require('@hapi/hapi');
const db = require('src/db');
const ObjectId = require('mongodb').ObjectID;

const server = Hapi.server({
  port: 3000,
  host: 'localhost',
  debug: { request: ['error'] },
});

server.route({
  method: 'POST',
  path: '/employees',
  handler: async request => {
    await db.initialize();

    const _id = new ObjectId();
    const { name, jobTitle, ...employeeFields } = request.payload;
    const metadata = {
      _id,
      uniqueKey: _id.toString(),
      updatedBy: 'mary@hr.com', // you would get this from request.auth,
      updatedAt: new Date(),
      isDeleted: false,
    };
    const employeeAsLegacy = {
      ...employeeFields,
      ...metadata,
      fullname: name,
      occupation: jobTitle,
    };

    await db.collection('employees').insertOne(employeeAsLegacy);
    await db.collection('employees_history').insertOne({ ...employeeAsLegacy, _id: new ObjectId() });

    return {
      ...request.payload,
      ...metadata,
    };
  },
});

module.exports = server;