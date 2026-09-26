const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* ═══════════════════════════════════════════════════════════════
   ██  USER MANAGEMENT
   SP: USP_POST_USER_PROFILE_ACTIVITY  /  USP_GET_USER_PROFILE_INFO_ACTIVITY
═══════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * /api/master/api-post-add-update-user:
 *   post:
 *     tags:
 *       - User Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Success Response
 */
router.post('/api-post-add-update-user', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    const [rows] = await conn.execute(
      'CALL USP_POST_USER_PROFILE_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_USER', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      return res.json(rows[0][0].JSON_VALUE);
    }
    return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET all users
   CALL USP_GET_USER_PROFILE_INFO_ACTIVITY('VIEW_USER_INFO','ALL',0,@ERRNO,@ERRMSG)
───────────────────────────────────────────────────────────────*/
/**
 * @swagger
 * /api/master/api-get-view-user-profile-info:
 *   get:
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *         required: false
 *         example: VIEW_ALL
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: string
 *         required: false
 *         example: 0
 *     responses:
 *       200:
 *         description: JSON response from stored procedure
 */
router.get('/api-get-view-user-profile-info',  async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { ITEM, RECORD_SYS_ID } = req.query;
    const [rows] = await conn.execute(
      "CALL USP_GET_USER_PROFILE_INFO_ACTIVITY(?, ?, ?, @ERRNO, @ERRMSG);",
      ['VIEW_USER_INFO', ITEM, RECORD_SYS_ID]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong'});
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
    finally {
    if (conn) conn.release();
  }
});



/* ═══════════════════════════════════════════════════════════════
   ██  ROLE (SYSTEM ROLE) MANAGEMENT
   SP: USP_POST_ALL_MASTER_DATA  /  USP_GET_ALL_MASTER_DATA
═══════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * /api/master/api-post-add-update-master-system-role:
 *   post:
 *     tags:
 *       - Role Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Success Response
 */
router.post('/api-post-add-update-master-system-role', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    console.log("requestJson", requestJson)
    const [rows] = await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_MASTER_SYSTEM_ROLE', requestJson]
    );
    const [[err]]= await conn.execute(
      'SELECT @ERRNO AS ERRNO,@ERRMSG AS ERRMSG'
    )
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(typeof result ==="string" ? JSON.parse(result) : result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET all system roles
   CALL USP_GET_ALL_MASTER_DATA('VIEW_MASTER_SYSTEM_ROLE','VIEW_ALL','0',@ERRNO,@ERRMSG)
───────────────────────────────────────────────────────────────*/

/**
 * @swagger
 * /api/master/api-get-view-master-system-role:
 *   get:
 *     tags:
 *       - Role Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *         required: false
 *         example: VIEW_ALL
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: string
 *         required: false
 *         example: 0
 *     responses:
 *       200:
 *         description: JSON response from stored procedure
 */
router.get('/api-get-view-master-system-role', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { ITEM, RECORD_SYS_ID } = req.query;
    const [rows] = await conn.execute(
      "CALL USP_GET_ALL_MASTER_DATA(?, ?, ?, @ERRNO, @ERRMSG);",
      ['VIEW_MASTER_SYSTEM_ROLE', ITEM, RECORD_SYS_ID]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong'});
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
    finally {
    if (conn) conn.release();
  }
});

/* ═══════════════════════════════════════════════════════════════
   ██  LOCATION MANAGEMENT
   SP: USP_POST_ALL_MASTER_DATA  /  USP_GET_ALL_MASTER_DATA
═══════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * /api/master/api-post-add-update-location:
 *   post:
 *     tags:
 *       - Location Management
 *     summary: Add, Update, or Delete a Location
 *     description: |
 *       Uses stored procedure `USP_POST_ALL_MASTER_DATA` with operation `ADD_UPDATE_LOCATION`.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ITEM
 *               - RECORD_SYS_ID
 *               - LOCATION_NAME
 *               - CREATED_BY
 *             properties:
 *               ITEM:
 *                 type: string
 *                 enum: [ADD, UPDATE, DELETE]
 *                 example: ADD
 *               RECORD_SYS_ID:
 *                 type: string
 *                 example: "0"
 *               LOCATION_NAME:
 *                 type: string
 *                 example: KOL
 *               CREATED_BY:
 *                 type: string
 *                 example: "2"
 */
router.post('/api-post-add-update-location', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    // ✅ SAME PATTERN as others
    const requestJson = JSON.stringify(req.body);

    await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_LOCATION', requestJson]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        ERRNO: meta.ERRNO,
        ERRMSG: meta.ERRMSG
      });
    }

    return res.json({
      ERRNO: 0,
      ERRMSG: 'Success'
    });

  } catch (error) {
    return res.status(500).json({
      ERRNO: -1,
      ERRMSG: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET all locations
   CALL USP_GET_ALL_MASTER_DATA('VIEW_LOCATION','VIEW_ALL','0',@ERRNO,@ERRMSG)
───────────────────────────────────────────────────────────────*/
/**
 * @swagger
 * /api/master/api-get-view-master-location:
 *   get:
 *     tags:
 *       - Location Management
 *     summary: Get all locations
 *     description: Fetch all locations or a specific one by RECORD_SYS_ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *         description: Fetch type (VIEW_ALL / SPECIFIC)
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: string
 *           example: "0"
 *         required: false
 *         description: Record ID (0 for all records)
 *     responses:
 *       200:
 *         description: List of all locations
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-master-location', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const ITEM          = req.query.ITEM          || 'VIEW_ALL';
    const RECORD_SYS_ID = parseInt(req.query.RECORD_SYS_ID) || 0;  // ✅ INT not string

    const [rows] = await conn.execute(
      "CALL USP_GET_ALL_MASTER_DATA(?, ?, ?, @ERRNO, @ERRMSG);",
      ['VIEW_LOCATION', ITEM, RECORD_SYS_ID]
    );

    const [[meta]] = await conn.execute('SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;');
    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({ status: 'false', response: meta.ERRMSG });
    }

    return res.json(rows[0] || []);

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

//Departmet + Doctor
//Add Department & Doctor
router.post('/api-post-add-update-master-doctor', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    const [rows] = await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_DOCTOR', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

//Get Department & Doctor
router.get('/api-get-view-master-doctor', async (req, res) => {

  let conn;

  try {

    conn = await db.getConnection();
 
    const [rows] = await conn.execute(

      "CALL USP_GET_ALL_MASTER_DATA('VIEW_DOCTOR', 'VIEW_ALL', '0', @ERRNO, @ERRMSG);"

    );
 
    const [[meta]] = await conn.execute(

      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'

    );
 
    if (meta.ERRNO !== 0) {

      return res.status(400).json({

        status: 'false',

        response: meta.ERRMSG

      });

    }
 
    return res.json(rows[0] || []);
 
  } catch (error) {

    res.status(500).json({

      error: error.message

    });

  } finally {

    if (conn) conn.release();

  }

});

/**
 * @swagger
 * /api/master/api-post-add-update-master-bed-type:
 *   post:
 *     tags:
 *       - Bed Type Management
 *     summary: Add or Update a Bed Type
 *     description: Set ITEM = "ADD" to create a new bed type, "UPDATE" to modify, "DELETE" to remove.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ITEM:
 *                 type: string
 *                 example: ADD
 *               BED_TYPE_SYS_ID:
 *                 type: string
 *                 example: "0"
 *               BED_TYPE:
 *                 type: string
 *                 example: ICU-A
 *               BED_NUMBER:
 *                 type: string
 *                 example: ICU-A
 *               WARD:
 *                 type: string
 *                 example: ICU-A
 *               PHASE_NO:
 *                 type: string
 *                 example: Phase-1
 *               FLOOR_NO:
 *                 type: string
 *                 example: Floor-2
 *               LOCATION:
 *                 type: string
 *                 example: ICU Ward
 *               DESCRIPTION:
 *                 type: string
 *                 example: Intensive Care Unit Type A
 *               CREATED_BY:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Bed type saved successfully
 *       500:
 *         description: Internal server error
 */
router.post('/api-post-add-update-master-bed-type', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    const [rows] = await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_MASTER_BED_TYPE', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/master/api-get-view-master-bed-type:
 *   get:
 *     tags:
 *       - Bed Type Management
 *     summary: Get Bed Type Master Data
 *     description: Fetch all bed types or a specific one by RECORD_SYS_ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *         description: Fetch type (VIEW_ALL / SPECIFIC)
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: string
 *           example: "0"
 *         required: false
 *         description: Record ID (0 for all records)
 *     responses:
 *       200:
 *         description: Bed type data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bed type data fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-master-bed-type', async (req, res) => {
  let conn;
  try {
    const ITEM          = req.query.ITEM          || 'VIEW_ALL';
    const RECORD_SYS_ID = req.query.RECORD_SYS_ID || '0';

    conn = await db.getConnection();
    const [rows] = await conn.execute(
      'CALL USP_GET_ALL_MASTER_DATA(?, ?, ?, @ERRNO, @ERRMSG);',
      ['VIEW_MASTER_BED_TYPE', ITEM, RECORD_SYS_ID]
    );

    const [[outParams]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (outParams.ERRNO && outParams.ERRNO !== 0) {
      return res.status(400).json({
        success: false,
        message: outParams.ERRMSG || 'Stored procedure error',
        errno:   outParams.ERRNO
      });
    }

    const result = rows?.[0]?.[0]?.JSON_VALUE;

    if (!result) {
      return res.json({ success: false, message: 'No data found', data: [] });
    }

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const data   = parsed?.response;

    if (
      parsed?.status !== 'true' ||
      !data ||
      data === 'Wrong Input Given' ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({ success: false, message: 'No data found', data: [] });
    }

    return res.json({
      success: true,
      message: 'Bed type data fetched successfully',
      data
    });

  } catch (error) {
    console.error('Bed Type GET Error:', error);
    return res.status(500).json({ success: false, message: '500 internal server error' });
  } finally {
    if (conn) conn.release();
  }
});
 
/* ═══════════════════════════════════════════════════════════════
   ██  OT NAME MANAGEMENT
   SP: USP_POST_ALL_MASTER_DATA  /  USP_GET_ALL_MASTER_DATA
═══════════════════════════════════════════════════════════════ */

/**
 * @swagger
 * /api/master/api-post-add-update-ot-name:
 *   post:
 *     tags:
 *       - OT Name Management
 *     summary: Add or Update an OT Name
 *     description: |
 *       Set ITEM = "ADD" to create a new OT name, "UPDATE" to modify, "DELETE" to remove.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ITEM:
 *                 type: string
 *                 example: ADD
 *               OT_NAME_SYS_ID:
 *                 type: string
 *                 example: "0"
 *               OT_NAME:
 *                 type: string
 *                 example: OT 1
 *               DESCRIPTION:
 *                 type: string
 *                 example: GENERAL OT
 *               CREATED_BY:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: OT name saved successfully
 *       500:
 *         description: Internal server error
 */
router.post('/api-post-add-update-ot-name', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    console.log("requestJson", requestJson);

    const [rows] = await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_OT_NAME', requestJson]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        status: 'false',
        response: meta.ERRMSG || 'Stored procedure error'
      });
    }

    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(typeof result === 'string' ? JSON.parse(result) : result);
    }

    return res.json({ status: 'true', response: 'OT saved successfully' });

  } catch (error) {
    console.error('OT POST Error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});
router.post('/api-post-add-update-patient-ot-details', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    const [rows] = await conn.execute(
      'CALL USP_POST_PATIENT_OT_DETAILS(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_GENERAL_OT', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(typeof result === 'string' ? JSON.parse(result) : result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/master/api-get-view-master-ot-name:
 *   get:
 *     tags:
 *       - OT Name Management
 *     summary: Get OT Name Master Data
 *     description: Fetch all OT names or a specific one by RECORD_SYS_ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *         description: Fetch type (VIEW_ALL / SPECIFIC)
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: string
 *           example: "0"
 *         required: false
 *         description: Record ID (0 for all records)
 *     responses:
 *       200:
 *         description: OT name data fetched successfully
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-master-ot-name', async (req, res) => {
  let conn;
  try {
    const ITEM = req.query.ITEM || 'VIEW_ALL';
    const RECORD_SYS_ID = parseInt(req.query.RECORD_SYS_ID) || 0;

    conn = await db.getConnection();
    const [rows] = await conn.execute(
      'CALL USP_GET_ALL_MASTER_DATA(?, ?, ?, @ERRNO, @ERRMSG);',
      ['VIEW_MASTER_OT_NAME', ITEM, RECORD_SYS_ID]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({ status: 'false', response: meta.ERRMSG });
    }

    return res.json(rows[0] || []);

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/** 
 * @swagger 
 * /api/master/api-get-view-master-bed-search: 
 *   get: 
 *     tags: 
 *       - Bed Management 
 *     summary: Search Beds by Range 
 *     description: Fetch beds between FROM_BED and TO_BED using stored procedure. 
 *     security: 
 *       - bearerAuth: [] 
 *     parameters: 
 *       - in: query 
 *         name: ITEM 
 *         schema: 
 *           type: string 
 *           example: VIEW_ALL 
 *       - in: query 
 *         name: FROM_BED 
 *         schema: 
 *           type: string 
 *           example: "A101"
 *       - in: query 
 *         name: TO_BED 
 *         schema: 
 *           type: string 
 *           example: "B205"
 *     responses: 
 *       200: 
 *         description: Bed search data fetched successfully 
 *       400: 
 *         description: Stored procedure error 
 *       500: 
 *         description: Internal server error 
 */ 
router.get('/api-get-view-master-bed-search', async (req, res) => { 
  let conn; 
  try { 
    const ITEM     = req.query.ITEM || 'VIEW_ALL'; 
    const FROM_BED = req.query.FROM_BED || ''; 
    const TO_BED   = req.query.TO_BED   || ''; 
 
    conn = await db.getConnection(); 
 
    const [rows] = await conn.execute( 
      'CALL USP_GET_BED_MASTER_SEARCH(?, ?, ?, ?, @ERRNO, @ERRMSG);', 
      ['VIEW_MASTER_BED_SEARCH', ITEM, FROM_BED, TO_BED] 
    ); 
 
    const [[meta]] = await conn.execute( 
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;' 
    ); 
 
    // Handle SP error 
    if (meta.ERRNO !== 0 && meta.ERRNO !== null) { 
      return res.status(400).json({ 
        success: false, 
        message: meta.ERRMSG 
      }); 
    } 
 
    return res.json({ 
      success: true, 
      data: rows[0] || [] 
    }); 
 
  } catch (error) { 
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    }); 
  } finally { 
    if (conn) conn.release(); 
  } 
});

/**
 * @swagger
 * /api/master/api-post-add-update-master-station-mapping:
 *   post:
 *     tags:
 *       - Station Mapping Management
 *     summary: Add or Update Station Mapping (Ward Master)
 *     description: |
 *       Uses stored procedure `USP_POST_ALL_MASTER_DATA` with operation `ADD_UPDATE_MASTER_STATION`.
 *
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
 *                 - STATION_SYS_ID
 *                 - STATION_NAME
 *                 - BED_NUMBER
 *                 - WARD
 *                 - BED_TYPE
 *                 - PHASE_NO
 *                 - FLOOR_NO
 *                 - LOCATION
 *                 - CREATED_BY
 *               properties:
 *                 ITEM:
 *                   type: string
 *                   enum: [ADD, UPDATE, DELETE]
 *                   example: ADD
 *                 STATION_SYS_ID:
 *                   type: string
 *                   example: "0"
 *                 STATION_NAME:
 *                   type: string
 *                   example: ICU
 *                 BED_NUMBER:
 *                   type: string
 *                   example: B-101
 *                 WARD:
 *                   type: string
 *                   example: General Ward
 *                 BED_TYPE:
 *                   type: string
 *                   example: BGF
 *                 PHASE_NO:
 *                   type: string
 *                   example: P1
 *                 FLOOR_NO:
 *                   type: string
 *                   example: "1"
 *                 LOCATION:
 *                   type: string
 *                   example: Block A
 *                 DESCRIPTION:
 *                   type: string
 *                   example: ICU Bed
 *                 CREATED_BY:
 *                   type: string
 *                   example: "1"
 *
 *     responses:
 *       200:
 *         description: Station mapping saved successfully
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.post('/api-post-add-update-master-station-mapping', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);

    const [rows] = await conn.execute(
      'CALL USP_POST_ALL_MASTER_DATA(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_UPDATE_MASTER_STATION', requestJson]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({ success: false, message: meta.ERRMSG });
    }

    // ✅ Check rows for SP-level business errors
    if (rows?.[0]?.[0]?.JSON_VALUE) {
      const result = rows[0][0].JSON_VALUE;
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;

      if (parsed.status === 'false' || parsed.status === false) {
        return res.status(400).json({
          success: false,
          message: parsed.response || 'Operation failed'
        });
      }
    }

    return res.json({ success: true, message: 'Station mapping saved successfully' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/master/api-get-view-master-ot-station-mapping:
 *   get:
 *     tags:
 *       - OT Station Mapping Management
 *     summary: Get OT Station Mapping Data
 *     description: Fetch all OT station mappings or a specific one by STATION.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *       - in: query
 *         name: STATION
 *         schema:
 *           type: string
 *           example: "0"
 *         required: false
 *     responses:
 *       200:
 *         description: OT station mapping data fetched successfully
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-master-ot-station-mapping', async (req, res) => {
  let conn;
  try {
    const ITEM    = req.query.ITEM    || 'VIEW_ALL';
    const STATION = req.query.STATION || '0';

    conn = await db.getConnection();

    const [rows] = await conn.execute(
      'CALL USP_GET_MASTER_OT_STATION_MAPPING(?, ?, ?, @ERRNO, @ERRMSG);',
      ['VIEW_MASTER_STATION_MAPPING', ITEM, STATION]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        success: false,
        message: meta.ERRMSG
      });
    }

    return res.json({
      success: true,
      data: rows[0] || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});


/**
 * @swagger
 * /api/master/api-post-add-user-station-mapping:
*   post:
 *     tags:
 *       - User Station Mapping Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Success Response
 */

router.post('/api-post-add-user-station-mapping', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);

    const [rows] = await conn.execute(
      'CALL USP_POST_USER_STATION_MAPPING(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_USER_MAPPING', requestJson]
    );

    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({ success: false, message: meta.ERRMSG });
    }

    // ✅ Check rows for SP-level business errors
    if (rows?.[0]?.[0]?.JSON_VALUE) {
      const result = rows[0][0].JSON_VALUE;
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;

      if (parsed.status === 'false' || parsed.status === false) {
        return res.status(400).json({
          success: false,
          message: parsed.response || 'Operation failed'
        });
      }
    }

    return res.json({ success: true, message: 'Station mapping saved successfully' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/master/api-get-view-user-station-mapping:
 *   get:
 *     tags:
 *       - User Station Mapping Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *       - in: query
 *         name: LOCATION_SYS_ID
 *         schema:
 *           type: string
 *           example: 0
 *         required: false
 *     responses:
 *       200:
 *         description: Station mapping data fetched successfully
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-user-station-mapping', async (req, res) => {
  let conn;

  try {
    const LOCATION_SYS_ID = req.query.LOCATION_SYS_ID || '0';

    conn = await db.getConnection();

    const [rows] = await conn.execute(
      'CALL USP_GET_USER_STATION_MAPPING(?, ?, ?, @ERRNO, @ERRMSG);',
      ['VIEW_USER_STATION_MAPPING', "VIEW_ALL", LOCATION_SYS_ID]
    );

    // Get output params
    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );

    // Handle SP error
    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        success: false,
        message: meta.ERRMSG
      });
    }

    const result = rows[0][0].JSON_VALUE;
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/master/api-user-wise-station-module-mapping-details:
 *   get:
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *         required: false
 *         example: VIEW_ALL
 *       - in: query
 *         name: USER_SYS_ID
 *         schema:
 *           type: string
 *         required: false
 *         example: 0
 *     responses:
 *       200:
 *         description: JSON response from stored procedure
 */
router.get('/api-user-wise-station-module-mapping-details',  async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { ITEM, USER_SYS_ID } = req.query;
    const [rows] = await conn.execute(
      "CALL USP_USER_WISE_STATION(?, ?, ?, @ERRNO, @ERRMSG);",
      ['VIEW_USER_WISE_STATION', ITEM, USER_SYS_ID]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong'});
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
* /api/master/api-post-add-ot-station-mapping:
*   post:
*     tags:
*       - OT Station Mapping Management
*     summary: Add or Update OT Station Mapping
*     description: |
*       Uses stored procedure `USP_POST_OT_STATION_MAPPING` with operation `ADD_OT_MAPPING`.
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: array
*             items:
*               type: object
*               properties:
*                 ITEM:
*                   type: string
*                   enum: [ADD, UPDATE, DELETE]
*                   example: ADD
*                 STATION_SYS_ID:
*                   type: integer
*                   example: 0
*                 STATION_NAME:
*                   type: string
*                   example: GENERAL
*                 OT_NO:
*                   type: string
*                   example: OT 1
*                 WARD:
*                   type: string
*                   example: GENERAL
*                 OT_TYPE:
*                   type: string
*                   example: General Ward Bed Type
*                 PHASE_NO:
*                   type: string
*                   example: PHASE 1
*                 FLOOR_NO:
*                   type: string
*                   example: FLOOR 5
*                 LOCATION:
*                   type: string
*                   example: KOLKATA
*                 DESCRIPTION:
*                   type: string
*                   example: FEMALE GENERAL BED
*                 CREATED_BY:
*                   type: integer
*                   example: 1
*     responses:
*       200:
*         description: OT station mapping saved successfully
*       400:
*         description: Stored procedure error
*       500:
*         description: Internal server error
*/
router.post('/api-post-add-ot-station-mapping', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body);
    console.log('OT Station Mapping requestJson:', requestJson);
 
    const [rows] = await conn.execute(
      'CALL USP_POST_OT_STATION_MAPPING(?, ?, @ERRNO, @ERRMSG);',
      ['ADD_OT_MAPPING', requestJson]
    );
 
    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );
 
    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        success: false,
        message: meta.ERRMSG || 'Stored procedure error'
      });
    }
 
    if (rows?.[0]?.[0]?.JSON_VALUE) {
      const result = rows[0][0].JSON_VALUE;
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
 
      if (parsed.status === 'false' || parsed.status === false) {
        return res.status(400).json({
          success: false,
          message: parsed.response || 'Operation failed'
        });
      }
 
      return res.json({
        success: true,
        message: 'OT station mapping saved successfully',
        data: parsed
      });
    }
 
    return res.json({
      success: true,
      message: 'OT station mapping saved successfully'
    });
 
  } catch (error) {
    console.error('OT Station Mapping POST Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});
 
/**
* @swagger
* /api/master/api-get-view-master-station-mapping:
*   get:
*     tags:
*       - Station Mapping Management
*     summary: Get Master Station Mapping Data
*     description: Fetch all station mappings or a specific one by STATION_SYS_ID.
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: ITEM
*         schema:
*           type: string
*           example: VIEW_ALL
*         required: false
*         description: Fetch type (VIEW_ALL / SPECIFIC)
*       - in: query
*         name: STATION_SYS_ID
*         schema:
*           type: string
*           example: "0"
*         required: false
*         description: Station System ID (0 for all records)
*     responses:
*       200:
*         description: Station mapping data fetched successfully
*       400:
*         description: Stored procedure error
*       500:
*         description: Internal server error
*/
router.get('/api-get-view-master-station-mapping', async (req, res) => {
  let conn;
  try {
    const ITEM           = req.query.ITEM           || 'VIEW_ALL';
    const STATION_SYS_ID = req.query.STATION_SYS_ID || '0';
 
    conn = await db.getConnection();
 
    const [rows] = await conn.execute(
      'CALL USP_GET_MASTER_STATION_MAPPING(?, ?, ?, @ERRNO, @ERRMSG);',
      ['VIEW_MASTER_STATION_MAPPING', ITEM, STATION_SYS_ID]
    );
 
    const [[meta]] = await conn.execute(
      'SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG;'
    );
 
    if (meta.ERRNO !== 0 && meta.ERRNO !== null) {
      return res.status(400).json({
        success: false,
        message: meta.ERRMSG
      });
    }
 
    return res.json({
      success: true,
      data: rows[0] || []
    });
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/* ═══════════════════════════════════════════════════════════════
   ██  PATIENT MANAGEMENT
   SP: USP_POST_PATIENT_DELETE_ACTIVITY  /  USP_GET_PATIENT_SEARCH_FOR_DELETE
═══════════════════════════════════════════════════════════════ */

// Get Patients to Delete

/**

* @swagger

* /api/master/api-get-patient-search-for-delete:

*   get:

*     tags:

*       - Patient Management

*     summary: Search Patient

*     description: Search patient(s) using a single search value. The API automatically identifies whether the search value is a Bed No, UHID, or Episode ID.

*     security:

*       - bearerAuth: []

*     parameters:

*       - in: query

*         name: OPERATION_NAME

*         required: true

*         schema:

*           type: string

*           example: VIEW_PATIENT

*         description: Operation Name

*       - in: query

*         name: ITEM

*         required: true

*         schema:

*           type: string

*           example: SPECIFIC

*         description: Item Type

*       - in: query

*         name: SEARCH_VALUE

*         required: true

*         schema:

*           type: string

*           example: "9003"

*         description: Enter a Bed No, UHID, or Episode ID.

*     responses:

*       200:

*         description: Patient details fetched successfully.

*         content:

*           application/json:

*             example:

*               status: true

*               data:

*                 - - JSON_VALUE:

*                       status: "true"

*                       response:

*                         - UHID: "1000300603"

*                           EPISODE_ID: "IPA4000791"

*                           CURRENT_BED: "9003"

*                           PATIENT_NAME: "MR. DEEP BED TEST"

*                           ADMISSION_DATE: "04-Apr-26"

*       400:

*         description: Missing required parameters.

*       500:

*         description: Internal server error.

*/
 

router.get("/api-get-patient-search-for-delete",async(req,res)=>{

  let conn;

  try{

    const {OPERATION_NAME,
      ITEM,
      SEARCH_VALUE
    } = req.query;

    if(!OPERATION_NAME || !ITEM ||!SEARCH_VALUE)
    {
      return res.status(400).json({status:false,message:"Operation Name,Item or Search value is required"});
    }
    // Parameter testing
    // let BED_NO = "";
    // let UHID = "";
    // let EPISODE_ID = "";
    // if(/^IPA/i.test(SEARCH_VALUE)){
    //   EPISODE_ID = SEARCH_VALUE;
    // }
    // else if(/^\d{10,}$/.test(SEARCH_VALUE)){
    //   UHID = SEARCH_VALUE;
    // }
    // else{
    //   BED_NO = SEARCH_VALUE;
    // }

    conn = await db.getConnection();

    const result = await conn.query(`CALL USP_GET_PATIENT_SEARCH_FOR_DELETE(?,?,?,@ERRNO,@ERRMSG)`,
      [OPERATION_NAME,ITEM,SEARCH_VALUE]
    );

    // const[[err]] = await conn.query(`SELECT @ERRNO AS ERRNO,@ERRMSG AS ERRMSG`);

    // if(err.ERRNO !== 0)
    // {
    //   return res.status(400).json({status:false,errno:err.ERRNO,message:err.ERRMSG});
    // }

    return res.status(200).json({status:true,data:result[0]});
  }
  catch(error)
  {
    console.error(error);

    return res.status(500).json({status:false,message:"Oops! something went wrong"});
  }
  finally{

    if(conn) conn.release();
  }
})
 
// Delete Patient

/**
* @swagger
* /api/master/api-post-patient-delete-activity:
*   post:
*     tags:
*       - Patient Management
*     summary: Delete Patient
*     description: Deletes a patient using Episode ID and UHID.
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - ITEM
*               - EPISODE_ID
*               - UHID
*             properties:
*               ITEM:
*                 type: string
*                 example: DELETE
*               EPISODE_ID:
*                 type: string
*                 example: IPA4000791
*               UHID:
*                 type: string
*                 example: "1000300603"
*     responses:
*       200:
*         description: Patient deleted successfully.
*       400:
*         description: Invalid request.
*       500:
*         description: Internal server error.
*/
 
router.post("/api-post-patient-delete-activity",async(req,res)=>{
  let conn;

  try
  {
    const {ITEM,EPISODE_ID,UHID} = req.body;

    if(!ITEM || !EPISODE_ID || !UHID){
      return res.status(400).json({status:false,message:"ITEM,Episode No or UHID is required"});
    }

    const jsonData = JSON.stringify({
      ITEM,
      EPISODE_ID,
      UHID
    });
    conn = await db.getConnection();

    await conn.query(`CALL USP_POST_PATIENT_DELETE_ACTIVITY(?,?,@ERRNO,@ERRMSG)`,
      [
        "PATIENT_DELETE_ACTIVITY",
        jsonData
      ]
    );

    return res.status(200).json({status:true,message:"Patient deleted successfully"});
  }
  catch(error)
  {
    console.error(error);
    return res.status(500).json({status:false,message:"Oops! something went wrong"});
  }
  finally{
    if(conn) conn.release;
  }
})
 

module.exports = router;