const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRETE);
const jwt = require('jsonwebtoken');



// middleware
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://computer:tC1QvgZ4c9urFH2r@cluster0.pjwtwko.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjwtwko.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri)
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

function verifyJWT (req , res , next){
    // console.log(req.headers.authorization)
    const autHeader = req.headers.authorization;
    if(!autHeader){
        return res.status(401).send('unauthorized access')
    }
const token = autHeader.split( ' ')[1]
jwt.verify(token, process.env.ACCESS_TOKEN, function(err , decoded){
    if(err){
        return res.status(403).send({message: 'forbidden Access'})
    }
    req.decoded = decoded;
    next();


})

}



async function run() {
    try {

        const categoryCollection = client.db('computerHouse').collection('category')
        const itemsCollection = client.db('computerHouse').collection('items')
        const ordersCollection = client.db('computerHouse').collection('orders')
        const usersCollection = client.db('computerHouse').collection('users')
        const wishCollection = client.db('computerHouse').collection('wish')
        const paymentsCollection = client.db('computerHouse').collection('Payments')


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

        // post item 
        app.post('/items', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await itemsCollection.insertOne(user);
            res.send(result);
        });


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




        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });













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

        // buyer order 

        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded
            // console.log('inside order api ', decoded)

            const decodedEmail = req.query.email

            if ( req.query.email !== decodedEmail ) {
                res.status(403).send({ message: "Forbidden Access" })
            }
         
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

        // my buyer 
        app.get('/orders/mybuyer', async (req, res) => {
            let query = {};

            if (req.query.sellermail) {
                query = {
                    sellermail: req.query.sellermail
                }
            }
            const cursor = ordersCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
        });



        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //. all seller get 
        app.get('/users', async (req, res) => {
            let query = {};

            if (req.query.account) {
                query = {
                    account: req.query.account
                }
            }
            const cursor = usersCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
            console.log(users.length)
        });





        // all buyer
        app.get('/users', async (req, res) => {
            let query = {};

            if (req.query.account) {
                query = {
                    account: req.query.account
                }
            }
            const cursor = usersCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
        });

        // find user email 
        app.get('/users/email', async (req, res) => {
            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = usersCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
        });


        // make verified seller
        app.put('/users/sale/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'sale'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)



        })
        /// reported users update
        app.put('/items/report/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    roles: 'reported'
                }
            }
            const result = await itemsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)


        })
        ///wishlist update

        app.put('/wish', async (req, res) => {
            const wish = req.body

            const result = await wishCollection.insertOne(wish)
            res.send(result)
        });
        //wishlist get
        app.get('/wish', async (req, res) => {
            const decoded = req.decoded
            // console.log('inside order api ', decoded)

            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: "unauthorized Access" })
            // }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = wishCollection.find(query);
            const orders = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(orders)
        })


        // reported item get 
        app.get('/itemsrep', async (req, res) => {
            let query = {};

            if (req.query.roles) {
                query = {
                    roles: req.query.roles
                }
            }
            const cursor = itemsCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
        });



        // admin user 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })

        })

        app.delete('/users/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/items/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await itemsCollection.deleteOne(query);
            res.send(result)
        })


        // seller all product (my al products)
        app.get('/myallproducts', async (req, res) => {

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = itemsCollection.find(query);
            const orders = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(orders)
        })
        /// advertisment 

        app.put('/items/ad/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    ads: 'ads'
                }
            }
            const result = await itemsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)


        })

        // advertisement items 
        app.get('/itemsads', async (req, res) => {
            let query = {};

            if (req.query.ads) {
                query = {
                    ads: req.query.ads
                }
            }
            const cursor = itemsCollection.find(query)
            const users = await cursor.sort({ createdAt: -1 }).toArray();
            res.send(users)
        });

        // single order  get
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        })
        //payment 


        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })


            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.put('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.ordersId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    // transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc)
            res.send(result);
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