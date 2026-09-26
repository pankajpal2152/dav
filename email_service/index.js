// const db = require('../config/db');
// const transporter = require('../config/smtpServer');
// const crypto = require('crypto'); // built-in Node — no install needed

// const FROM_ADDRESS = '"Desun Hospital Digital Dashboard" <Dev@cssoffice.sg>';

// // ─────────────────────────────────────────────────────────────────────────────
// // CORE HELPER — Fetch template from SP and send email
// // All 3 functions use the same pattern — extracted here to avoid repetition
// // ─────────────────────────────────────────────────────────────────────────────
// async function sendForgotPasswordOTPNotification({ otp, emailId, name, userSysId }) {
//     let conn;
//     try {

//         const otpEmailBody = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Password Reset OTP</title>
// </head>
// <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
//     <tr>
//       <td align="center">
//         <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

//           <!-- Header -->
//           <tr>
//             <td style="background:linear-gradient(135deg,#0a6ef5 0%,#00c6ff 100%);padding:36px 40px;text-align:center;">
//               <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:3px;font-family:'Segoe UI',Arial,sans-serif;">
//                 DESUN <span style="color:#cceeff;">HOSPITAL</span>
//               </div>
//               <div style="font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;margin-top:6px;">
//                 Digital Dashboard
//               </div>
//             </td>
//           </tr>

//           <!-- Body -->
//           <tr>
//             <td style="padding:40px 40px 32px;">

//               <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hello, <strong style="color:#111827;">${name}</strong></p>
//               <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 32px;">
//                 We received a request to reset your password for your Desun Hospital account.
//                 Use the OTP below to proceed.
//               </p>

//               <!-- OTP Box -->
//               <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
//                 <tr>
//                   <td align="center">
//                     <div style="display:inline-block;background:#f0f9ff;border:2px dashed #00c6ff;border-radius:14px;padding:28px 48px;text-align:center;">
//                       <div style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#0a6ef5;margin-bottom:12px;">
//                         Your OTP Code
//                       </div>
//                       <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#0a6ef5;font-family:'Courier New',monospace;line-height:1;">
//                         ${otp}
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               </table>

//               <!-- Steps -->
//               <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
//                 <tr>
//                   <td>
//                     <div style="font-size:12px;font-weight:600;color:#374151;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">How to reset your password</div>
//                     <table cellpadding="0" cellspacing="0">
//                       <tr>
//                         <td style="padding:4px 0;">
//                           <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#0a6ef5;color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">1</span>
//                           <span style="font-size:13px;color:#6b7280;">Go back to the password reset page</span>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style="padding:4px 0;">
//                           <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#0a6ef5;color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">2</span>
//                           <span style="font-size:13px;color:#6b7280;">Enter the 6-digit OTP above</span>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style="padding:4px 0;">
//                           <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#0a6ef5;color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">3</span>
//                           <span style="font-size:13px;color:#6b7280;">Set your new secure password</span>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//               </table>

//               <!-- Warning -->
//               <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
//                 <tr>
//                   <td>
//                     <p style="font-size:12px;color:#92400e;margin:0;line-height:1.6;">
//                       <strong>⚠ Didn't request this?</strong> If you did not request a password reset,
//                       please ignore this email or contact our support team immediately.
//                       Your account remains secure.
//                     </p>
//                   </td>
//                 </tr>
//               </table>

//               <p style="font-size:13px;color:#9ca3af;margin:0;">
//                 Regards,<br>
//                 <strong style="color:#374151;">Desun Hospital IT Team</strong>
//               </p>

//             </td>
//           </tr>

//           <!-- Footer -->
//           <tr>
//             <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
//               <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.8;">
//                 This is an automated email. Please do not reply to this message.<br>
//                 © ${new Date().getFullYear()} Desun Hospital · Secure Portal · 
//               </p>
//             </td>
//           </tr>

//         </table>
//       </td>
//     </tr>
//   </table>

// </body>
// </html>`;

//         const subject = `🔐 Password Reset OTP — Desun Hospital Digital Dashboard`;

//         const msgToken = crypto
//             .createHash('sha256')
//             .update(`FORGOT_PWD-${userSysId}-${emailId}-${Date.now()}`)
//             .digest('hex')
//             .slice(0, 24);

//         await transporter.sendMail({
//             from: FROM_ADDRESS,
//             to: emailId,
//             subject: subject,
//             html: otpEmailBody,
//             headers: {
//                 'Message-ID': `<FORGOT_PWD-${msgToken}@desunhospital.com>`,
//                 'Precedence': 'first-class',
//                 'X-Mailer': 'Desun-Hospital-Mailer',
//                 'X-Transaction-Type': 'FORGOT_PASSWORD_OTP',
//             },
//         });

//         console.log(`[EmailService] OTP email sent | to=${emailId} | userSysId=${userSysId}`);
//         return true;

//     } catch (error) {
//         console.error(`[EmailService] OTP email failed | to=${emailId} | userSysId=${userSysId} | Error: ${error.message}`);
//         return false;
//     }
// }



// module.exports = {
//     sendForgotPasswordOTPNotification
// };