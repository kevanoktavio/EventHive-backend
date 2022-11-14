const express = require('express')
const mongodb = require('mongodb')
const {MongoClient} = require('mongodb');
require('dotenv').config();

const router = express.Router();

const uri = process.env.MONGODB_URI

const client = new MongoClient(uri);

// get all users
router.get('/', async (req, res) => {
	const users = await loadUserCollection();
	res.send(await users.find({}).toArray());
})

// sign-in using Google. if email exists, return user, else return "Register"
router.post('/g-signin', async (req, res) => {
	const users = await loadUserCollection();
	const userFound = await users.findOne({userEmail: req.body.userEmail});
	if (userFound == null) {
		res.send("Register")
	} else {
		res.send(userFound);
	}
})

// normal sign-in: check if user exists, if so then check if password correct, then return user. if user
// doesn't exist, return "Register". if user exists but pw incorrect, return "Incorrect password"
router.post('/signin', async (req, res) => {
	const users = await loadUserCollection();
	const userFound = await users.findOne(
		{
			userEmail: req.body.userEmail,
		}
	);
	if (userFound == null) {
		res.send("Register")
	} else if (userFound.userPassword != req.body.userPassword) {
		res.send("Incorrect password");
	} else {
		res.send(userFound);
	}
})

// register normally one user 
router.post('/register', async (req, res) => {
	const users = await loadUserCollection();
	const userEmailExists = await users.findOne(
		{
			userEmail: req.body.userEmail,
		}
	)
	const userNameExists = await users.findOne(
		{
			userName: req.body.userName,
		}
	)
	if (!userEmailExists && !userNameExists) {
		const newUser = {
			userName: req.body.userName,
			userPassword: req.body.userPassword,
			userEmail: req.body.userEmail,
			userAge: null,
			userGender: null,
			registeredEvents: [],
			createdEvents: [],
			categoryPrefs: ['Others'],
			userDesc: null, 
			userPhone: null,
			userFullName: req.body.userFullName
		};
		await users.insertOne(newUser);
		res.status(201).send(newUser);
	} else if (!userNameExists) {
		res.status(400).send("Email is in use")
	} else if (!userEmailExists) {
		res.status(400).send("Username is in use")
	} else {
		res.status(400).send("Both username and email are in use")
	}
	
})

// Update user's list of registeredEvents by sending userEmail and new registeredEvents list
router.put('/registered', async (req, res) => {
	const users = await loadUserCollection();
	await users.updateOne(
		{userEmail: req.body.userEmail}, 
		{
			$set: {
			"registeredEvents" : req.body.registeredEvents
			}
		}
	);
	res.status(200).send();
})

// Update user's list of createdEvents by sending userEmail and new createdEvents list
router.put('/created', async (req, res) => {
	const users = await loadUserCollection();
	await users.updateOne(
		{userEmail: req.body.userEmail}, 
		{
			$set: {
			"createdEvents" : req.body.createdEvents
			}
		}
	);
	res.status(200).send();
})

// Update user's list of categoryPrefs by sending userEmail and new categoryPrefs list
router.put('/prefs', async (req, res) => {
	const users = await loadUserCollection();
	await users.updateOne(
		{userEmail: req.body.userEmail}, 
		{
			$set: {
			"categoryPrefs" : req.body.categoryPrefs
			}
		}
	);
	res.status(200).send();
})


// delete user
router.delete('/delete', async(req, res) => {
	const users = await loadUserCollection();
	await users.deleteOne({_id: new mongodb.ObjectId(req.body.id)});
	res.status(200).send();
})

// delete ALL users
router.delete('/deleteall', async(req, res) => {
	const events = await loadUserCollection();
	await events.deleteMany({})
	res.status(200).send();
  })

async function loadUserCollection() {
	await client.connect();
	return client.db('wad2').collection('user');
}

// update user details
router.put('/:id', async (req, res) => {
	const users = await loadUserCollection();
	await users.updateOne({_id: new mongodb.ObjectId(req.params.id)}, {$set: {
		userName: req.body.userName,
		userPassword: req.body.userPassword,
		userAge: req.body.userAge,
		userGender: req.body.userGender,
		categoryPrefs: req.body.categoryPrefs,
		userDesc: req.body.userDesc,
		userPhone: req.body.userPhone,
		categoryPrefs : req.body.categoryPrefs,
		userFullName: req.body.userFullName,
		userPhotoURL: req.body.userPhotoURL
	}});
	res.status(200).send("Update Success");
})


module.exports = router;