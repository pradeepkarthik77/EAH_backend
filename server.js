const express = require("express");
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser');

const nodeMailer = require('nodemailer');

const app = express();

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = "mongodb+srv://pradeep:prad2003@backgroundcluster.pzm6kzq.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

const database = client.db("EAH_db");
const logintab = database.collection("EAH_login");
const otptab = database.collection("EAH_otp")
const alerttable = database.collection("EAH_alerts")
const timetable = database.collection("EAH_timetable")

let transporter = nodeMailer.createTransport({
    host: "smtp.zoho.in",
    secure: true,
    port: 465,
    auth: {
      user: "pradeepkarthik@zohomail.in",
      pass: "Prkamuzolo@447",
    },
  });

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

function generateRandomNumber() {
    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

app.post("/forget_email",async (req, res) => {
    console.log("Got forget_email")

    const query = {
        email: req.body.email
    }

    const result = await logintab.findOne(query);

    if(result !== null)
    {
        email_id = req.body.email;

        otp = generateRandomNumber()

        const mailOptions = {
            from: "pradeepkarthik@zohomail.in", // sender address
            to: email_id,
            subject: "OTP Verification for Exam Alteration Helper", // Subject line
            text: "Hello,\n Your generated OTP for login is: "+otp+"\nThanks!!!", // plain text body
        };

        await transporter.sendMail(mailOptions,async function(err, info) {
        if (err) {
        // handle error
        console.log(err);
        }
        else{
            console.log("Mail sent")

            const filter = { email: email_id };
            const update = { $set: { otp: otp } };
            const options = { upsert: true };

            const result = await otptab.updateOne(filter, update, options);

            res.status(200).send()
        }
        })

    }
    else {
        res.status(404).send()
    }

    console.log("received forget_email")
});

app.post("/otp_handle",async (req,res) => {

    email_id = req.body.email;

    const result = await otptab.findOne({email: email_id})

    if(result != null)
    {
        otp_default = result.otp

        if((req.body.otp+"") == (otp_default+""))
        {
            res.status(200).send({email: result.email})
        }
        else{
            res.status(404).send()
        }
    }
    else{
        res.status(404).send()
    }

})

app.post("/fetch_faculty_alerts",async (req,res) => {
    
    console.log("Got request for faculty alert fetch")

    const result = await alerttable.find({}).toArray()

    if(result != null)
    {
        res.status(200).send({"alertrecords": result})
    }
    else{
        res.status(404).send()
    }

})

app.post("/fetch_faculty_sched",async (req,res) => 
{
    const name = req.body.name

    console.log("Got request for faculty schedule fetch",name)

    const result = await timetable.find({Invigilator: name}).toArray()

    console.log(result)

    if(result != null)
    {
        res.status(200).send({"schedulerecords": result})
    }
    else{
        res.status(404).send()
    }
})


app.listen(5000, () => {
    console.log("Listening on port 5000...")
})
