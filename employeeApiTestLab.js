const db = require('./db');
const server = require('./server');

const { expect } = require('@hapi/code');
const { test } = exports.lab = require('@hapi/lab').script();

test('POST /employees saves the employee data to the employees database and returns the saved employee', async function () {
    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then the employee data is saved to the employees database
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.equal([employee]);

    // and the saved employee is returned
    // expect({ a: 1 }).to.deep.equal({ a: 2 });
    expect(response.result).to.equal(savedEmployees[0]);
// expect id to exist?
    // cleanup
    await server.stop();
    await db.close();
});

