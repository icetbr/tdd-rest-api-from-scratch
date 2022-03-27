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
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then it saves the employee data to the database
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.deep.equal([employee]);

    // and it returns the saved employee
    expect(response.result).to.deep.equal({ ...employee, _id: response.result._id } );

    // cleanup
    await server.stop();
    await db.close();
});