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
    return await db.collection('employees').insertOne(request.payload);
  },
});

module.exports = server;