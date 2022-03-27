const Hapi = require('@hapi/hapi');
const db = require('src/db');
const ObjectId = require('mongodb').ObjectID;

// const server = Hapi.server({
//   port: 3000,
//   host: 'localhost',
//   debug: { request: ['error'] },
// });

// await db.initialize();

const getMetadata = (_id = new ObjectId(), updatedAt = new Date()) => ({
  _id,
  uniqueKey: _id.toString(),
  updatedBy: 'mary@hr.com', // you would get this from request.auth,
  updatedAt,
  isDeleted: false,
});

const getEmployeeAsLegacy = (employee, metadata) => {
  const { name, jobTitle, ...employeeFields } = employee;
  return {
    ...employeeFields,
    ...metadata,
    fullname: name,
    occupation: jobTitle,
  }
};

const getEmployeeAsLegacy = ({ name, jobTitle, ...employeeFields }, metadata) => ({
    ...employeeFields,
    ...metadata,
    fullname: name,
    occupation: jobTitle,
});

const save = (employeeAsLegacy) => {
  await db.collection('employees').insertOne(employeeAsLegacy);
  await db.collection('employees_history').insertOne({ ...employeeAsLegacy, _id: new ObjectId() });
}

// if (!request.payload.name) return badRequest('"name" is required');
server.route({
  method: 'POST',
  path: '/employees',
  handler: async ({ payload: employee }) => {
    const metadata = getMetadata(new ObjectId(), new Date());
    await save(getEmployeeAsLegacy(employee, metadata));
    return { ...employee,...metadata };
  },
});

// v2
server.route({ method: 'POST', path: '/employees', handler: postHandler });

const postHandler = async ({ payload: employee }) => {
  const metadata = getMetadata(new ObjectId(), new Date());
  await save(asLegacy(employee, metadata));
  return { ...employee, ...metadata };
};

const postHandler = async ({ payload: employee }) => {
  const metadata = getMetadata(new ObjectId(), new Date());
  employee = { ...employee, ...metadata }
  await save(asLegacy(employee));
  return employee;
};

// { payload: employee }
const create = pipe(
    getMetadata,
    save(asLegacy),
    withMetadata,
);



test('POST /employees transforms the employee data to the legacy format, adds metadata, saves it to the database, saves a copy for history and returns the non transformed employee', async () => {

module.exports = server;