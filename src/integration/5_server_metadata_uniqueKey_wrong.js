const Hapi = require('@hapi/hapi');
const db = require('./db');
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
    const employee = {
      ...request.payload,
      _id,
      uniqueKey: _id.toString(),
      updatedBy: 'mary@hr.com', // you would get this from request.auth,
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await db.collection('employees').insertOne(employee);
    await db.collection('employees_history').insertOne(employee);

    return result.ops[0];
  },
});

module.exports = server;