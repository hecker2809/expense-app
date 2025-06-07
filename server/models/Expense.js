const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  amount: Number,
  category: String,
  notes: String,
  date: Date,
  paymentMode: String,
});

module.exports = mongoose.model("Expense", ExpenseSchema);
