const chai = require('chai');
chai.use(require('chai-deep-match'));

const db = require('src/db');
const server = require(`${process.env.server}`);
const sinon = require('sinon');

test('POST /employees transforms the employee data to the legacy format, adds metadata, saves it to the database, saves a copy for history and returns the non transformed employee', async () => {
    // given our current time
    const now = new Date('2018-02-21T12:30:20.903Z');
    const clock = sinon.useFakeTimers({ now, toFake: ['Date'] });

    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();
    await db.collection('employees_history').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then it saves the employee to the database
    const savedEmployees = await db.collection('employees').find().toArray();
    expect(savedEmployees).to.have.length(1);

    // and it transforms the employee to the legacy format
    const transformedEmployee = { fullname: 'John', occupation: 'Programmer' };
    expect(savedEmployees[0]).to.deep.match(transformedEmployee);
    expect(savedEmployees[0]).to.not.have.any.keys('name', 'jobTitle');

    // and it adds metadata
    const metadata = {
        _id: response.result._id,
        uniqueKey: response.result._id.toString(),
        updatedAt: now,
        updatedBy: 'mary@hr.com',
        isDeleted: false,
    };
    expect(savedEmployees[0]).to.deep.match(metadata);

    // and no extra fields are added
    const expectedEmployee = { ...transformedEmployee, ...metadata };
    expect(savedEmployees[0]).to.deep.equal(expectedEmployee);

    // and a copy is saved for history
    const savedEmployeesHistory = await db.collection('employees_history').find().toArray();
    expect(savedEmployeesHistory).to.deep.equal([{ ...expectedEmployee, _id: savedEmployeesHistory[0]._id }]);
    expect(savedEmployees[0]._id.toString()).to.not.equal(savedEmployeesHistory[0]._id.toString());

    // and the non transformed employee is returned
    expect(response.result).to.deep.equal({ ...employee, ...metadata });

    // cleanup
    clock.restore();
    await server.stop();
    await db.close();
});

test('POST /employees with a missing name returns an error 400', async () => {
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
    expect(response.result).to.deep.equal(errorBadRequest);

    // cleanup
    await server.stop();
});