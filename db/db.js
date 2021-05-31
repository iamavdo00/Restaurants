const { Pool } = require('pg');
module.exports.pool = new Pool({
    user: 'mpwrdxxr',
    database: 'mpwrdxxr',
    password: '4BvTc4TYo1CLHlsDurmjHNRPTFeRC4mm',
    host: 'kandula.db.elephantsql.com',
    port: 5432,
    max: 7,
    idleTimeoutMillis: 30000
});