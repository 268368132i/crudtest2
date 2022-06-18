import {MongoClient} from "mongodb";

const uri =
  "mongodb://localhost/?directConnection=true";
// Create a new MongoClient
export const client = new MongoClient(uri);

export async function connect() {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
  } catch (err) {
      console.log(String(err));
      await client.close();
  }
  return client;
}
