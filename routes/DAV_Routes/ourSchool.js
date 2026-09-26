const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const auth = require('../../middlewares/auth');

// Login

/**

  * @swagger
  * /api/ourSchool/api-post-authenticate-user:
  *   post:
  *     summary: Authenticate User
  *     description: Authenticates a user using username and password.
  *     tags:
  *       - Authentication
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: array
  *             items:
  *               type: object
  *               required:
  *                 - USER_NAME
  *                 - PASSWORD
  *               properties:
  *                 USER_NAME:
  *                   type: string
  *                   example: ""
  *                 PASSWORD:
  *                   type: string
  *                   format: password
  *                   example: ""
  *           example:
  *             - USER_NAME: ""
  *               PASSWORD: ""
  *     responses:
  *       200:
  *         description: User authenticated successfully
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 status:
  *                   type: string
  *                   example: "true"
  *                 message:
  *                   type: string
  *                   example: User authenticated successfully
  *                 Token:
  *                   type: string
  *                 response:
  *                   type: array
  *                   items:
  *                     type: object
  *       400:
  *         description: Username and password are required
  *       401:
  *         description: Authentication failed
  *       500:
  *         description: Internal server error
  */


router.post("/api-post-authenticate-user", async (req, res) => {

  let conn;

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        status: "false",
        response: "JWT_SECRET is not configured",
      });
    }

    conn = await db.getConnection();

    const requestBody = Array.isArray(req.body)
      ? req.body
      : [req.body || {}];

    const requestObj = requestBody[0] || {};

    if (!requestObj.USER_NAME || !requestObj.PASSWORD) {
      return res.status(400).json({
        status: "false",
        message: "Username and password are required",
      });
    }

    const requestJson = JSON.stringify(requestBody);

    const [rows] = await conn.execute(
      "CALL USP_POST_USER_AUTHENTICATE_ACTIVITY(?, ?, @ERRNO, @ERRMSG);",
      [
        "AUTHENTICATE_USER",
        requestJson
      ]
    );

    if (rows && rows[0] && rows[0][0]) {
      let result = rows[0][0].JSON_VALUE;
      if (typeof result === "string") {
        result = JSON.parse(result);
      }

      if (result.status === "true") {

        const userData = {
          USER_SYS_ID: result.USER_SYS_ID,
          NAME: result.NAME,
          EMAIL: result.EMAIL || requestObj.USER_NAME,
          MOBILE_NO: result.MOBILE_NO,
          SYSTEM_ROLE_ID: result.SYSTEM_ROLE_ID,
          SYSTEM_ROLE_NAME: result.SYSTEM_ROLE_NAME,
          USER_GROUP_SYS_ID: result.USER_GROUP_SYS_ID,
          USER_GROUP_NAME: result.USER_GROUP_NAME,
          ORGANISATION_SYS_ID: result.ORGANISATION_SYS_ID,
          TEMP_LOGIN: result.TEMP_LOGIN,
          INITIAL_LOGIN: result.INITIAL_LOGIN,
          AUTHENTICATION_PROCESS: result.AUTHENTICATION_PROCESS
        };

        // Generate JWT

        const token = jwt.sign(
          userData,
          process.env.JWT_SECRET,
          {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
          }
        );

        return res.status(200).json({
          status: "true",
          message: result.message || "User authenticated successfully",
          Token: token,
          response: [userData]
        });

      } else {
        return res.status(401).json(result);
      }

    } else {
      return res.status(500).json({
        status: "false",
        response: "Oops!! something went wrong"
      });
    }

  } catch (error) {
    console.error(
      "api-post-authenticate-user Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
});


// Transfer Certificate

// View Transfer Certificate

