const express = require("express");
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser');
const app = express();

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = "mongodb+srv://pradeep:prad2003@backgroundcluster.pzm6kzq.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

const database = client.db("EAH_db");
const logintab = database.collection("EAH_login");

app.post("/loginuser",async (req, res) => {
    console.log("Got login")

    const query = {
        email: req.body.email,
        password: req.body.password
    }

    const result = await logintab.findOne(query);

    if(result !== null)
    {
        const objToSend = {
            name: result.name,
            email: result.email
        }
        console.log(objToSend)
        res.status(200).send(JSON.stringify(objToSend))
    }

    else {
        res.status(404).send()
    }

    console.log("received login")
});

app.post("/forget_email",async (req, res) => {
    console.log("Got forget_email")

    const query = {
        email: req.body.email
    }

    const result = await logintab.findOne(query);

    if(result !== null)
    {
        res.status(200).send()
    }
    else {
        res.status(404).send()
    }

    console.log("received forget_email")
});


app.listen(5000, () => {
    console.log("Listening on port 5000...")
})
