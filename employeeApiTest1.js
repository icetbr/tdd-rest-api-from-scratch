const db = require('./db');
const server = require('./server');

test('POST adiciona metadados, desnormaliza, salva, salva no histórico e retorna o documento salvo e normalizado', async () => {
    // prepare
    await prepareDb();
    MockDate.set(dti);

    // run
    const returned = await fb.fetch('POST', baseUrl, newDoc('3'));
    if (returned.result.errors) throw new Error(returned.result.errors[0].message);
    if (returned.result.error) throw new Error(returned.result.error);
    // TODO expect statusCode

    // check
    const actuals = await db.find().toArray();
    const actualsHistory = await historyDb.find().toArray();

    const savedId = actuals[2]._id.toString();//index!!!
    const expectedReturned = responseExample(savedId, '3');
    expectedReturned.dti = dti;
    const expected = legacyExample(savedId, '3');
    expected.dti = dti;

    expect(returned.result).to.equal({ data: expectedReturned });
    expect(actuals).to.equal([...dbData[dbName], expected]);
    expect(actualsHistory[2]._id).to.not.equal(savedId);
    actualsHistory[2]._id = expected._id; // não quero comparar ids
    expect(actualsHistory).to.equal([...dbData[historyDbName], expected]);

    MockDate.reset();
});

test('POST adiciona metadados, desnormaliza, salva, salva no histórico e retorna o documento salvo e normalizado', async () => {
    // prepare
    await prepareDb();
    MockDate.set(dti);

    // run
    const returned = await fb.fetch('POST', baseUrl, newDoc('3'));
    if (returned.result.errors) throw new Error(returned.result.errors[0].message);
    if (returned.result.error) throw new Error(returned.result.error);
    // TODO expect statusCode

    // check
    const actuals = await db.find().toArray();
    const actualsHistory = await historyDb.find().toArray();

    const savedId = actuals[2]._id.toString();//index!!!
    const expectedReturned = responseExample(savedId, '3');
    expectedReturned.dti = dti;
    const expected = legacyExample(savedId, '3');
    expected.dti = dti;

    const m1 = 'adds metadata';
    expect(returned.result).to.equal({ data: expectedReturned });
    expect(actuals).to.equal([...dbData[dbName], expected]);
    expect(actualsHistory[2]._id).to.not.equal(savedId);
    actualsHistory[2]._id = expected._id; // não quero comparar ids
    expect(actualsHistory).to.equal([...dbData[historyDbName], expected]);

    MockDate.reset();
});

validate
add metadata
transform to legacy format
save to db
save copy to historyDb
emit event
return non transformed

test('POST /employees saves the employee data to the employees database', async () => {
    // given a fresh database
    await db.initialize();
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const returned = await server.inject({ method: 'post', url: '/employees', payload: employee });

    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();

    // then it adds metadata
    const { _id, dti } = savedEmployees[0];
    const metadata = { _id, dti };
    expect(metadata).to.exist;

    const metadata = savedEmployees[0];
    employee._id = savedEmployees[0]._id;
    employee.dti = savedEmployees[0].dti;
    expect(returned.result).to.equal({ data: expectedReturned }, 'adds metadata');

    // then it adds metadata
    employee._id = savedEmployees[0]._id;
    employee.dti = savedEmployees[0].dti;
    expect(returned.result).to.equal({ data: expectedReturned }, 'adds metadata');

    // then the employee data is saved to the employees database
    expect(savedEmployees).to.deep.equal([employee]);
});