/**
* @swagger
* tags:
*   - name: Transfer Certificate
*     description: Transfer Certificate APIs
*/
/**
* @swagger
* /api/ourSchool/api-get-view-transfer-certificate:
*   get:
*     summary: View Transfer Certificate Details
*     description: Retrieves transfer certificate details using the VIEW_TRANSFER_CERTIFICATE_DETAILS operation.
*     tags:
*       - Transfer Certificate
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*     responses:
*       200:
*         description: Transfer certificate details retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 response:
*                   type: array
*                   items:
*                     type: object
*       400:
*         description: Invalid request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-transfer-certificate", async (req, res) => {
  let connection;
  try {
    const item = req.query.ITEM || "VIEW_ALL";
    connection = await db.getConnection();
    const [result] = await connection.query(`CALL USP_GET_VIEW_TRANSFER_CERTIFICATE_ACTIVITY(
          'VIEW_TRANSFER_CERTIFICATE_DETAILS',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;
    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message: errmsg || "Failed to retrieve transfer certificate details",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }
    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-transfer-certificate Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

// Transfer Archive APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-transfer-certificate-archive:
*   post:
*     summary: Add or Update Transfer Certificate
*     description: Adds a new transfer certificate or updates an existing transfer certificate.
*     tags:
*       - Transfer Certificate
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ARCHIVE_TRANSFER_CERTIFICATE
*                     TITLE:
*                       type: string
*                       example: REG20260001
*                     SESSION_YEAR:
*                       type: string
*                       example: 2026-2027
*             example:
*               data:
*                 - ITEM: ARCHIVE_TRANSFER_CERTIFICATE
*                   TITLE: REG20260001
*                   SESSION_YEAR: 2026-2027
*     responses:
*       200:
*         description: Transfer certificate added or updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 message:
*                   type: string
*                   example: Transfer certificate added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-transfer-certificate-archive", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();

    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_TRANSFER_CERTIFICATE_ACTIVITY(
          'ADD_UPDATE_TRANSFER_CERTIFICATE',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update archive transfer certificate",
      });
    }
    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Transfer certificate archived or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-transfer-certificate-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-post-add-update-transfer-certificate-unarchive:
*   post:
*     summary: Add or Update Transfer Certificate
*     description: Adds a new transfer certificate or updates an existing transfer certificate.
*     tags:
*       - Transfer Certificate
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: UNARCHIVE_TRANSFER_CERTIFICATE
*                     TITLE:
*                       type: string
*                       example: REG20260001
*                     SESSION_YEAR:
*                       type: string
*                       example: 2026-2027
*             example:
*               data:
*                 - ITEM: UNARCHIVE_TRANSFER_CERTIFICATE
*                   TITLE: REG20260001
*                   SESSION_YEAR: 2026-2027
*     responses:
*       200:
*         description: Transfer certificate added or updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 message:
*                   type: string
*                   example: Transfer certificate added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-transfer-certificate-unarchive", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();

    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_TRANSFER_CERTIFICATE_ACTIVITY(
          'ADD_UPDATE_TRANSFER_CERTIFICATE',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update unarchive transfer certificate",
      });
    }
    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Transfer certificate unarchived or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-transfer-certificate-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-archive-transfer-certificate:
*   get:
*     summary: View Archive Transfer Certificate
*     description: Retrieves archived transfer certificate details for the selected session year.
*     tags:
*       - Transfer Certificate
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*       - in: query
*         name: SESSION_YEAR
*         required: true
*         schema:
*           type: string
*           example: 2026-2027
*         description: Academic session year
*     responses:
*       200:
*         description: Archive transfer certificate details retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 response:
*                   type: array
*                   items:
*                     type: object
*       400:
*         description: Invalid request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-archive-transfer-certificate", auth, async (req, res) => {
  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ALL";
    const sessionYear = req.query.SESSION_YEAR;

    if (!sessionYear) {
      return res.status(400).json({
        status: "false",
        message: "SESSION_YEAR is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_ARCHIVE_TRANSFER_CERTIFICATE_ACTIVITY(
          'VIEW_ARCHIVE_TRANSFER_CERTIFICATE',
          ?,
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item, sessionYear]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve archive transfer certificate details",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-archive-transfer-certificate Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

/**
* @swagger
* /api/ourSchool/api-post-add-update-transfer-certificate:
*   post:
*     summary: Add or Update Transfer Certificate
*     description: Adds a new transfer certificate or updates an existing transfer certificate.
*     tags:
*       - Transfer Certificate
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ADD_UPDATE
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     REGISTRATION_NO:
*                       type: string
*                       example: REG20260001
*                     TITLE:
*                       type: string
*                       example: REG20260001
*                     STUDENT_NAME:
*                       type: string
*                       example: John Doe
*                     CLASS:
*                       type: string
*                       example: "10"
*                     FILE_NAME:
*                       type: string
*                       example: john_doe_tc.pdf
*                     DATE_OF_ISSUE:
*                       type: string
*                       example: 16-09-2026
*             example:
*               data:
*                 - ITEM: ADD_UPDATE
*                   RECORD_SYS_ID: 0
*                   REGISTRATION_NO: REG20260001
*                   TITLE: REG20260001
*                   STUDENT_NAME: John Doe
*                   CLASS: "10"
*                   FILE_NAME: john_doe_tc.pdf
*                   DATE_OF_ISSUE: 16-09-2026
*     responses:
*       200:
*         description: Transfer certificate added or updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 message:
*                   type: string
*                   example: Transfer certificate added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-transfer-certificate", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();

    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_TRANSFER_CERTIFICATE_ACTIVITY(
          'ADD_UPDATE_TRANSFER_CERTIFICATE',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update transfer certificate",
      });
    }
    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Transfer certificate added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-transfer-certificate Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

// Mandatory Details

// Document API

/**
* @swagger
* /api/ourSchool/api-post-add-update-document-details:
*   post:
*     summary: Add or Update Document Details
*     description: Adds or updates document details.
*     tags:
*       - Document Details
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ADD
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Employee Policy Document
*                     DESCRIPTION:
*                       type: string
*                       example: Document containing employee policies and guidelines.
*                     FILE_NAME:
*                       type: string
*                       example: employee-policy.pdf
*             example:
*               data:
*                 - ITEM: ADD
*                   RECORD_SYS_ID: 0
*                   TITLE: Employee Policy Document
*                   DESCRIPTION: Document containing employee policies and guidelines.
*                   FILE_NAME: employee-policy.pdf
*     responses:
*       200:
*         description: Document details added or updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 message:
*                   type: string
*                   example: Document details added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-document-details", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }

    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();

    const jsonString = JSON.stringify(jsonData);

    const [result] = await connection.query(`CALL USP_POST_DOCUMENT_DETAILS_ACTIVITY(
          'ADD_UPDATE_DOCUMENT_DETAILS',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update document details",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Document details added or updated successfully",
      response: result,
    });
  } catch (error) {
    console.error(
      "api-post-add-update-document-details Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

/**
* @swagger
* /api/ourSchool/api-get-view-document-details:
*   get:
*     summary: View Document Details
*     description: Retrieves document details.
*     tags:
*       - Document Details
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*     responses:
*       200:
*         description: Document details retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "true"
*                 response:
*                   type: array
*                   items:
*                     type: object
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-document-details", auth, async (req, res) => {

  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ALL";
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_DOCUMENT_DETAILS_ACTIVITY(
          'VIEW_DOCUMENT_DETAILS',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve document details",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-document-details Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


// Gallery API

/**
* @swagger
* /api/ourSchool/api-post-add-update-image-gallery:
*   post:
*     summary: Add or Update Image Gallery
*     description: Adds a new image gallery or updates an existing image gallery.
*     tags:
*       - Image Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ADD
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Annual Function
*                     DESCRIPTION:
*                       type: string
*                       example: Annual function gallery
*                     STATUS:
*                       type: string
*                       example: ACTIVE
*             example:
*               data:
*                 - ITEM: ADD
*                   RECORD_SYS_ID: 0
*                   TITLE: Annual Function
*                   DESCRIPTION: Annual function gallery
*                   STATUS: ACTIVE
*     responses:
*       200:
*         description: Image gallery added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-image-gallery", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();
    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_IMAGE_GALLERY_ACTIVITY(
          'ADD_UPDATE_IMAGE_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update image gallery",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Image gallery added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-image-gallery Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-archive-gallery-image:
*   get:
*     summary: View Archive Gallery Images
*     description: Retrieves archived gallery images for a specific session year.
*     tags:
*       - Image Gallery
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ARCHIVE_IMAGE_GALLERY
*         description: Item used to retrieve archive gallery images
*       - in: query
*         name: SESSION_YEAR
*         required: true
*         schema:
*           type: string
*           example: 2026-2027
*         description: Academic session year
*     responses:
*       200:
*         description: Archive gallery images retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-archive-gallery-image", async (req, res) => {

  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ARCHIVE_IMAGE_GALLERY";

    const sessionYear = req.query.SESSION_YEAR;

    if (!sessionYear) {
      return res.status(400).json({
        status: "false",
        message: "SESSION_YEAR is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_ARCHIVE_IMAGE_GALLERY_ACTIVITY(
          'VIEW_GALLERY_IMAGE_DETAILS',
          ?,
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item, sessionYear]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve archive gallery images",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-archive-gallery-image Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

// Archive Image Gallery

/**
* @swagger
* /api/ourSchool/api-post-add-update-image-gallery-archive:
*   post:
*     summary: Add or Update Image Gallery
*     description: Adds a new image gallery or updates an existing image gallery.
*     tags:
*       - Image Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ARCHIVE_IMAGE_GALLERY
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Annual Function
*                     SESSION_YEAR:
*                       type: string
*                       example: 2024-25
*             example:
*               data:
*                 - ITEM: ARCHIVE_IMAGE_GALLERY
*                   RECORD_SYS_ID: 123
*                   TITLE: Annual Function
*                   SESSION_YEAR: 2024-25
*     responses:
*       200:
*         description: Image gallery added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-image-gallery-archive", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();
    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_IMAGE_GALLERY_ACTIVITY(
          'ADD_UPDATE_IMAGE_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update image gallery",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Image gallery added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-image-gallery-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

/**
* @swagger
* /api/ourSchool/api-post-add-update-image-gallery-unarchive:
*   post:
*     summary: Add or Update Image Gallery
*     description: Adds a new image gallery or updates an existing image gallery.
*     tags:
*       - Image Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: UNARCHIVE_IMAGE_GALLERY
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Annual Function
*                     SESSION_YEAR:
*                       type: string
*                       example: 2024-25
*             example:
*               data:
*                 - ITEM: UNARCHIVE_IMAGE_GALLERY
*                   RECORD_SYS_ID: 123
*                   TITLE: Annual Function
*                   SESSION_YEAR: 2024-25
*     responses:
*       200:
*         description: Image gallery added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-image-gallery-unarchive", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (!requestData) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    connection = await db.getConnection();
    const jsonString = JSON.stringify(jsonData);
    const [result] = await connection.query(`CALL USP_POST_IMAGE_GALLERY_ACTIVITY(
          'ADD_UPDATE_IMAGE_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update image gallery",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Image gallery added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-image-gallery-unarchive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-gallery-image:
*   get:
*     summary: View Gallery Images
*     description: Retrieves images belonging to a specific gallery.
*     tags:
*       - Image Gallery
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*       - in: query
*         name: GALLERY_SYS_ID
*         required: true
*         schema:
*           type: string
*           example: "123"
*         description: Gallery system ID
*     responses:
*       200:
*         description: Gallery images retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-gallery-image", async (req, res) => {

  let connection;

  try {
    const gallerySysIdParam = req.query.GALLERY_SYS_ID;
    // GALLERY_SYS_ID=0 lists the galleries; any other id lists that gallery's photos.
    const item = !req.query.ITEM || req.query.ITEM === "VIEW_ALL"
      ? (!gallerySysIdParam || gallerySysIdParam === "0" ? "VIEW_IMAGE_GALLERY" : "VIEW_GALLERY_PHOTO")
      : req.query.ITEM;
    const gallerySysId = req.query.GALLERY_SYS_ID;

    if (!gallerySysId) {
      return res.status(400).json({
        status: "false",
        message: "GALLERY_SYS_ID is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_IMAGE_GALLERY_ACTIVITY(
          'VIEW_GALLERY_IMAGE_DETAILS',
          ?,
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item, gallerySysId]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve gallery images",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-gallery-image Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

// Video Gallery APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-video-gallery:
*   post:
*     summary: Add or Update Video Gallery
*     description: Adds a new video gallery record or updates an existing video gallery record.
*     tags:
*       - Video Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: array
*             items:
*               type: object
*               required:
*                 - ITEM
*                 - RECORD_SYS_ID
*                 - TITLE
*                 - DESCRIPTION
*                 - URL
*                 - STATUS
*               properties:
*                 ITEM:
*                   type: string
*                   example: ADD
*                   description: Operation item. Use ADD for adding and UPDATE for updating.
*                 RECORD_SYS_ID:
*                   type: integer
*                   example: 0
*                   description: Record system ID. Use 0 for a new record.
*                 TITLE:
*                   type: string
*                   example: Sample Title
*                 DESCRIPTION:
*                   type: string
*                   example: Sample Description
*                 URL:
*                   type: string
*                   example: https://example.com/video.mp4
*                 STATUS:
*                   type: string
*                   example: ACTIVE
*     responses:
*       200:
*         description: Video gallery record saved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-video-gallery", auth, async (req, res) => {
  let connection;

  try {
    const requestJson = JSON.stringify(req.body);
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_POST_VIDEO_GALLERY_ACTIVITY(
          'ADD_UPDATE_VIDEO_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );`,
      [requestJson]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add/update video gallery"
      });
    }

    let response = [];
    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }

      }

    }

    return res.status(200).json({
      status: "true",
      message: "Video gallery saved successfully",
      response
    });

  } catch (error) {
    console.error(
      "api-post-add-update-video-gallery Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-gallery-video:
*   get:
*     summary: View Video Gallery
*     description: Retrieves video gallery details based on the specified item.
*     tags:
*       - Video Gallery
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: false
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve. Defaults to VIEW_ALL if not provided.
*     responses:
*       200:
*         description: Video gallery details retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-gallery-video", async (req, res) => {
  let connection;
  try {
    const item = !req.query.ITEM || req.query.ITEM === "VIEW_ALL" ? "VIEW_VIDEO_GALLERY" : req.query.ITEM;
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_VIDEO_GALLERY_ACTIVITY('VIEW_GALLERY_VIDEO_DETAILS',
        ?,
        @ERRNO,
        @ERRMSG
      );`,
      [item]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message: errmsg || "Failed to retrieve video gallery details"
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response
    });

  } catch (error) {
    console.error(
      "api-get-view-gallery-video Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


// Archive Video APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-video-gallery-archive:
*   post:
*     summary: Add or Update Video Gallery
*     description: Adds a new video gallery record or updates an existing video gallery record.
*     tags:
*       - Video Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: array
*             items:
*               type: object
*               required:
*                 - ITEM
*                 - RECORD_SYS_ID
*                 - TITLE
*                 - SESSION_YEAR
*               properties:
*                 ITEM:
*                   type: string
*                   example: ARCHIVE_VIDEO_GALLERY
*                   description: Operation item. Use ADD for adding and UPDATE for updating.
*                 RECORD_SYS_ID:
*                   type: integer
*                   example: 0
*                   description: Record system ID. Use 0 for a new record.
*                 TITLE:
*                   type: string
*                   example: Sample Title
*                 SESSION_YEAR:
*                   type: string
*                   example: 2023-2024
*     responses:
*       200:
*         description: Video gallery record saved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-video-gallery-archive", auth, async (req, res) => {
  let connection;
  try {
    const requestJson = JSON.stringify(req.body);
    connection = await db.getConnection();

    const [result] = await connection.query(
      `CALL USP_POST_VIDEO_GALLERY_ACTIVITY(
          'ADD_UPDATE_VIDEO_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );`,
      [requestJson]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add/update video gallery"
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }

    }

    return res.status(200).json({
      status: "true",
      message: "Video gallery saved successfully",
      response
    });

  } catch (error) {

    console.error(
      "api-post-add-update-video-gallery-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }

}

);

/**
* @swagger
* /api/ourSchool/api-post-add-update-video-gallery-unarchive:
*   post:
*     summary: Add or Update Video Gallery
*     description: Adds a new video gallery record or updates an existing video gallery record.
*     tags:
*       - Video Gallery
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: array
*             items:
*               type: object
*               required:
*                 - ITEM
*                 - RECORD_SYS_ID
*                 - TITLE
*                 - SESSION_YEAR
*               properties:
*                 ITEM:
*                   type: string
*                   example: UNARCHIVE_VIDEO_GALLERY
*                   description: Operation item. Use ADD for adding and UPDATE for updating.
*                 RECORD_SYS_ID:
*                   type: integer
*                   example: 0
*                   description: Record system ID. Use 0 for a new record.
*                 TITLE:
*                   type: string
*                   example: Sample Title
*                 SESSION_YEAR:
*                   type: string
*                   example: 2023-2024
*     responses:
*       200:
*         description: Video gallery record saved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-video-gallery-unarchive", auth, async (req, res) => {
  let connection;
  try {
    const requestJson = JSON.stringify(req.body);
    connection = await db.getConnection();

    const [result] = await connection.query(
      `CALL USP_POST_VIDEO_GALLERY_ACTIVITY(
          'ADD_UPDATE_VIDEO_GALLERY',
          ?,
          @ERRNO,
          @ERRMSG
        );`,
      [requestJson]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add/update video gallery"
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }

    }

    return res.status(200).json({
      status: "true",
      message: "Video gallery saved successfully",
      response
    });

  } catch (error) {

    console.error(
      "api-post-add-update-video-gallery-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }

}

);


/**
* @swagger
* /api/ourSchool/api-get-view-archive-gallery-video:
*   get:
*     summary: View Archive Gallery Images
*     description: Retrieves archived gallery images for a specific session year.
*     tags:
*       - Video Gallery
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ARCHIVE_VIDEO_GALLERY
*         description: Item used to retrieve archive videos
*       - in: query
*         name: SESSION_YEAR
*         required: true
*         schema:
*           type: string
*           example: 2026-2027
*         description: Academic session year
*     responses:
*       200:
*         description: Archive videos retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-archive-gallery-video", async (req, res) => {

  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ARCHIVE_VIDEO_GALLERY";

    const sessionYear = req.query.SESSION_YEAR;

    if (!sessionYear) {
      return res.status(400).json({
        status: "false",
        message: "SESSION_YEAR is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_ARCHIVE_VIDEO_GALLERY_ACTIVITY(
          'VIEW_ARCHIVE_GALLERY_VIDEO_DETAILS',
          ?,
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item, sessionYear]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve archive gallery images",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-archive-gallery-video Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


// Notice Board APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-notice-board:
*   post:
*     summary: Add or Update Notice Board
*     description: Adds a new notice or updates an existing notice.
*     tags:
*       - Notice Board
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - data
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ADD
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Holiday Notice
*                     DESCRIPTION:
*                       type: string
*                       example: Notice regarding upcoming holiday.
*                     FILE_NAME:
*                       type: string
*                       example: holiday-notice.pdf
*                     DATE_OF_ISSUE:
*                       type: string
*                       format: date
*                       example: 2026-09-18
*                     DATE_OF_EXPIRY:
*                       type: string
*                       format: date
*                       example: 2026-09-30
*                     STATUS:
*                       type: string
*                       example: ACTIVE
*                     HIGHLIGHT_HOMEPAGE:
*                       type: string
*                       example: Y
*                     SESSION_YEAR:
*                       type: string
*                       example: 2026-27
*           example:
*             data:
*               - ITEM: ADD
*                 RECORD_SYS_ID: 0
*                 TITLE: Holiday Notice
*                 DESCRIPTION: Notice regarding upcoming holiday.
*                 FILE_NAME: holiday-notice.pdf
*                 DATE_OF_ISSUE: 2026-09-18
*                 DATE_OF_EXPIRY: 2026-09-30
*                 STATUS: ACTIVE
*                 HIGHLIGHT_HOMEPAGE: Y
*                 SESSION_YEAR: 2026-27
*     responses:
*       200:
*         description: Notice board details added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-notice-board", auth, async (req, res) => {

  let connection;

  try {
    const requestData = req.body.data;

    if (requestData === undefined || requestData === null) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    if (jsonData.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "At least one notice record is required",
      });
    }

    const jsonString = JSON.stringify(jsonData);
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_POST_NOTICE_BOARD_ACTIVITY(
          'ADD_UPDATE_NOTICE_BOARD',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update notice board details",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Notice board details added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-notice-board Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

// Archive Notice Board APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-notice-board-archive:
*   post:
*     summary: Add or Update Notice Board
*     description: Adds a new notice or updates an existing notice.
*     tags:
*       - Notice Board
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - data
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: ARCHIVE_NOTICE_BOARD
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Holiday Notice
*                     SESSION_YEAR:
*                       type: string
*                       example: 2026-27
*           example:
*             data:
*               - ITEM: ARCHIVE_NOTICE_BOARD
*                 RECORD_SYS_ID: 0
*                 TITLE: Holiday Notice
*                 SESSION_YEAR: 2026-27
*     responses:
*       200:
*         description: Notice board details added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-notice-board-archive", auth, async (req, res) => {
  let connection;
  try {
    const requestData = req.body.data;

    if (requestData === undefined || requestData === null) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    if (jsonData.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "At least one notice record is required",
      });
    }

    const jsonString = JSON.stringify(jsonData);
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_POST_NOTICE_BOARD_ACTIVITY(
          'ADD_UPDATE_NOTICE_BOARD',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update archive notice board details",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Notice board archive details added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-notice-board-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);

/**
* @swagger
* /api/ourSchool/api-post-add-update-notice-board-unarchive:
*   post:
*     summary: Add or Update Notice Board
*     description: Adds a new notice or updates an existing notice.
*     tags:
*       - Notice Board
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - data
*             properties:
*               data:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     ITEM:
*                       type: string
*                       example: UNARCHIVE_NOTICE_BOARD
*                     RECORD_SYS_ID:
*                       type: integer
*                       example: 0
*                     TITLE:
*                       type: string
*                       example: Holiday Notice
*                     SESSION_YEAR:
*                       type: string
*                       example: 2026-27
*           example:
*             data:
*               - ITEM: UNARCHIVE_NOTICE_BOARD
*                 RECORD_SYS_ID: 0
*                 TITLE: Holiday Notice
*                 SESSION_YEAR: 2026-27
*     responses:
*       200:
*         description: Notice board details added or updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-add-update-notice-board-unarchive", auth, async (req, res) => {
  let connection;

  try {
    const requestData = req.body.data;

    if (requestData === undefined || requestData === null) {
      return res.status(400).json({
        status: "false",
        message: "Request data is required",
      });
    }

    let jsonData;

    if (typeof requestData === "string") {
      try {
        jsonData = JSON.parse(requestData);
      } catch (error) {
        return res.status(400).json({
          status: "false",
          message: "Invalid JSON data",
        });
      }
    } else {
      jsonData = requestData;
    }

    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }

    if (jsonData.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "At least one notice record is required",
      });
    }

    const jsonString = JSON.stringify(jsonData);
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_POST_NOTICE_BOARD_ACTIVITY(
          'ADD_UPDATE_NOTICE_BOARD',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [jsonString]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add or update archive notice board details",
      });
    }

    return res.status(200).json({
      status: "true",
      message:
        errmsg ||
        "Notice board archive details added or updated successfully",
      response: result,
    });

  } catch (error) {
    console.error(
      "api-post-add-update-notice-board-unarchive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-archive-notice-board:
*   get:
*     summary: View Archive Notice Board
*     description: Retrieves archived notice board details for a specific session year.
*     tags:
*       - Notice Board
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*       - in: query
*         name: SESSION_YEAR
*         required: true
*         schema:
*           type: string
*           example: 2026-27
*         description: Academic session year
*     responses:
*       200:
*         description: Archive notice board details retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-archive-notice-board", auth, async (req, res) => {

  let connection;

  try {
    const item = "VIEW_ARCHIVE_NOTICE_BOARD";
    const sessionYear = req.query.SESSION_YEAR;

    if (!sessionYear) {
      return res.status(400).json({
        status: "false",
        message: "SESSION_YEAR is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_ARCHIVE_NOTICE_BOARD_ACTIVITY(
          'VIEW_ARCHIVE_NOTICE_BOARD_DETAILS',
          ?,
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item, sessionYear]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve archive notice board details",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });
  } catch (error) {
    console.error(
      "api-get-view-archive-notice-board Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-notice-board:
*   get:
*     summary: View Notice Board
*     description: Retrieves active or available notice board details.
*     tags:
*       - Notice Board
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve
*     responses:
*       200:
*         description: Notice board details retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-notice-board", async (req, res) => {

  let connection;

  try {
    // The stored procedure has no VIEW_ALL; the pages send it, so map it.
    const item = !req.query.ITEM || req.query.ITEM === "VIEW_ALL" ? "VIEW_NOTICE_BOARD" : req.query.ITEM;
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_NOTICE_BOARD_ACTIVITY(
          'VIEW_NOTICE_BOARD_DETAILS',
          ?,
          @ERRNO,
          @ERRMSG
        );
        `,
      [item]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve notice board details",
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response,
    });

  } catch (error) {
    console.error(
      "api-get-view-notice-board Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message,
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


// User APIs

/**
* @swagger
* /api/ourSchool/api-post-add-update-user:
*   post:
*     summary: Add or update user
*     tags:
*       - User
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               USER_TYPE:
*                 type: string
*                 example: Internal
*               ORGANISATION_SYS_ID:
*                 type: integer
*                 example: 1
*               SYSTEM_ROLE_SYS_ID:
*                 type: integer
*                 example: 3
*               CENTER:
*                 type: string
*                 example: Kolkata
*               GENDER:
*                 type: string
*                 example: Male
*               MOBILE_NO:
*                 type: string
*                 example: "2369874568"
*               PASSWORD:
*                 type: string
*                 example: "12345"
*               ITEM:
*                 type: string
*                 example: ADD_USER
*               CREATED_BY:
*                 type: integer
*                 example: 1
*               USER_NAME:
*                 type: string
*                 example: "2369874568"
*               NAME:
*                 type: string
*                 example: Demo1
*               LAST_NAME:
*                 type: string
*                 example: Check
*               USER_SYS_ID:
*                 type: integer
*                 example: 0
*     responses:
*       200:
*         description: User added/updated successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post('/api-post-add-update-user', auth, async (req, res) => {
  let conn;

  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    const [rows] = await conn.execute(
      `CALL USP_POST_USER_PROFILE_ACTIVITY(
        'ADD_UPDATE_USER',
        ?,
        @ERRNO,
        @ERRMSG
      )`,
      [requestJson]
    );

    const [[output]] = await conn.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    if (output.ERRNO !== 0) {
      return res.status(400).json({
        success: false,
        message: output.ERRMSG || 'Unable to add/update user',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: output.ERRMSG || 'User added/updated successfully',
      data: rows
    });

  } catch (error) {
    console.error('api-post-add-update-user Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
});


/**
* @swagger
* /api/ourSchool/api-get-view-user-profile-info:
*   get:
*     summary: Get user profile information
*     tags:
*       - User
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: true
*         schema:
*           type: string
*           example: SPECIFIC
*       - in: query
*         name: USER_SYS_ID
*         required: true
*         schema:
*           type: integer
*           example: 1
*     responses:
*       200:
*         description: User profile information fetched successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/


router.get('/api-get-view-user-profile-info', auth, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { ITEM = 'SPECIFIC', USER_SYS_ID } = req.query;

    if (!USER_SYS_ID) {
      return res.status(400).json({
        success: false,
        message: 'USER_SYS_ID is required',
        data: null
      });
    }

    const [rows] = await conn.execute(
      `CALL USP_GET_USER_PROFILE_INFO_ACTIVITY(
        'VIEW_USER_INFO',
        ?,
        ?,
        @ERRNO,
        @ERRMSG
      )`,
      [
        ITEM,
        Number(USER_SYS_ID)
      ]
    );

    const [[output]] = await conn.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    if (output.ERRNO !== 0) {
      return res.status(400).json({
        success: false,
        message: output.ERRMSG || 'Unable to fetch user profile information',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: output.ERRMSG || 'User profile information fetched successfully',
      data: rows[0] || []
    });

  } catch (error) {
    console.error('api-get-view-user-profile-info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
});


// EVENT APIs

/**
* @swagger
* /api/ourSchool/api-get-view-event-archive:
*   get:
*     summary: View Event Archive
*     description: Retrieves event archive details based on item, event ID and start date.
*     tags:
*       - Event
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: false
*         schema:
*           type: string
*           example: VIEW_ALL
*         description: Item to retrieve. Defaults to VIEW_ALL.
*       - in: query
*         name: EventId
*         required: false
*         schema:
*           type: integer
*           example: 1
*         description: Event ID. Defaults to 0.
*       - in: query
*         name: START_DATE
*         required: false
*         schema:
*           type: string
*           example: 19/08/2026
*         description: Event archive start date in DD/MM/YYYY format.
*     responses:
*       200:
*         description: Event archive details retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-event-archive", auth, async (req, res) => {
  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ALL";
    const eventId = req.query.EventId || 0;
    const startDate = req.query.START_DATE || "";

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_VIEW_EVENT_ARCHIVE_ACTIVITY(
        'VIEW_EVENT_ARCHIVE',
        ?,
        ?,
        ?,
        @ERRNO,
        @ERRMSG
      );`,

      [
        item,
        eventId,
        startDate
      ]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {

      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve event archive details"
      });

    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }

      }

    }

    return res.status(200).json({ status: "true", response });

  } catch (error) {

    console.error(
      "api-get-view-event-archive Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


/**
* @swagger
* /api/ourSchool/api-post-event-archive-activity:
*   post:
*     summary: Add or Update Event Archive
*     description: Adds or updates event archive records.
*     tags:
*       - Event
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: array
*             items:
*               type: object
*               required:
*                 - ITEM
*                 - ID
*               properties:
*                 ITEM:
*                   type: string
*                   example: ADD
*                   description: Operation item.
*                 ID:
*                   type: integer
*                   example: 101
*                   description: Event archive ID.
*     responses:
*       200:
*         description: Event archive saved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.post("/api-post-event-archive-activity", auth, async (req, res) => {
  let connection;

  try {
    const requestJson = JSON.stringify(req.body);
    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_POST_EVENT_ARCHIVE_ACTIVITY(
          'ADD_UPDATE_EVENT_ARCHIVE',
          ?,
          @ERRNO,
          @ERRMSG
        );`,
      [requestJson]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to add/update event archive"
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      message: "Event archive saved successfully",
      response
    });

  } catch (error) {
    console.error(
      "api-post-event-archive-activity Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}
);


/**
* @swagger
* /api/ourSchool/api-get-view-event-achievment:
*   get:
*     summary: View Event Achievement
*     description: Retrieves event achievement details based on item, event ID and event title.
*     tags:
*       - Event
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         required: false
*         schema:
*           type: string
*           example: SPECIFIC
*         description: Item to retrieve. Defaults to VIEW_ALL.
*       - in: query
*         name: EventId
*         required: false
*         schema:
*           type: integer
*           example: 3
*         description: Event ID. Defaults to 0.
*       - in: query
*         name: EVENT_TITLE
*         required: false
*         schema:
*           type: string
*           example: Annual Sports Day
*         description: Event title.
*     responses:
*       200:
*         description: Event achievement details retrieved successfully
*       400:
*         description: Bad request
*       401:
*         description: Unauthorized
*       500:
*         description: Internal server error
*/

