// server/routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// POST: Add a new expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json({ message: 'Expense added successfully', expense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Failed to add expense' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, paymentMode, dateRange } = req.query;

    let filter = {};

    if (category) {
      const categories = category.split(',');
      filter.category = { $in: categories };
    }

    if (paymentMode) {
      const modes = paymentMode.split(',');
      filter.paymentMode = { $in: modes };
    }

    if (dateRange) {
      const now = new Date();
      let fromDate;

      if (dateRange === 'this_month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'last_30_days') {
        fromDate = new Date(now.setDate(now.getDate() - 30));
      } else if (dateRange === 'last_90_days') {
        fromDate = new Date(now.setDate(now.getDate() - 90));
      }

      if (fromDate) {
        filter.date = { $gte: fromDate };
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching expenses', error: err.message });
  }
});
// GET /api/expenses/analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await Expense.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
            category: "$category"
          },
          total: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: { month: "$_id.month", year: "$_id.year" },
          categories: {
            $push: {
              category: "$_id.category",
              total: "$total"
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    res.json(analytics);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Analytics failed" });
  }
});

module.exports = router;
