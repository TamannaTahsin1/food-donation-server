/** @format */

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['https://food-donation-client.web.app/',
  'https://food-donation-client.firebaseapp.com/'
],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// created middleware
const logger = async(req, res, next) =>{
  console.log('called', req.host, req.originalUrl)
  next()
}
const verifyToken = async(req, res, next) =>{
  const token = req.cookies?.token;
  console.log('Value of token', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
    // error
    if(error){
      console.log(error)
      return res.status(401).send({message:'unauthorized'})
    }
    // if valid then decoded
    console.log('value in the token', decoded)
    req.user = decoded
    next()
  })
}

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
    const donationCollection = client
      .db("foodDonation")
      .collection("donations");

    // ******AUTH RELATED API*********
    // create data
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({
                status: true,
            })
    });
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
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await featureCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // *******FOR USERS DONATIONS********
    // read data
    app.get("/donations", verifyToken, async (req, res) => {
      console.log(req.query.email);
      // to read some data according to email
      if(req.query.email !== req.query.email ){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await donationCollection.find(query).toArray();
      res.send(result);
    });
    // create data
    app.post("/donations", async (req, res) => {
      const donation = req.body;
      console.log(donation);
      const result = await donationCollection.insertOne(donation);
      res.send(result);
    });
    // delete data
    app.delete("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationCollection.deleteOne(query);
      res.send(result);
    });
    // update data
    app.patch("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDonation = req.body;
      console.log(updateDonation);
      const updateDoc = {
        $set: {
          status: updateDonation.status,
        },
      };
      const result = await donationCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
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
      const cursor = newFoodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/foods", verifyToken, async (req, res) => {
      console.log(req.query.email);
      // to read some data according to email
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await newFoodCollection.find(query).toArray();
      res.send(result);
    });
    // delete data
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newFoodCollection.deleteOne(query);
      res.send(result);
    });
    // update data
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newFoodCollection.findOne(query);
      res.send(result);
    });
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const updatedNewFood = {
        $set: {
          food_name: updatedFood.food_name,
          quantity: updatedFood.quantity,
          food_image: updatedFood.food_image,
          date: updatedFood.date,
          location: updatedFood.location,
          notes: updatedFood.notes,
        },
      };
      const result = await newFoodCollection.updateOne(
        filter,
        updatedNewFood,
        options
      );
      res.send(result);
    });
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
