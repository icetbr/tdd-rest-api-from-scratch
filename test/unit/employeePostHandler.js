// const db = require('./db');

// module.exports = employee => {
//     await db.initialize();
//     return await db.collection('employees').insertOne(employee);
// };

module.exports = async (employee, saveEmployee, saveEmployeeHistory, now, updatedBy, savedId, historySavedId) => {
    // const _id = new ObjectId();
    const metadata = {
        _id: savedId,
        updatedBy,
        updatedAt: now,
        isDeleted: false,
        uniqueKey: savedId.toString(),
    };
    const employeeDb = {
        ...metadata,
        ...employee,
    };

    const saved = await saveEmployee(employeeDb);
    await saveEmployeeHistory({ ...employeeDb, _id: historySavedId });
    return saved;
};