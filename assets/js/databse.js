// database.js

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://skyehigh:${process.env.MONGOPASS}@cluster.evnujdo.mongodb.net/`;
const client = new MongoClient(uri);

let participantsCollection;
let dataCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        participantsCollection = client.db('Roybal').collection('participants');
        dataCollection = client.db('Roybal').collection('data');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = {
    connectToDatabase,
    participantsCollection,
    dataCollection
};
