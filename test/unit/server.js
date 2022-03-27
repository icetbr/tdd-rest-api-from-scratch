const Hapi = require('@hapi/hapi');
const db = require('../db');
const employeePostHandler = require('./employeePostHandler');
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
    const collection = db.collection('employees');
    const collectionHistory = db.collection('employees_history');
    const res = await employeePostHandler(request.payload, collection.insertOne.bind(collection), collectionHistory.insertOne.bind(collectionHistory), new Date(), 'mary@hr.com', new ObjectId(), new ObjectId());
    return res.ops[0];
  },
});

module.exports = server;