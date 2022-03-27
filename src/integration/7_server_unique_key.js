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
    const employee = {
      ...request.payload,
      updatedBy: request.headers.authorization,
      updatedAt: new Date().toISOString().replace('T', '_').substring(0, 19),
      _id,
      uniqueKey: _id.toString(), // toString just for better error messages, in real life a better assertion should be used
    };

    const result = await db.collection('employees').insertOne(employee);
    await db.collection('employees_history').insertOne({ ...employee, _id: new ObjectId() });

    return result.ops[0];
  },
});

module.exports = server;