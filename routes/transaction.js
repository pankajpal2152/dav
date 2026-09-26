const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/transaction/api-post-add-update-emergency-ward-display

/**
 * @swagger
 * /api/transaction/api-post-add-update-emergency-ward-display:
 *   post:
 *     tags:
 *       - Emergency Ward
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
router.post('/api-post-add-update-emergency-ward-display', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const requestJson = JSON.stringify(req.body); 
    const [rows] = await conn.execute(
      "CALL USP_POST_EMERGENCY_WARD_DASHBOARD(?, ?, @ERRNO, @ERRMSG);",
      ['ADD_UPDATE_EMERGENCY_DISPLAY', requestJson]
    );
    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }
} catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
    finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/transaction/api-get-view-emergency-ward-display:
 *   get:
 *     tags:
 *       - Emergency Ward
 *     summary: Get Emergency Ward Dashboard Data
 *     description: Fetch emergency ward display data based on ITEM and DAY
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: SPECIFIC
 *         required: false
 *         description: request (e.g., SPECIFIC / ALL)
 *       - in: query
 *         name: DAY
 *         schema:
 *           type: string
 *           example: Monday
 *         required: false
 *         description: Day of the week
 *     responses:
 *       200:
 *         description: Successful response
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
 *                   example: Data fetched successfully
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/api-get-view-emergency-ward-display', async (req, res) => {
  let conn;

  try {
    const { ITEM, DAY } = req.query;
    if (!ITEM || !DAY) {
      return res.status(400).json({
        success: false,
        message: "ITEM and DAY are required"
      });
    }

    conn = await db.getConnection();
    const [rows] = await conn.query(
      "CALL USP_GET_EMERGENCY_WARD_DASHBOARD(?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_EMERGENCY_DISPLAY', ITEM, DAY]
    );
    const result = rows?.[0]?.[0]?.JSON_VALUE;

    if (!result) {
      return res.json({
        success: false,
        message: "No data found",
        data: []
      });
    }
    const parsed =
      typeof result === 'string' ? JSON.parse(result) : result;
    const data = parsed?.response;

    if (
      parsed?.status !== "true" ||
      data === "Wrong Input Given" ||
      !data ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({
        success: false,
        message: "No data found",
        data: []
      });
    }
    return res.json({
      success: true,
      message: "Data fetched successfully",
      data
    });

  } catch (error) {
    console.error("ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "500 internal server error"
    });

  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/transaction/api-get-view-master-doctor:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get Doctor Master Data
 *     description: Fetch all doctor master data using stored procedure USP_GET_ALL_MASTER_DATA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: false
 *         description: Type of fetch (VIEW_ALL / SPECIFIC)
 *       - in: query
 *         name: RECORD_SYS_ID
 *         schema:
 *           type: integer
 *           example: 0
 *         required: false
 *         description: Record ID (0 for all records)
 *     responses:
 *       200:
 *         description: Doctor data fetched successfully
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
 *                   example: Doctor data fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Stored procedure error
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-master-doctor', async (req, res) => {
  let conn;

  try {
    const ITEM          = req.query.ITEM || 'VIEW_ALL';
    const RECORD_SYS_ID = req.query.RECORD_SYS_ID || '0';

    conn = await db.getConnection();

    const [rows] = await conn.query(
      "CALL USP_GET_ALL_MASTER_DATA(?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_DOCTOR', ITEM, RECORD_SYS_ID]   
    );

    const [[outParams]] = await conn.query(
      "SELECT @ERRNO AS ERRNO, @ERRMSG AS ERRMSG"
    );

    // ❌ Stored procedure error
    if (outParams.ERRNO && outParams.ERRNO !== 0) {
      return res.status(400).json({
        success: false,
        message: outParams.ERRMSG || 'Stored procedure error',
        errno: outParams.ERRNO
      });
    }

    const result = rows?.[0]?.[0]?.JSON_VALUE;

    if (!result) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const data   = parsed?.response;

    if (
      parsed?.status !== 'true' ||
      !data ||
      data === 'Wrong Input Given' ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    return res.json({
      success: true,
      message: 'Doctor data fetched successfully',
      data
    });

  } catch (error) {
    console.error('Doctor Master Error:', error);

    return res.status(500).json({
      success: false,
      message: '500 internal server error'
    });

  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/transaction/api-post-add-update-icu-bed-details:
 *   post:
 *     tags:
 *       - ICU Ward
 *     summary: Add or Update ICU Bed Details
 *     security:
 *       - bearerAuth: []
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
 *               BED_INFO_SYS_ID:
 *                 type: string
 *                 example: "0"
 *               EPISODE_ID:
 *                 type: string
 *                 example: ""
 *               UHID:
 *                 type: string
 *                 example: "UH-100001"
 *               BED_NO:
 *                 type: string
 *                 example: "6001"
 *               NPM:
 *                 type: string
 *                 example: "Y"
 *               EWS:
 *                 type: string
 *                 example: "7"
 *               MJOR_INVESTIGATION:
 *                 type: string
 *                 example: "CBC, KFT, ABG"
 *               REFER_DOCTOR:
 *                 type: string
 *                 example: "Dr. T Das — Cardiology"
 *               DISCHARGE:
 *                 type: string
 *                 example: "N"
 *               FROM_BED_OUT:
 *                 type: string
 *                 example: ""
 *                 description: Source bed for Transfer Out
 *               TO_BED_OUT:
 *                 type: string
 *                 example: ""
 *                 description: Destination bed for Transfer Out
 *               FROM_BED_IN:
 *                 type: string
 *                 example: ""
 *                 description: Source bed for Transfer In
 *               TO_BED_IN:
 *                 type: string
 *                 example: ""
 *                 description: Destination bed for Transfer In
 *               PATIENT_SCORE:
 *                 type: string
 *                 example: ""
 *                 description: Patinet Score
 *               PATIENT_NAME:
 *                 type: string
 *                 example: ""
 *                 description: Patinet Score
 *               OPERATIONS:
 *                 type: string
 *                 example: ""
 *                 description: Procedure / Operation details
 *               CREATED_BY:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: ICU bed details saved successfully
 *       500:
 *         description: Internal server error
 */
