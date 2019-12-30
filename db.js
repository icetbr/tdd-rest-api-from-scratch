const { MongoClient } = require('mongo-mock');

let db;

module.exports = {

  async initialize() {
    if (db) return;

    const client = await MongoClient.connect('mongodb://localhost/', { useNewUrlParser: true });
    db = client.db('tdd-rest-api-from-scratch');
  },

  collection(collection) {
    return db.collection(collection);
  },

};