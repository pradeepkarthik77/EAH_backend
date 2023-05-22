const express = require("express");
const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb');
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

// let transporter = nodeMailer.createTransport({
//     host: "smtp.zoho.in",
//     secure: true,
//     port: 465,
//     auth: {
//       user: "pradeepkarthik@zohomail.in",
//       pass: "Prkamuzolo@447",
//     },
//   });

const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: "caloriettrackerauth@gmail.com",
      pass: "apfbshzhnkuynhtd",
      authType: "plain"
    }   
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
            email: result.email,
            userType: result.userType
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
            from: "caloriettrackerauth@gmail.com", // sender address
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

        const resulter = await logintab.findOne({email: email_id})

        if((req.body.otp+"") == (otp_default+""))
        {
            res.status(200).send({email: resulter.email,name: resulter.name})
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

app.post("/fetch_view_table",async (req,res) => 
{

    console.log("Got request for faculty schedule fetch")

    const result = await timetable.find({}).toArray()

    console.log(result)

    if(result != null)
    {
        res.status(200).send({"schedulerecords": result})
    }
    else{
        res.status(404).send()
    }
})


app.post("/fetch_edit_profile",async (req,res) => 
{

    console.log("Got request for faculty profile fetch")

    email = req.body.email

    const result = await logintab.findOne({email: email})

    // {"fname":"Pradeep","lname":"Karthik M","email": "cb.en.u4cse20447@cb.students.amrita.edu",
    // "mobile":"8825824693","designation":"Professor","department":"CSE","email_sub":"yes"}

    var username =result.name  

    var nameArray = username.split(' ');

    var fname = nameArray[0];

    var lname = nameArray.slice(1).join(' ');
    
    const objToSend = {
        fname: fname,
        lname: lname,
        email: result.email,
        mobile: result.mobile,
        designation: result.designation,
        department: result.department,
        email_sub: result.email_sub
    }

    if(result != null)
    {
        res.status(200).send({"editrecords": objToSend})
    }
    else{
        res.status(404).send()
    }
})

app.post("/update_edit_profile",async (req,res) => 
{

    console.log("Got request for faculty profile edit")

    email = req.body.email

    let objtoUpdate = {}

    objtoUpdate.name = req.body.fname +" "+req.body.lname 
    objtoUpdate.email = req.body.email
    if(req.body.password != "")
    {
        objtoUpdate.password = req.body.password 
    }
    objtoUpdate.mobile = req.body.mobile 
    objtoUpdate.designation = req.body.designation
    objtoUpdate.department = req.body.department
    objtoUpdate.email_sub = req.body.email_sub

    const result = await logintab.findOne({email: email})

    if(result != null)
    {
        const filter = {email: req.body.email };
        const update = { $set:objtoUpdate };

        const result = await logintab.updateOne(filter, update);

        console.log(result)

        res.status(200).send()
    }
    else{
        res.status(404).send()
    }
})

app.post("/update_admin_profile",async (req,res) => 
{

    console.log("Got request for admin profile edit")

    email = req.body.email

    let objtoUpdate = {}

    objtoUpdate.name = req.body.fname +" "+req.body.lname 
    objtoUpdate.email = req.body.email
    if(req.body.password != "")
    {
        objtoUpdate.password = req.body.password 
    }
    objtoUpdate.mobile = req.body.mobile 
    objtoUpdate.email_sub = req.body.email_sub

    const result = await logintab.findOne({email: email})

    if(result != null)
    {
        const filter = {email: req.body.email };
        const update = { $set:objtoUpdate };

        const result = await logintab.updateOne(filter, update);

        console.log(result)

        res.status(200).send()
    }
    else{
        res.status(404).send()
    }
})

app.post("/edit_exam",async (req,res) => 
{

    console.log("Got request for editing an exam")

    id = req.body.formdata._id

    let objecttoupdate = req.body.formdata

    // console.log(id)
    console.log("Formdata",objecttoupdate)

    const result = await timetable.findOne( {_id: new ObjectId(id)})

    if(result != null)
    {
        const filter =  {_id: new ObjectId(id)};
        

        const objtoUpdate = {}

        objtoUpdate.date = objecttoupdate.date
        objtoUpdate.TimeSlot = objecttoupdate.TimeSlot
        objtoUpdate.Invigilator = objecttoupdate.Invigilator
        objtoUpdate.Hall = objecttoupdate.Hall 
        objtoUpdate.course = objecttoupdate.course 


        const update = { $set: objtoUpdate};

        const result = await timetable.updateOne(filter, update);

        console.log("editresult",result)

        res.status(200).send()
    }
    else{
        res.status(404).send()
    }
})

app.post("/delete_exam",async (req,res) => 
{

    console.log("Got request for deleting an exam")

    id = req.body._id

    const result = await timetable.findOne( {_id: new ObjectId(id)})

    if(result != null)
    {
        const result = await timetable.deleteOne({_id: new ObjectId(id)});

        console.log(result)

        res.status(200).send()
    }
    else{
        res.status(404).send()
    }
})

app.post("/add_exam",async (req,res) => 
{

    let tempdata = req.body.formdata

    console.log("Got request for adding exam")

    const objtoUpdate = {}

        objtoUpdate.date = tempdata.date
        objtoUpdate.TimeSlot = tempdata.TimeSlot
        objtoUpdate.Invigilator = tempdata.Invigilator
        objtoUpdate.Hall = tempdata.Hall 
        objtoUpdate.course = tempdata.course 

    try {
        const result = await timetable.insertOne(objtoUpdate);
        res.status(200).send()
      } catch (err) {
        res.status(404).send();
      }

    res.status(404).send()
})

app.listen(5000, () => {
    console.log("Listening on port 5000...")
})
