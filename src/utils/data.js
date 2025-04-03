const ROLE_ID_PROD = '1356716333089292458' //CDC
const ROLE_ID_DEV = '1344362890274279484' //TEST

module.exports = {
  ROLE_ID: process.env.DEV === 'true' ? ROLE_ID_DEV : ROLE_ID_PROD,
  maxOptionsPerPage: 23,
}
