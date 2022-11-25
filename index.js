const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()


// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://computer:tC1QvgZ4c9urFH2r@cluster0.pjwtwko.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjwtwko.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri)
console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)

async function run() {
    try {

        const categoryCollection = client.db('computerHouse').collection('category')
        const itemsCollection = client.db('computerHouse').collection('items')
        const ordersCollection = client.db('computerHouse').collection('orders')
        const usersCollection = client.db('computerHouse').collection('users')


        // console.log(categoryCollection)

        app.get('/category', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find()
            const category = await cursor.toArray();
            res.send(category);
        })
        app.get('/items', async (req, res) => {
            const query = {}
            const cursor = itemsCollection.find()
            const items = await cursor.toArray();
            res.send(items);
        })


        // app.get('/category/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const category = await categoryCollection.findOne(query)
        //     res.send(category)
        // })

        app.get('/category/:id', async (req, res) => {

            const id = req.params.id;
            const query = { category: id }
            const cursor = categoryCollection.find(query).sort({ date: -1 });
            const category = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(category)
        })

        app.get('/items/:id', async (req, res) => {

            const id = req.params.id;
            const query = { types: id }
            const cursor = itemsCollection.find(query).sort({ date: -1 });
            const items = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(items)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body
            // const query = {
            //     appointmentDate: booking.appointmentDate,
            //     email: booking.email,
            //     treatment: booking.treatment
            // }
            // const alreadyOrdered = await ordersCollection.find(query).toArray();
            // if (alreadyOrdered.length) {
            //     const message = `You already ordered ${booking.appointmentDate}`
            //     return res.send({ acknowledged: false, message })
            // }
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        });

        app.get('/orders', async (req, res) => {
            const decoded = req.decoded
            console.log('inside order api ', decoded)

            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: "unauthorized Access" })
            // }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(orders)
        })



        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })


















    }


    finally {

    }
}

run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('simple node server Running')
})
app.listen(port, () => {
    console.log(`simple server running on port ${port}`)
})