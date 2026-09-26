// const nodemailer = require('nodemailer');
 
// const transporter = nodemailer.createTransport({
//   host: 'Mail.cssoffice.sg',
//   port: 587,              
//   secure: false,              // Set to true if port is 465
//   auth: {
//     user: 'Dev@cssoffice.sg',
//     pass: 'CSSdemo@0736',  
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });
 
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP Connection Error:', error.message);
//   } else {
//     console.log('SMTP Server is ready to send emails');
//   }
// });
 
// module.exports = transporter;