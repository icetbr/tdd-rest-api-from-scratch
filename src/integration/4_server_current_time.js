const Hapi = require('@hapi/hapi');
const db = require('src/db');

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

    const employee = {
      ...request.payload,
      updatedBy: request.headers.authorization,
      updatedAt: new Date().toISOString().replace('T', '_').substring(0, 19),
    };

    const result = await db.collection('employees').insertOne(employee);

    return result.ops[0];
  },
});

module.exports = server;