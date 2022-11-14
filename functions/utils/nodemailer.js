var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wad.eventhive@gmail.com',
    pass: 'nvseyasncqvenkay'
  }
});

var mailOptions = {
  from: 'wad.eventhive@gmail.com',
  to: 'myfriend@yahoo.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

export function sendDateChangeEmail (userEmail, eventObj) {
    var mailOptions = {
        from: 'wad.eventhive@gmail.com',
        to: userEmail,
        subject: 'Eventhive - Some event details have changed',
        text: 'Hello'
      };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});