const express = require('express')
const authMiddleware = require('../middleware/auth.middleware');
const accountModel = require('../model/account.model');
const accountController = require('../controllers/account.controller')

const router = express.Router();


router.post('/create',authMiddleware.authMiddleware,accountController.createAccount)

router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountController)

router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController)





module.exports = router