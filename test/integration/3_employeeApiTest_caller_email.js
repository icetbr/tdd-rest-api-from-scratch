const chai = require('chai');
chai.use(require('chai-deep-match'));

const db = require('src/db');
const server = require(`${process.env.server}`);

test('POST /employees', async () => {
    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const callerEmail = 'mary@hr.com';
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee, headers: { authorization: callerEmail } });

    // then it saves the employee data to the database
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    // expect(savedEmployees).to.deep.equal([employee]); // REPLACED
    expect(savedEmployees).to.have.length(1);

    // and it adds the caller's email
    // expect(savedEmployees[0].updatedBy).to.equal(callerEmail);        // BAD
    // expect(savedEmployees[0]).to.include({ updatedBy: callerEmail }); // GOOD
    // const expectedEmployee = { ...employee, updatedBy: callerEmail };
    // expect(savedEmployees[0]).to.deep.equal(expectedEmployee);        // BETTER

    expect(savedEmployees[0]).to.deep.match({ updatedBy: callerEmail }); // BETTERER

    // and no extra fields are added
    const expectedEmployee = { ...employee, updatedBy: callerEmail };
    expect(savedEmployees[0]).to.deep.equal(expectedEmployee);

    // and it returns the saved employee
    expect(response.result).to.deep.equal({ ...expectedEmployee, _id: response.result._id });

    // cleanup
    await server.stop();
    await db.close();
});