router.get("/api-get-view-event-achievment", auth, async (req, res) => {
  let connection;

  try {
    const item = req.query.ITEM || "VIEW_ALL";
    const eventId = req.query.EventId || 0;
    const eventTitle = req.query.EVENT_TITLE || "";

    connection = await db.getConnection();

    const [result] = await connection.query(`CALL USP_GET_EVENT_ACHIEVMENT_ACTIVITY(
        'VIEW_EVENT_ACHIEVMENT',
        ?,
        ?,
        ?,
        @ERRNO,
        @ERRMSG
      );`,

      [
        item,
        eventId,
        eventTitle
      ]
    );

    const [errorResult] = await connection.query(
      `SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG`
    );

    const errno = errorResult[0]?.ERRNO;
    const errmsg = errorResult[0]?.ERRMSG;

    if (errno && Number(errno) !== 0) {
      return res.status(400).json({
        status: "false",
        message:
          errmsg ||
          "Failed to retrieve event achievement details"
      });
    }

    let response = [];

    if (Array.isArray(result)) {
      for (const resultSet of result) {
        if (Array.isArray(resultSet) && resultSet.length > 0) {
          response = resultSet;
          break;
        }
      }
    }

    return res.status(200).json({
      status: "true",
      response
    });

  } catch (error) {
    console.error(
      "api-get-view-event-achievment Error:",
      error
    );

    return res.status(500).json({
      status: "false",
      message: "Internal server error",
      error: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});



module.exports = router;