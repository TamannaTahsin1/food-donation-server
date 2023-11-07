/** @format */

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u5hejig.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // all collections
    const featureCollection = client.db("foodDonation").collection("features");
    const newFoodCollection = client.db("foodDonation").collection("foods");
    const donationCollection = client.db("foodDonation").collection("donations");


    // *****FOR FEATURES DATA********
    // read data
    app.get("/features", async (req, res) => {
      const cursor = featureCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // to get single data
    app.get("/features/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await featureCollection.findOne(query);
      console.log(result)
      res.send(result);
    });

    // *******FOR USERS DONATIONS********
    // read data
    app.get("/donations", async (req, res) => {
      console.log(req.query.email)
      // to read some data according to email
      let query = {};
      if(req.query?.email){
        query ={email:req.query.email}
      }
      const result = await donationCollection.find(query).toArray()
      res.send(result)
    })
    // create data
    app.post("/donations", async (req, res) => {
      const donation = req.body;
      console.log(donation);
      const result = await donationCollection.insertOne(donation)
      res.send(result)
    })
    // delete data
    // ***** ADDED NEW FOOD********
    // create data
    app.post("/foods", async (req, res) => {
      const newFoods = req.body;
      console.log(newFoods);
      const result = await newFoodCollection.insertOne(newFoods);
      res.send(result);
    });
    // read data
    app.get("/foods", async (req, res) => {
      const cursor = newFoodCollection.find()
      const result = await cursor.toArray()   
      res.send(result);
    });
    app.get("/foods", async (req, res) => {
      console.log(req.query.email)
      // to read some data according to email
      let query = {};
      if(req.query?.email){
        query ={email:req.query.email}
      }
      const result = await newFoodCollection.find(query).toArray()
      res.send(result)
    })
    // delete data
    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await newFoodCollection.deleteOne(query)
      res.send(result)
    })
    // update data
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await newFoodCollection.findOne(query)
      res.send(result)
    })
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedFood = req.body;
      const updatedNewFood ={
        $set:{
          food_name:updatedFood.food_name, quantity:updatedFood.quantity, food_image:updatedFood.food_image, date:updatedFood.date, location:updatedFood.location, 
          notes:updatedFood.notes
        }
      }
      const result = await newFoodCollection.updateOne(filter, updatedNewFood, options)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// to run server
app.get("/", (req, res) => {
  res.send("food donation server is running");
});
app.listen(port, () => {
  console.log(`food donation server is running on port `);
});
