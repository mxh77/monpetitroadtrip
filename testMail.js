require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const mailOptions = {
    from: process.env.EMAIL,
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'This is a test email sent from Nodemailer.'
};

transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        return console.error('Error sending email:', err);
    }
    console.log('Email sent:', info.response);
});