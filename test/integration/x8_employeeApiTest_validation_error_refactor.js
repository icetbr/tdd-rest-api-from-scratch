const chai = require('chai');
chai.use(require('chai-deep-match'));

const db = require('src/db');
const server = require(`${process.env.server}`);
const sinon = require('sinon');

const anEmployee = () => ({ name: 'John', jobTitle: 'Programmer' });
const aLegacyFormatedEmployee = () => ({ fullname: 'John', occupation: 'Programmer' });
const aSavedEmployee = () => ({ fullname: 'John', occupation: 'Programmer' });
const aReturnedEmployee = () => ({ ...employee, ...metadata });

expect(savedEmployees[0]).to.deep.match(aLegacyFormatedEmployee());
expect(savedEmployees[0]).to.not.have.any.keys('name', 'jobTitle');
const metadata = {
    _id: response.result._id,
    uniqueKey: response.result._id.toString(),
    updatedAt: now,
    updatedBy: 'mary@hr.com',
    isDeleted: false,
};
const expectedEmployee = { ...transformedEmployee, ...metadata };

expect(savedEmployeesHistory).to.deep.equal([{ ...expectedEmployee, _id: savedEmployeesHistory[0]._id }]);
expect(savedEmployees[0]._id.toString()).to.not.equal(savedEmployeesHistory[0]._id.toString());


const expectSaved = (saveds, expected)  => {
    expect(saveds).to.have.length(1);
}

const setup = () => {
    // given our current time
    const now = new Date('2018-02-21T12:30:20.903Z');
    const clock = sinon.useFakeTimers({ now, toFake: ['Date'] });

    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();
    await db.collection('employees_history').deleteMany();

    // and a server listening for requests
    await server.initialize();
};

const cleanup = ({ clock, server, db }) => {
    clock.restore();
    await server.stop();
    await db.close();
};

const post = ( url, payload ) => await server.inject({ method: 'post', url, payload });

// transforms the employee data to the legacy format, adds metadata, returns the non transformed employee
// test('POST /employees saves it to the database, saves a copy for history and returns it', async () => {
test('POST /employees transforms the employee data to the legacy format, adds metadata, saves it to the database, saves a copy for history and returns the non transformed employee', async () => {
    const pre = await setup();

    const response = await post('/employees', anEmployee());
    const savedEmployees = await db.collection('employees').find().toArray();

    expectSaved(savedEmployees, aSavedEmployee());

    // deixar o load dentro do expect!
    const savedEmployeesHistory = await db.collection('employees_history').find().toArray();
    expectSavedHistory(savedEmployeesHistory, aSavedEmployee());

    expect(response.result).to.deep.equal(aReturnedEmployee());

    await cleanup(pre);
});

// use mock to isolate stuff, split into 3 tests BUT I preffer the "describe before" version
// TODO: explore variations: 3 times start up server? cleanup db?
test('v2 POST /employees saves it to the database, saves a copy for history and returns it', async () => {
    const response = await post('/employees', anEmployee());
    expectSaved('employees', aSavedEmployee());
    expectSavedHistory('employees', aSavedEmployee());
    expect(response.result).to.deep.equal(aReturnedEmployee());
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