const chai = require('chai');
chai.use(require('chai-deep-match'));

const db = require('./db');
const server = require('./server');
const sinon = require('sinon');

test('POST /employees saves the employee data to the database, adds metadata, saves a copy for history and returns the saved employee', async () => {
    // given our current time
    const now = new Date('2018-02-21T12:30:20.903Z');
    const clock = sinon.useFakeTimers({ now, toFake: ['Date'] });

    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then it saves the employee to the database
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.have.length(1);

    // and it adds metadata
    const metadata = {
        updatedAt: now,
        updatedBy: 'mary@hr.com',
        isDeleted: false,
    };
    expect(savedEmployees[0]).to.deep.match(metadata);

    // and no extra fields are added
    const expectedEmployee = { ...employee, ...metadata };
    expect(savedEmployees[0]).to.deep.equal(expectedEmployee);

    // and a copy is saved for history
    const savedEmployeesHistory = await db.collection('employees_history').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployeesHistory).to.deep.equal([expectedEmployee]);

    // and the saved employee is returned
    expect(response.result).to.deep.equal({ ...expectedEmployee, _id: response.result._id });

    // cleanup
    clock.restore();
    await server.stop();
    await db.close();
});