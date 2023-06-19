const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { application } = require('express');

const app = express();
const port =  process.env.PORT || 5000
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



     // database and collection names
     const servicesCollection = client.db("carDoctor").collection("services"); 
     const bookingCollection = client.db("carDoctor").collection("booking");



    //  all data find 
     app.get("/services", async(req, res)=> {
         const cursor = servicesCollection.find();
         const result = await cursor.toArray();
         res.send(result);
     })


     //specific one data fiend 
     app.get('/services/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};

        // options 
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title: 1, price: 1, service_id: 1, img: 1 },
          };

        const result = await servicesCollection.findOne(query, options);
        res.send(result);

     })


     // sum data get
     app.get('/booking/', async(req, res)=>{
        console.log(req.query.email);
        let query = {};
        if(req.query.email){
            query = { email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
     })



     // create a new service
     app.post('/booking/', async(req, res) => {
        const booking = req.body
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
     })


     // delete operations
     app.delete(`/booking/:id`, async(req, res) => {
      console.log(req);
      const id = req.params.id;
      const query = { _id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
     })


     //update operations
     app.patch(`/booking/:id`, async(req, res)=>{
      console.log(req);
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc ={
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
