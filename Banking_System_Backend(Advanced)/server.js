require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/config/db')

const PORT = process.env.PORT || 3000;

connectDb();

app.listen(PORT, () => {
 console.log(`server running on port ${PORT}`)
});