router.post('/api-post-add-update-icu-bed-details', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const requestJson = JSON.stringify(req.body); // same pattern as emergency ward

    const [rows] = await conn.execute(
      "CALL USP_POST_ICU_BED_INFO(?, ?, @ERRNO, @ERRMSG);",
      ['ADD_UPDATE_ICU_BED_INFO', requestJson]
    );

    if (rows && rows[0] && rows[0][0]) {
      const result = rows[0][0].JSON_VALUE;
      return res.json(result);
    } else {
      return res.status(500).json({ status: 'false', response: 'Oops!! something went wrong' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/transaction/api-get-view-icu-bed-details:
 *   get:
 *     tags:
 *       - ICU Ward
 *     summary: Get ICU Bed Details
 *     description: Fetch ICU bed details. Use ITEM=VIEW_ALL for all beds or ITEM=SPECIFIC with EPISODE_ID and UHID for a specific bed. Optional filtering by STATION_SYS_ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: SPECIFIC
 *         required: true
 *       - in: query
 *         name: EPISODE_ID
 *         schema:
 *           type: string
 *           example: "IPA400000888"
 *         required: false
 *       - in: query
 *         name: UHID
 *         schema:
 *           type: string
 *           example: "10003000888"
 *         required: false
 *       - in: query
 *         name: STATION_SYS_ID
 *         schema:
 *           type: integer
 *           example: 2
 *         required: false
 *     responses:
 *       200:
 *         description: ICU bed details fetched successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-icu-bed-details', async (req, res) => {
  let conn;
  try {
    const ITEM           = req.query.ITEM       || 'VIEW_ALL';
    const EPISODE_ID     = req.query.EPISODE_ID || '';
    const UHID           = req.query.UHID       || '';
    const STATION_SYS_ID = req.query.STATION_SYS_ID ? parseInt(req.query.STATION_SYS_ID, 10) : null;

    if (ITEM === 'SPECIFIC' && (!EPISODE_ID || !UHID)) {
      return res.status(400).json({
        success: false,
        message: 'EPISODE_ID and UHID are required when ITEM=SPECIFIC'
      });
    }

    conn = await db.getConnection();

    const [rows] = await conn.query(
      "CALL USP_GET_ICU_BED_INFO(?, ?, ?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_ICU_BED_INFO', ITEM, EPISODE_ID, UHID, STATION_SYS_ID]
    );

    const firstResultSet = Array.isArray(rows[0]) ? rows[0] : rows;
    const firstRow       = Array.isArray(firstResultSet) ? firstResultSet[0] : firstResultSet;

    const result =
      firstRow?.JSON_VALUE ??
      firstRow?.json_value ??
      firstRow?.RESULT     ??
      firstRow?.result     ??
      null;

    if (!result) {
      return res.json({ success: false, message: 'No data found (empty result)', data: [] });
    }

    let parsed;
    try {
      parsed = typeof result === 'string' ? JSON.parse(result) : result;
    } catch (e) {
      console.error('JSON PARSE ERROR — raw value was:', result);
      return res.status(500).json({
        success: false,
        message: 'Invalid JSON from database',
        raw: String(result).slice(0, 300)
      });
    }

    let data = parsed?.response;

    if (parsed?.status !== 'true' || !data || data === 'Wrong Input Given') {
      return res.json({ success: false, message: 'No data found', data: [] });
    }

    if (!Array.isArray(data)) data = [data];

    return res.json({
      success: true,
      message: 'ICU bed details fetched successfully',
      data
    });

  } catch (error) {
    console.error('ICU Bed GET ERROR:', error.message);
    console.error('ICU Bed GET STACK:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (conn) conn.release();
  }
});
 

/**
 * @swagger
 * /api/transaction/api-get-view-icu-dashboard-details:
 *   get:
 *     tags:
 *       - ICU Ward
 *     summary: Get ICU Dashboard Details
 *     description: Fetch ICU dashboard details using ITEM type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: VIEW_ALL
 *         required: true
 *         description: Fetch type (VIEW_ALL)
 *       - in: query
 *         name: STATION_SYS_ID
 *         schema:
 *           type: integer
 *           example: 1
 *         required: false
 *         description: Station System ID
 *     responses:
 *       200:
 *         description: ICU dashboard details fetched successfully
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
 *                   example: ICU dashboard details fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-icu-dashboard-details', async (req, res) => {
  let conn;
  try {
    const ITEM             = req.query.ITEM || 'VIEW_ALL';
    const STATION_SYS_ID  = req.query.STATION_SYS_ID ? parseInt(req.query.STATION_SYS_ID, 10) : null;

    if (!ITEM) {
      return res.status(400).json({
        success: false,
        message: 'ITEM is required'
      });
    }

    conn = await db.getConnection();
    const [rows] = await conn.query(
      "CALL USP_GET_ICU_DASHBOARD_DETAILS(?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_ICU_DASHBOARD', ITEM, STATION_SYS_ID]
    );

    const result = rows?.[0]?.[0]?.JSON_VALUE;
    if (!result) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const data   = parsed?.response;

    if (
      parsed?.status !== 'true' ||
      !data ||
      data === 'Wrong Input Given' ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    return res.json({
      success: true,
      message: 'ICU dashboard details fetched successfully',
      data
    });
  } catch (error) {
    console.error('ICU Dashboard GET Error:', error);
    return res.status(500).json({
      success: false,
      message: '500 internal server error'
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /api/transaction/api-get-view-icu-patient-bed-transfer:
 *   get:
 *     tags:
 *       - ICU Ward
 *     summary: Get ICU Patient Bed Transfer Details
 *     description: Fetch ICU patient bed transfer data. Use ITEM=TRANSFER_IN or ITEM=TRANSFER_OUT along with STATION_SYS_ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ITEM
 *         schema:
 *           type: string
 *           example: TRANSFER_IN
 *         required: true
 *         description: Transfer type (TRANSFER_IN / TRANSFER_OUT)
 *       - in: query
 *         name: STATION_SYS_ID
 *         schema:
 *           type: integer
 *           example: 2
 *         required: true
 *         description: Station System ID to filter transfer data
 *     responses:
 *       200:
 *         description: ICU ward transfer details fetched successfully
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
 *                   example: ICU ward transfer details fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-view-icu-patient-bed-transfer', async (req, res) => {
  let conn;
  try {
    const ITEM           = req.query.ITEM || null;
    const STATION_SYS_ID = req.query.STATION_SYS_ID ? parseInt(req.query.STATION_SYS_ID, 10) : null;

    if (!ITEM || !STATION_SYS_ID) {
      return res.status(400).json({
        success: false,
        message: 'ITEM and STATION_SYS_ID are required'
      });
    }

    conn = await db.getConnection();
    const [rows] = await conn.query(
      "CALL USP_GET_ICU_PATIENT_BED_TRANSFER(?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_PATIENT_BED_TRANSFER', ITEM, STATION_SYS_ID]
    );

    const result = rows?.[0]?.[0]?.JSON_VALUE;
    if (!result) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const data   = parsed?.response;

    if (
      parsed?.status !== 'true' ||
      !data ||
      data === 'Wrong Input Given' ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }

    return res.json({
      success: true,
      message: 'ICU ward transfer details fetched successfully',
      data
    });
  } catch (error) {
    console.error('ICU Ward Display GET Error:', error);
    return res.status(500).json({
      success: false,
      message: '500 internal server error'
    });
  } finally {
    if (conn) conn.release();
  }
});

/**

* @swagger

* /api/transaction/api-post-add-update-patient-ot-details:

*   post:

*     tags:

*       - General OT

*     summary: Add or Update Patient OT Details

*     description: Save or update patient OT details using stored procedure

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

*               properties:

*                 ITEM:

*                   type: string

*                   example: ADD

*                 PATIENT_OT_SYS_ID:

*                   type: string

*                   example: "0"

*                 EPISODE_ID:

*                   type: string

*                   example: EPI-001

*                 UHID:

*                   type: string

*                   example: UHID-12345

*                 BED_NO:

*                   type: string

*                   example: B-101

*                 OT_NAME_SYS_ID:

*                   type: string

*                   example: "1"

*                 OT_NAME:

*                   type: string

*                   example: OT1

*                 OT_DATE:

*                   type: string

*                   example: 2026-04-03

*                 SCHEDULED_IN_TIME:

*                   type: string

*                   example: 08:00:00

*                 SCHEDULED_OUT_TIME:

*                   type: string

*                   example: 10:00:00

*                 ACTUAL_IN_TIME:

*                   type: string

*                   example: 08:15:00

*                 ACTUAL_OUT_TIME:

*                   type: string

*                   example: 10:30:00

*                 PATIENT_NAME:

*                   type: string

*                   example: John Doe

*                 PAYER_GROUP:

*                   type: string

*                   example: Corporate

*                 DOCTOR_NAME:

*                   type: string

*                   example: Dr. Smith

*                 ANASTHESISTS_NAME:

*                   type: string

*                   example: Dr. Kapoor

*                 PROCEDURE_NAME:

*                   type: string

*                   example: Appendectomy

*                 STATUS:

*                   type: string

*                   example: Completed

*                 CLEARENCE:

*                   type: string

*                   example: Cleared

*                 CREATED_BY:

*                   type: string

*                   example: "1"

*     responses:

*       200:

*         description: Patient OT details saved successfully

*       500:

*         description: Internal server error

*/

router.post('/api-post-add-update-patient-ot-details', async (req, res) => {

  let conn;

  try {

    conn = await db.getConnection();

    const requestJson = JSON.stringify(req.body);
 
    const [rows] = await conn.execute(

      "CALL USP_POST_PATIENT_OT_DETAILS(?, ?, @ERRNO, @ERRMSG)",

      ['ADD_UPDATE_GENERAL_OT', requestJson]

    );
 
    if (rows && rows[0] && rows[0][0]) {

      const result = rows[0][0].JSON_VALUE;

      return res.json(result);

    } else {

      return res.status(500).json({

        status: 'false',

        response: 'Oops!! something went wrong'

      });

    }
 
  } catch (error) {

    console.error('Patient OT POST Error:', error);
 
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
 
* /api/transaction/api-get-view-ot-patient-dashboard:
 
*   get:
 
*     tags:
 
*       - General OT
 
*     summary: Get OT Patient Dashboard
 
*     description: Fetch OT patient dashboard data based on date
 
*     security:
 
*       - bearerAuth: []
 
*     parameters:
 
*       - in: query
 
*         name: ITEM
 
*         schema:
 
*           type: string
 
*           example: VIEW_ALL
 
*         required: false
 
*         description: Fetch type (default VIEW_ALL)
 
*       - in: query
 
*         name: DATE
 
*         schema:
 
*           type: string
 
*           example: 01-04-2026
 
*         required: true
 
*         description: Date in DD-MM-YYYY format
 
*     responses:
 
*       200:
 
*         description: OT patient dashboard data fetched successfully
 
*       400:
 
*         description: Missing required parameters
 
*       500:
 
*         description: Internal server error
 
*/
 
router.get('/api-get-view-ot-patient-dashboard', async (req, res) => {
  let conn;
  try {
    const ITEM = req.query.ITEM || 'VIEW_ALL';
    const STATION_SYS_ID = req.query.STATION_SYS_ID;
    const DATE = req.query.DATE;
 
    if (!STATION_SYS_ID) {
      return res.status(400).json({
        success: false,
        message: 'STATION_SYS_ID is required'
      });
    }
    if (!DATE) {
      return res.status(400).json({
        success: false,
        message: 'DATE is required'
      });
    }
    function convertDateFormat(dateChange)
    {
      const [day,month,year] = dateChange.split('-');
      return `${year}-${month}-${day}`;
    }
    const sqlDate = convertDateFormat(DATE);
 
    conn = await db.getConnection();
    const [rows] = await conn.query(
      "CALL USP_GET_PATIENT_OT_DAHBOARD(?, ?, ?, ?, @ERRNO, @ERRMSG)",
      ['VIEW_DASHBOARD', ITEM, STATION_SYS_ID,sqlDate]
    );
    const result = rows?.[0]?.[0]?.JSON_VALUE;
 
    if (!result) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }
     const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const data   = parsed?.response;
 
    if (
      parsed?.status !== 'true' ||
      !data ||
      data === 'Wrong Input Given' ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.json({
        success: false,
        message: 'No data found',
        data: []
      });
    }
    return res.json({
      success: true,
      message: 'OT patient dashboard data fetched successfully',
      data
    });
  } catch (error) {
    console.error('OT Patient Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: '500 internal server error'
    });
  } finally {
    if (conn) conn.release();
  }
});

/**

* @swagger

* /api/transaction/api-get-view-general-patient-search-details:

*   get:

*     tags:

*       - General OT

*     summary: Get General Patient Search Details

*     description: Fetch patient details using bed number

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

*         name: BED_NO

*         schema:

*           type: string

*           example: 6001

*         required: true

*     responses:

*       200:

*         description: Patient data fetched successfully

*       500:

*         description: Internal server error

*/

router.get('/api-get-view-general-patient-search-details', async (req, res) => {

  let conn;

  try {

    const ITEM   = req.query.ITEM || 'VIEW_ALL';

    const BED_NO = req.query.BED_NO;
 
    if (!BED_NO) {

      return res.status(400).json({

        success: false,

        message: 'BED_NO is required'

      });

    }
 
    conn = await db.getConnection();
 
    const [rows] = await conn.query(

      "CALL USP_GET_GENERAL_PATIENT_SEARCH_DETAILS(?, ?, ?, @ERRNO, @ERRMSG)",

      ['VIEW_GENERAL_OT_SEARCH', ITEM, BED_NO]

    );
 
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

      message: 'Patient data fetched successfully',

      data

    });
 
  } catch (error) {

    console.error('General Patient Search Error:', error);

    return res.status(500).json({

      success: false,

      message: '500 internal server error'

    });

  } finally {

    if (conn) conn.release();

  }

});
 
 
module.exports = router;