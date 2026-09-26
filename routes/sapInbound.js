const db = require('../config/db');

/* =====================================================
   SWAGGER DOCUMENTATION (MULTIPLE ENDPOINTS)
   SAME BACKEND API
===================================================== */

/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=NEW_PATIENT_ADMIT:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: New Patient Admit
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
 *     responses:
 *       200:
 *         description: Success
 */


/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=DISCHARGE_PATIENT:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: Discharge Patient
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
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=PATIENT_BED_TRANSFER:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: Patient Bed Transfer
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
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=DELETE_BED_TRANSFER:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: Delete Bed Transfer
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
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=DELETE_DISCHARGE_PATIENT:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: Delete Discharge Patient
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
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /api/sap-integration/patient-event?eventType=DELETE_DISCHARGE_FROM_WORD:
 *   post:
 *     tags:
 *       - Patient Event
 *     summary: Delete Discharge From Ward
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
 *     responses:
 *       200:
 *         description: Success
 */

/* =====================================================
   CONTROLLER (SINGLE FUNCTION)
===================================================== */

async function addUpdatePatientEvent(req, res) {
    let conn;
    try {
        const { eventType } = req.query;

        if (!eventType) {
            return res.status(400).json({
                status: false,
                message: 'eventType query parameter is required'
            });
        }

        const events = Array.isArray(req.body) ? req.body : [req.body];
        conn = await db.getConnection();
        let result;
        switch (eventType) {
            case 'NEW_PATIENT_ADMIT':
                result = await handleNewAdmission(events, conn);
                break;
            case 'DISCHARGE_PATIENT':
                result = await handleNewAdmission(events, conn);
                break;
            case 'PATIENT_BED_TRANSFER':
                result = await handleBedTransfer(events, conn);
                break;
            case 'DELETE_BED_TRANSFER' :
                result = await handleDeleteBedTransfer(events,conn);
                break;
            case 'DELETE_DISCHARGE_PATIENT' :
                result = await handleDeleteDischargePatient(events,conn);
                break;
            case 'DELETE_DISCHARGE_FROM_WORD':
                result = await handleDeleteDischargeFromWard(events, conn);
                break;
            default:
                return res.status(400).json({ status: false, message: `Unknown eventType: ${eventType}` });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error('🔥 Patient Event Error:', error);
        return res.status(500).json({ status: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
}

/* =====================================================
   DATABASE HANDLERS
===================================================== */

async function handleNewAdmission(data, conn) {
    try {
        console.log("JSON.stringify(data)",JSON.stringify(data))
        const [rows] = await conn.execute(
            'CALL USP_POST_EPISODE_PATIENT_SAP_MAIN_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
            ['ADD_UPDATE_EPISODE_PATIENT', JSON.stringify(data)]
        );
        console.error('🔥 Patient Event rows:', rows?.[0]?.[0]?.JSON_VALUE);
        return rows?.[0]?.[0]?.JSON_VALUE;
    }
    catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

async function handleBedTransfer(data, conn) {
    try {
        const [rows] = await conn.execute(
            'CALL USP_POST_EPISODE_PATIENT_SAP_MAIN_BED_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
            ['ADD_UPDATE_EPISODE_PATIENT_BED_DETAILS', JSON.stringify(data)]
        );
        return rows?.[0]?.[0]?.JSON_VALUE;
    }
    catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

async function handleDeleteBedTransfer(data,conn){
    try {
        const [rows] = await conn.execute(
            'CALL USP_POST_EPISODE_PATIENT_SAP_MAIN_BED_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
            ['ADD_UPDATE_EPISODE_PATIENT_BED_DETAILS', JSON.stringify(data)]
        );
        return rows?.[0]?.[0]?.JSON_VALUE;
    }
    catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

async function handleDeleteDischargePatient(data,conn){
    try {
        console.log("JSON.stringify(data)",JSON.stringify(data))
        const [rows] = await conn.execute(
            'CALL USP_POST_EPISODE_PATIENT_SAP_MAIN_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
            ['ADD_UPDATE_EPISODE_PATIENT', JSON.stringify(data)]
        );
        console.error('🔥 Patient Event rows:', rows?.[0]?.[0]?.JSON_VALUE);
        return rows?.[0]?.[0]?.JSON_VALUE;
    }
    catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

async function handleDeleteDischargeFromWard(data, conn) {
    const [rows] = await conn.execute(
        'CALL USP_POST_EPISODE_PATIENT_ACTIVITY(?, ?, @ERRNO, @ERRMSG);',
        ['ADD_UPDATE_EPISODE_PATIENT', JSON.stringify(data)]
    );
    return rows?.[0]?.[0]?.JSON_VALUE
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
    addUpdatePatientEvent
};
