const Hapi = require('@hapi/hapi');
const { MongoClient } = require('mongodb');

const createUser = async (req) => {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('crudApp').collection('users');

    return db.insertOne(req.payload);
};

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    debug: { request: ['error'] },
});

server.route({ method: 'POST', path: '/users', handler: createUser });

module.exports = server;