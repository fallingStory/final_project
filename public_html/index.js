const {MongoClient} = require('mongodb')
require('dotenv').config();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri,{});

console.log("hi");
async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas!");

        const database = client.db('PokemonDB');
        const collection = database.collection('pokemon');

        const query = { name: "Bulbasaur" };
        const user = await collection.findOne(query);
        console.log("Queried document:", user);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run().catch(console.dir);