const { MongoClient } = require('mongo-mock');

let db;
let client;

module.exports = {

  async initialize() {
    if (db) return;

    client = await MongoClient.connect('mongodb://localhost/', { useNewUrlParser: true });
    db = client.db('tdd-rest-api-from-scratch');
  },

  collection(collection) {
    return db.collection(collection);
  },

  async close() {
    await db.close();
    await client.close();
  }

};