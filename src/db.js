const { MongoClient } = require('mongo-mock');

let db;
let client;

module.exports = {

  async initialize() {
    if (db) return;

    client = await MongoClient.connect('mongodb://localhost/', { useNewUrlParser: true });
    db = client.db('tdd-rest-api-from-scratch');
  },

  async drop() {
    // This is faster then dropping the database. See https://docs.mongodb.com/manual/reference/method/db.collection.remove/
    const collections = db.collections();
    for (const collection in collections) {
      if (collection.collectionName.indexOf('system') === 0) continue;
      await collection.removeMany();
    }
  },

  collection(collection) {
    return db.collection(collection);
  },

  async close() {
    await db.close();
    await client.close();
  }

};