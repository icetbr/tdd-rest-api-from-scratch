const { MongoClient } = require('mongodb');

module.exports = {

  async db() {
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    return client.db('tdd-rest-api-from-scratch').collection('users');
  },

};
