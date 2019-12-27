const Hapi = require('@hapi/hapi');
const { MongoClient } = require('mongodb');
const { expect } = require('@hapi/code');
const { test } = exports.lab = require('@hapi/lab').script();

test('POST /employees saves the employee data to the employees database', async () => {
    // given a fresh database
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const employeesDb = client.db('tdd-rest-api-from-scratch').collection('employees');
    await employeesDb.deleteMany();

    // and a server listening for requests
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        debug: { request: ['error'] },
    });

    server.route({
        method: 'POST',
        path: '/employees',
        handler: async request => await employeesDb.insertOne(request.payload),
    });

    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when I make a `POST` request to the /employees url with the employee data
    await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then the employee data is saved to the employees database
    const savedEmployees = await employeesDb.find().toArray();
    expect(savedEmployees).to.equal([employee], { skip: ['_id'] });
});
