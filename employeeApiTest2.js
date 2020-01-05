const db = require('./db');
const server = require('./server');

describe('POST /users', () => {
    const payload = { name: 'John', username: 'john35', age: 35 };
    const response = await post('/users', payload);

    it('creates a user in the database', async () => {
        const actual = await findAllUsers();
        const expected = [payload];
        expect(actual).to.equal(expected);
    });

    it('returns the created user', async () => {
        const actual = response.result;
        delete actual._id;
        const expected = payload;
        expect(actual).to.equal(expected);
    });
});