const chai = require('chai');
chai.use(require('chai-deep-match'));
const ObjectId = require('mongodb').ObjectID;

const employeePostHandler = require('./employeePostHandler');
const noop = () => {};

test('postHandler saves the employee data to the database', async () => {
    const employee = { name: 'John', jobTitle: 'Programmer' };
    const saveEmployee = async employee => saveEmployee.employee = employee;
    await employeePostHandler(employee, saveEmployee, noop, '', '', '');
    expect(saveEmployee.employee).to.deep.match(employee);
});

test('postHandler returns the saved employee data', async () => {
    const employee = { name: 'John', jobTitle: 'Programmer' };
    const saveEmployee = async employee => employee;
    const returned = await employeePostHandler(employee, saveEmployee, noop, '', '', '');
    expect(returned).to.deep.match(employee);
});

test('postHandler saves a copy of the employee data to the history database', async () => {
    const employee = { name: 'John', jobTitle: 'Programmer' };
    const saveEmployeeHistory = async employee => saveEmployeeHistory.employee = employee
    await employeePostHandler(employee, noop, saveEmployeeHistory, '', '', '');
    expect(saveEmployeeHistory.employee).to.deep.match(employee);
});

test('postHandler adds metadata ', async () => {
    const employee = { name: 'John', jobTitle: 'Programmer' };
    const saveEmployee = async employee => saveEmployee.employee = employee;

    const uniqueKey = '59667b5fbca8131700000004';
    const savedId = new ObjectId(uniqueKey);
    const now = new Date('2018-02-21T12:30:20.903Z');
    const updatedBy = 'mary@hr.com';

    await employeePostHandler(employee, saveEmployee, noop, now, updatedBy, savedId);

    const metadata = {
        _id: savedId,
        updatedAt: now,
        updatedBy,
        isDeleted: false,
        uniqueKey,
    };
    expect(saveEmployee.employee).to.deep.match(metadata);
});

