const mongoose = require('mongoose')
const ledgerModel = require('../model/ledger.model')

const accountSchema = new mongoose.Schema({
 user:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"user",
  required:[true,"Account must be associated with a user"],
  index:true //to make searching fast
 },
 status:{
  type:String,
  enum:{
   values:["ACTIVE","FROZEN","CLOSED"],
   message:"Status can be either ACTIVE,FROZEN,CLOSED",
  },
  default:"ACTIVE"
 },
 currency:{
  type: String,
  required:[true,"Currency is required for creating a account"],
  default:"INR"
 },
 systemAccount:{
  type:Boolean,
  default:false,
  immutable:true
 }

 },{
  timestamps:true
})

//compound index
accountSchema.index({user:1,status:1})


//in banking system the ledger is the single source of truth so all the balance are retrives from the ledger only
accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    {
      $match: {
        account: this._id
      }
    },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "DEBIT"] },
              "$amount",
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        balance: {
          $subtract: ["$totalCredit", "$totalDebit"]
        }
      }
    }
  ]);

  //if there is no balance entry then balance is zero for new users this is helpful 
  return balanceData.length > 0 ? balanceData[0].balance : 0;
};


const accountModel = mongoose.model("account",accountSchema)

module.exports = accountModel;