const { MongoClient } = require('mongodb');

let db;

module.exports = {

  async collection(collection) {
    if (!db) {
      const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
      db = client.db('tdd-rest-api-from-scratch');
    }

    return db.collection(collection);
  },

};
