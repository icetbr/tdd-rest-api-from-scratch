const db = require('./db');
const server = require('./server');

test('POST /employees saves the employee data to the employees database', async () => {
    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then the employee data is saved to the employees database
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.deep.equal([employee]);

    // cleanup
    await server.stop();
    await db.close();
});
