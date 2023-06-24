const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { application } = require('express');

const app = express();
const port = process.env.PORT || 5000
dotenv.config();

// model wire 
app.use(cors());
app.use(express.json());



const user = process.env.DB_USER
const pass = process.env.DB_PASS


console.log(user)
console.log(pass)



app.get('/', (req, res) => {
  res.send('Hello world!');
})

app.listen(port, (req, res) => {
  console.log(`listening on ${port}`);
});


// mongodb 

const uri = `mongodb+srv://${user}:${pass}@cluster0.7vupqqk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


//  jwt verify function
const verifyJWT = (req, res, next) => {
  console.log('heating verify jwt function');
  console.log("53",req.headers.authorization);
  const authorization = req.headers.authorization;
  
  if(!authorization){
    return res.status(401).send({error:true, massage: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  console.log("60 inside token verify jwt", token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
    if(error){
      return res.status(403).send({error: true, message: "unAuthorize access token"});
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



    // database and collection names
    const servicesCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("booking");



    // jwt
    app.post('/jwt', (req, res)=>{
      const user = req.body
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      console.log(token);
      res.send({token});
    })





    //  all data find 
    // services routes.
    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);

      // count the request property names with array.
      // const myArray = Object.keys(req)
      // console.log(myArray.length);
    })


    //specific one data fiend 
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      // options 
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await servicesCollection.findOne(query, options);
      res.send(result);

    })





    // sum data get
    // bookings route specific user data 
    //after with jwt token
    app.get('/booking/', verifyJWT, async(req, res) => {
      console.log("121",req.headers);
      console.log('135 came back after verify jwt');
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })



    // ****************************************************************
    // **************before without jwt token**************************
    // app.get('/booking/', async (req, res) => {
    //   console.log(req.query.email);
    //   let query = {};
    //   if (req.query.email) {
    //     query = { email: req.query.email }
    //   }
    //   const result = await bookingCollection.find(query).toArray();
    //   res.send(result);
    // })
    // ****************************************************************
    // ****************************************************************


    // create a new service
    app.post('/booking/', async (req, res) => {
      const booking = req.body
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })


    // delete operations
    app.delete(`/booking/:id`, async (req, res) => {
      console.log(req);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })


    //update operations
    app.patch(`/booking/:id`, async (req, res) => {
      console.log(req);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc = {
        $set: {
          status: updateBooking.status
        },
      }

      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result);
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
