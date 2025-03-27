const ROLE_ID_PROD = '1331268928885882981' //CDC
const ROLE_ID_DEV = '1344362890274279484' //TEST

module.exports = {
  // membersInRole,
  ROLE_ID: process.env.DEV === 'true' ? ROLE_ID_DEV : ROLE_ID_PROD,
  maxOptionsPerPage: 23,
}
