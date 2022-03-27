const chai = require('chai');
chai.use(require('chai-deep-match'));

const db = require('src/db');
const server = require(`${process.env.server}`);
const sinon = require('sinon');

test('POST /employees', async () => {
    // given our current time
    const currentTime = '2018-02-21T12:30:20.000Z';
    const clock = sinon.useFakeTimers({ now: new Date(currentTime), toFake: ['Date'] });

    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();
    await db.collection('employees_history').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const callerEmail = 'mary@hr.com';
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee, headers: { authorization: callerEmail } });

    // then it saves the employee data to the database
    const savedEmployees = await db.collection('employees').find().toArray();
    expect(savedEmployees).to.have.length(1);

    // and it adds the caller's email
    expect(savedEmployees[0]).to.deep.match({ updatedBy: callerEmail });

    // and it adds the current time as YYYY-MM-DD_HH:MM:SS
    const formatedCurrentTime = '2018-02-21_12:30:20';
    expect(savedEmployees[0]).to.deep.match({ updatedAt: formatedCurrentTime });

    // and it transforms the employee to the legacy format
    const transformedEmployee = { STR_name: 'John', STR_jobTitle: 'Programmer' };
    expect(savedEmployees[0]).to.deep.match(transformedEmployee);
    expect(savedEmployees[0]).to.not.have.any.keys('name', 'jobTitle');

    // and it saves a copy for history
    const savedEmployeesHistory = await db.collection('employees_history').find().toArray();
    expect(savedEmployeesHistory).to.have.length(1);

    // and it links the copy to the original
    expect(savedEmployees[0]).to.deep.match({ uniqueKey: savedEmployees[0]._id.toString() }); // toString just for better error messages, in real life a better assertion should be used

    // and it assigns the copy its own id
    expect(savedEmployees[0]._id.toString()).to.not.equal(savedEmployeesHistory[0]._id.toString());

    // and no extra fields are added
    const expectedEmployee = {
        ...transformedEmployee,
        _id: savedEmployees[0]._id,
        updatedBy: callerEmail,
        updatedAt: formatedCurrentTime,
        uniqueKey: savedEmployees[0]._id.toString(),
    };
    expect(savedEmployees[0]).to.deep.equal(expectedEmployee);
    expect(savedEmployeesHistory).to.deep.equal([{ ...expectedEmployee, _id: savedEmployeesHistory[0]._id }]);

    // and it returns the saved employee
    expect(response.result).to.deep.equal(expectedEmployee);

    // cleanup
    clock.restore();
    await server.stop();
    await db.close();
});