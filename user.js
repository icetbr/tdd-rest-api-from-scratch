const Hapi = require('@hapi/hapi');
const { MongoClient } = require('mongodb');

const create = async (req) => {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('crudApp').collection('users');

    const result = await db.insertOne(req.payload);
    return result.ops[0];
};

const update = async (req) => {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('crudApp').collection('users');

    const result = await db.insertOne(req.payload);
    return result.ops[0];
};

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    debug: { request: ['error'] },
});

server.route({ method: 'POST', path: '/users', handler: create });

module.exports = server;