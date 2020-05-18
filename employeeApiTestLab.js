const db = require('./db');
const server = require('./server');

const Code = require('@hapi/code');
const { expect } = Code;
const { test } = exports.lab = require('@hapi/lab').script();

Code.settings.truncateMessages = true;

test.only('POST /employees with a missing name returns an error 400', async () => {
    // given a server listening for requests
    await server.initialize();

    // and an employee with a missing name
    const employee = { jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then an error 400 is returned
    const errorBadRequest = {
        statusCode: 400,
        error: 'Bad Request',
        message: '"name" is required',
    };
    expect(response.result).to.equal(errorBadRequest);

    // cleanup
    await server.stop();
});

