const cron = require('node-cron');
const {
    icuWardWipeData,
} = require('./scheduler-function');
 
/**
 * Different job time for each ITEM
 */
 
// NEW_PATIENT_ADMIT – every 5 minutes
cron.schedule('0 0 * * *', () => {
//   console.log("ICU CRON Loaded at 12 AM");
  icuWardWipeData();
}, {
  timezone: 'Asia/Kolkata' 
});