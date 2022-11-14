const functions = require("firebase-functions");
const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

const users = require('./api/users');
const events = require('./api/events');
const locations = require('./api/locations');

app.use('/api/users', users);
app.use('/api/events', events);
app.use('/api/locations', locations);

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));

exports.app = functions.https.onRequest(app);

