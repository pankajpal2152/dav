const db = require('../config/db');

async function icuWardWipeData() {
    let conn;
    try {
        conn = await db.getConnection();

        const [rows] = await conn.execute(
            `CALL USP_GET_EPISODE_PATIENT_DETAILS_ACTIVITY(?, ?, @ERRNO, @ERRMSG);`,
            ['VIEW_EPISODE_PATIENTS_LIST', 'NEW_PATIENT_ADMIT']
        );

        const episodeList = rows[0];
        if (!episodeList || episodeList.length === 0) {
            console.log('[ICU WIPE] No active episodes found, skipping.');
            return;
        }
        const payload = JSON.stringify(
            episodeList.map(row => ({
                ITEM: 'WIPE_OUT',
                EPISODE_ID: row.EPISODE_ID
            }))
        );
        await conn.execute(
            `CALL USP_POST_ICU_BED_INFO('ADD_UPDATE_ICU_BED_INFO', ?, @ERRNO, @ERRMSG);`,
            [payload]
        );

        const [[result]] = await conn.execute(`SELECT @ERRMSG AS ERRMSG`);
        console.log('[ICU WIPE] Result:', result?.ERRMSG);

    } catch (err) {
        console.error('[ICU WIPE] Error:', err.message);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { icuWardWipeData };