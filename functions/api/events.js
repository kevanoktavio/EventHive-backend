const express = require('express')
const mongodb = require('mongodb')
const {MongoClient} = require('mongodb');
var nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

// get all events
router.get('/', async (req, res) => {
  const events = await loadEventCollection();
  res.send(await events.find({}).toArray());
})

// create event
router.post('/', async (req, res) => {
  const events = await loadEventCollection();
  let result = await events.insertOne({
        eventDate: new Date(req.body.eventDate), 
        eventTime: req.body.eventTime,
        eventLocation: req.body.eventLocation,
        eventCategory: req.body.eventCategory,
        eventDesc: req.body.eventDesc,
        attendees: [],
        eventPhotoURL: req.body.eventPhotoURL,
        eventName: req.body.eventName,
        eventReviews: [], 
        eventHost: req.body.eventHost,
        maxCapacity: req.body.maxCapacity,
        isBuzzing: false,
  });
  res.status(201).send(result.insertedId); //returns the _id of newly created event
})

router.delete('/delete/:id', async(req, res) => {
  const events = await loadEventCollection();
  const eventID = new mongodb.ObjectId(req.params.id)
  const event = await events.findOne({
    _id: eventID
  })
  await event.attendees.forEach(async (userObj) => {
    sendCancelEventEmail(userObj.userEmail, event)
  })
  await events.deleteOne({_id: eventID});
  res.status(200).send();
})

router.delete('/delete', async(req, res) => {
  const events = await loadEventCollection();

  await events.deleteOne({_id: new mongodb.ObjectId(req.body.id)});
  res.status(200).send();
})

// delete ALL events
router.delete('/deleteall', async(req, res) => {
  const events = await loadEventCollection();
  await events.deleteMany({})
  res.status(200).send();
})

//filter event by date range
router.post('/date', async(req, res) => {
  const queriedDateStart = req.body.dateStart;
  const queriedDateEnd = req.body.dateEnd;
  // res.send(Date(queriedDateStart));

  const events = await loadEventCollection();
  // res.send(await events.find({}).toArray());
  
  const filteredEvents = await events.find({
    eventDate: {
      $gte: new Date(queriedDateStart),
      $lte: new Date(queriedDateEnd)
    }
  }).toArray();
  res.send(filteredEvents);
});

//  filter events by categories 
router.post('/categories', async(req, res) => {
  const arrayOfCategories = req.body.categories; //the json input must be in array format  
  // res.send(arrayOfCategories);

  const events = await loadEventCollection();
  
  const filteredEvents = await events.find({
    eventCategory: {
      $in: arrayOfCategories
    }
  }).toArray();
  res.send(filteredEvents);
});

//filter event by location
router.post('/location', async(req, res) => {
  console.log("This is me trying to get events by location");
  // input: long lat

  const queriedLong = req.body.eventLong;
  const queriedLat = req.body.eventLat;

  const events = await loadEventCollection();
  res.send(await events.find({}).toArray());
  // returns the whole events table, then process on the front end to find the locations
  
})

router.put('/reviews', async(req, res) => {
  const events = await loadEventCollection();
  const newReviewsList = req.body.eventReviews;
  const eventID = req.body._id;
  await events.updateOne(
    {_id: mongodb.ObjectId(eventID)},
    {$set:{eventReviews: newReviewsList}}
  );
  res.status(200).send();
})

router.put('/attendees', async(req, res) => {
  const events = await loadEventCollection();
  const newAttendeesList = req.body.attendees;
  const eventID = req.body._id;
  await events.updateOne(
    {_id: mongodb.ObjectId(eventID)},
    {$set:{attendees: newAttendeesList}}
  );
  res.status(200).send();
})

router.put('/buzzing', async(req, res) => {
  const events = await loadEventCollection();
  const isBuzzing = req.body.isBuzzing;
  const eventID = req.body._id;
  await events.updateOne(
    {_id: mongodb.ObjectId(eventID)},
    {$set:{isBuzzing: isBuzzing}}
  );
  res.status(200).send();
})

router.put('/date', async(req, res) => {
  const events = await loadEventCollection();
  const eventDate = new Date(req.body.eventDate);
  const eventID = req.body._id;
  await events.updateOne(
    {_id: mongodb.ObjectId(eventID)},
    {$set:{eventDate: eventDate}}
  );
  const event = await events.findOne(
    {
      _id: mongodb.ObjectId(eventID)
    }
  )
  event.attendees.forEach(async (userObj) =>  {
    sendDateChangeEmail(userObj.userEmail, event)
  })
  res.status(200).send();
})

router.put('/capacity', async(req, res) => {
  const events = await loadEventCollection();
  const maxCapacity = req.body.maxCapacity;
  const eventID = req.body._id;
  await events.updateOne(
    {_id: mongodb.ObjectId(eventID)},
    {$set:{maxCapacity: maxCapacity}}
  );
  res.status(200).send();
})

router.put('/edit/:id', async (req, res) => {
  const events = await loadEventCollection();
  await events.updateOne({_id: new mongodb.ObjectId(req.params.id)}, {$set: {
   eventDate: new Date(req.body.eventDate), 
     eventTime: req.body.eventTime,
     eventLocation: req.body.eventLocation,
     eventCategory: req.body.eventCategory,
     eventDesc: req.body.eventDesc,
     eventPhotoURL: req.body.eventPhotoURL,
     eventName: req.body.eventName,
     maxCapacity: req.body.maxCapacity
  }});
  res.status(200).send("Update Success");
 })

async function loadEventCollection() {
  await client.connect();
  return client.db('wad2').collection('event');
}

async function loadUserCollection() {
	await client.connect();
	return client.db('wad2').collection('user');
}

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wad.eventhive@gmail.com',
    pass: 'nvseyasncqvenkay'
  }
});

function sendDateChangeEmail (userEmail, eventObj) {
    var mailOptions = {
        from: 'wad.eventhive@gmail.com',
        to: userEmail,
        subject: 'Eventhive - Some event details have changed',
        html: `
        <h2>Hi there!</h2>
        The date has changed for <strong>${eventObj.eventName}</strong>
        <br>
        <h3>Here are the updated event details:</h3>
        <h4>${eventObj.eventName}</h4>
        Date: ${eventObj.eventDate.toString().split(" ").slice(0,4).join(" ")}<br><br>
        Time: ${eventObj.eventTime}<br><br>
        Location: ${eventObj.eventLocation.SEARCHVAL}<br><br>
        Description: ${eventObj.eventDesc}<br><br>
        We hope to see you there!<br><br>
        - Your friendly Eventhive bee
        `
      };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
  }
    
function sendCancelEventEmail (userEmail, eventObj) {
  var mailOptions = {
      from: 'wad.eventhive@gmail.com',
      to: userEmail,
      subject: 'Eventhive - An event has been cancelled',
      html: `
      <h2>Hi there!</h2>
      We have some bad news for you... <br>
      The <strong>${eventObj.eventName}</strong> event you've signed up for has been cancelled.
      <br>
      <h3>These were the event details:</h3>
      <h4>${eventObj.eventName}</h4>
      Date: ${eventObj.eventDate.toString().split(" ").slice(0,4).join(" ")}<br><br>
      Time: ${eventObj.eventTime}<br><br>
      Location: ${eventObj.eventLocation.SEARCHVAL}<br><br>
      Description: ${eventObj.eventDesc}<br><br>
      You can always check out Eventhive for many other events. See you there!<br><br>
      - Your friendly Eventhive bee
      `
    };
  transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }


module.exports = router;