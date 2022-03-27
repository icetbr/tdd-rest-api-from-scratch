const db = require('src/db');
const server = require(`${process.env.server}`);

test('POST /employees saves the employee data to the database', async () => {
    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then the employee data is saved to the database
    // IGNORING ID
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.deep.equal([employee]);

    // JEST ASYMMETRIC MATCHER (not tested)
    // const savedEmployees = await db.collection('employees').find().toArray();
    // expect(savedEmployees).toMatchObject([{ ...employee, _id: expect.objectId }]);

    // CUSTOM ASSERTION (not tested)
    // const omitId = array => array.map(({ _id, ...rest }) => rest);
    // const expectSaved = (saved, expected) => expect(omitId(saved)).to.equal(omitId(expected));
    // expectSaved(savedEmployees, [employee]);

    // cleanup
    await server.stop();
    await db.close();
});