const express = require('express')
const axios = require('axios');

const router = express.Router();


router.get('/:query', async (req, res) => {
	const query = req.params.query
	axios.get(`https://developers.onemap.sg/commonapi/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`)
		.then((response) => {
			res.send(response.data);
			console.log(response.data)
		})
		.catch((error) => {
			res.send(error);
			console.log(error)
		})
})

router.post('/', async (req, res) => {
	const locations = await loadLocationCollection();
	await locations.insertOne({
        eventID: req.body.eventID,
        eventDate: new Date(),
        eventLocation: req.body.eventLocation,
        attendees: []
	});
	res.status(201).send();
})


router.delete('/:id', async(req, res) => {
	const locations = await loadLocationCollection();
	await locations.deleteOne({_id: new mongodb.ObjectId(req.params.id)});
	res.status(200).send();
})

module.exports = router;