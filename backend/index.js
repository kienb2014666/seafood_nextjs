const app = require('./app');
require('dotenv').config();
const connect = require('./app/config/index');
const db = require('./app/utils/mongodb.util');
const PORT = connect.app.port;



//start server
db.connect();
app.listen(PORT, () => console.log(`App for http://locahost:${PORT}`));
