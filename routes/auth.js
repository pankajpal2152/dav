const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../email_service/index');


/**
 * @swagger
 * /api/auth/api-post-authenticate-user:
 *   post:
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token returned
 */

router.post('/api-post-authenticate-user', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body); // JSON input as string
    const [rows] = await conn.execute(
      "CALL USP_POST_USER_AUTHENTICATE_ACTIVITY(?, ?, @ERRNO, @ERRMSG);",
      ['AUTHENTICATE_USER', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      if (result.status === 'true') {
        const token = jwt.sign(result, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ Token: token, ...result });
      }
      else {
        return res.status(401).json(result);
      }
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/auth/api-post-change-password:
 *   post:
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token returned
 */
router.post('/api-post-change-password', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body); // JSON input as string
    const [rows] = await conn.execute(
      "CALL USP_POST_USER_AUTHENTICATE_ACTIVITY(?, ?, @ERRNO, @ERRMSG);",
      ['CHANGE_PASSWORD', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.status(200).json(result);

    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/auth/api-post-user-verification:
 *   post:
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token returned
 */
router.post('/api-post-user-verification', async (req, res) => {
  // let conn;
  // try {
  //   conn = await db.getConnection();
  //   const requestJson = JSON.stringify(req.body); // JSON input as string
  //   const [rows] = await conn.execute(
  //     "CALL USP_POST_USER_AUTHENTICATE_ACTIVITY(?, ?, @ERRNO, @ERRMSG);",
  //     ['USER_VERIFICATION', requestJson]
  //   );
  //   if (rows && rows[0] && rows[0][0]) {
  //     const result = rows[0][0].JSON_VALUE;
  //     const requestBody = req.body[0];
  //     if (requestBody.ITEM == 'EMAIL_VERIFICATION') {
  //       emailService.sendForgotPasswordOTPNotification({
  //         otp: result.OTP,
  //         emailId: result.USER_NAME,
  //         name: result.FIRST_NAME,
  //         userSysId: result.USER_SYS_ID
  //       })
  //     }
  //     return res.status(200).json(result);
  //   } else {
  //     return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
  //   }
  // } catch (error) {
  //   return res.status(500).json({ error: error.message });
  // }
  // finally {
  //   if (conn) conn.release();
  // }
});
module.exports = router;
