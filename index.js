const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('bson');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.u6euqsi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('photoFiesta').collection('services');
        const reviewCollection = client.db('photoFiesta').collection('reviews');

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })

        app.get('/services', async (req, res) => {

            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })

        app.get('/allServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query, { "sort": ['datefield', 'desc'] });
            const services = await cursor.toArray();
            res.send(services)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.get('/services/:serviceId', async (req, res) => {
            const id = req.params;
            const query = { service_id: id };

            const cursor = reviewCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/reviews', verifyJWT, async (req, res) => {
            // console.log(req.headers);
            // console.log(req.query.email);
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/review/:id', async (req, res) => {
            const id = req.params;
            const review = await reviewCollection.findOne({ _id: ObjectID(id) });
            res.send(review);
        })
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.post('/addService', async (req, res) => {
            const add = req.body;
            const result = await serviceCollection.insertOne(add);
            res.send(result);
        })

        app.patch('/review/:id', async (req, res) => {
            // const id = req.params.id;
            // const status = req.body.status;
            // const query = { _id: ObjectID(id) };
            // const updatedDoc = {
            //     $set: {
            //         status: status
            //     }
            // }
            // const result = await reviewCollection.updateOne(query, updatedDoc);
            // res.send(result);

            const { id } = req.params;
            const result = await reviewCollection.updateOne({ _id: ObjectID(id) }, { $set: req.body });
            res.send(result);
        })

        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('server is running');
})

app.listen(port, () => {
    console.log(`photo fiesta running on port ${port}`);
})