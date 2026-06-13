const express = require('express');
const app = express();
const cookieparser = require('cookie-parser')
const authRouter = require('./routes/auth.route')
const accountRouter = require('./routes/account.route')
const transactionRouter = require('./routes/transaction.route')

app.use(express.json());
app.use(cookieparser())

app.use('/api/auth',authRouter)
app.use('/api/accounts/',accountRouter)
app.use('/api/transactions/',transactionRouter)

module.exports = app;
