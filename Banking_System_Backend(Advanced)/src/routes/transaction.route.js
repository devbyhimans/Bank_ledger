const {Router } = require('express');
const transactionController = require('../controllers/transaction.controller')
const authMiddleware = require('../middleware/auth.middleware')
const transactionRoutes = Router();


transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)


transactionRoutes.post("/system/intial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createIntialFunds)




module.exports = transactionRoutes;