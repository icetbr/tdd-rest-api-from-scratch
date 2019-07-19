const server = require('./user');
const { MongoClient } = require('mongodb');
const { expect } = require('@hapi/code');
const { test } = exports.lab = require('@hapi/lab').script();

const findAllUsers = async () => {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('crudApp').collection('users');
    const users = await db.find().toArray();
    users.forEach((user) => delete user._id);
    return users;
};

const cleanDb = async () => {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('crudApp').collection('users');
    await db.deleteMany();
};

const post = async (url, payload) => {
    await cleanDb();
    await server.initialize();
    return server.inject({ method: 'post', url, payload });
};

test('POST /users saves data to the database', async () => {
    const payload = { name: 'John', username: 'john35', age: 35 };
    await post('/users', payload);

    const actual = await findAllUsers();

    const expected = [payload];
    expect(actual).to.equal(expected);
});