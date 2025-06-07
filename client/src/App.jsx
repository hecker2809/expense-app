import { useState, useEffect } from 'react';
import './App.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CATEGORY_OPTIONS = ['Rental', 'Groceries', 'Entertainment', 'Travel', 'Others'];
const PAYMENT_MODES = ['UPI', 'Credit Card', 'Net Banking', 'Cash'];
const DATE_RANGES = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Last 90 Days', value: 'last_90_days' },
  { label: 'All Time', value: 'all_time' },
];

function App() {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    notes: '',
    date: '',
    paymentMode: '',
  });

  const [filters, setFilters] = useState({
    dateRange: 'all_time',
    category: [],
    paymentMode: [],
  });

  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const currentValues = prev[filterName];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [filterName]: currentValues.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [filterName]: [...currentValues, value],
        };
      }
    });
  };

  const handleDateRangeChange = (e) => {
    setFilters((prev) => ({ ...prev, dateRange: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://expense-app-zcuv.onrender.com/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Expense added successfully!');
        setFormData({ amount: '', category: '', notes: '', date: '', paymentMode: '' });
        fetchExpenses();
        fetchAnalytics();
      } else {
        alert('Failed to add expense.');
      }
    } catch (err) {
      alert('Error adding expense.');
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      let url = 'https://expense-app-zcuv.onrender.com/api/expenses?';
      if (filters.dateRange && filters.dateRange !== 'all_time') url += `dateRange=${filters.dateRange}&`;
      if (filters.category.length > 0) url += `category=${filters.category.join(',')}&`;
      if (filters.paymentMode.length > 0) url += `paymentMode=${filters.paymentMode.join(',')}&`;

      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('https://expense-app-zcuv.onrender.com/api/expenses/analytics');
      const data = await res.json();
      setAnalytics(transformAnalyticsData(data));
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  const transformAnalyticsData = (data) => {
    return data.map((entry) => {
      const monthLabel = `${entry._id.month}/${entry._id.year}`;
      const categories = {};
      entry.categories.forEach((cat) => {
        categories[cat.category] = cat.total;
      });
      CATEGORY_OPTIONS.forEach((cat) => {
        if (!categories[cat]) categories[cat] = 0;
      });
      return { month: monthLabel, ...categories };
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="app-container">
      <h1>Expense Tracker</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount in ₹" required />
        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" maxLength="100" />
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} required>
          <option value="">Payment Mode</option>
          {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select>
        <button type="submit">Add Expense</button>
      </form>

      <div style={{ marginBottom: '1rem' }}>
        <h3>Filters</h3>
        <div>
          <strong>Date Range:</strong>
          <select value={filters.dateRange} onChange={handleDateRangeChange}>
            {DATE_RANGES.map((dr) => <option key={dr.value} value={dr.value}>{dr.label}</option>)}
          </select>
        </div>
        <div>
          <strong>Category:</strong>
          {CATEGORY_OPTIONS.map((cat) => (
            <label key={cat} style={{ marginLeft: '8px' }}>
              <input type="checkbox" checked={filters.category.includes(cat)} onChange={() => handleFilterChange('category', cat)} />
              {cat}
            </label>
          ))}
        </div>
        <div>
          <strong>Payment Mode:</strong>
          {PAYMENT_MODES.map((mode) => (
            <label key={mode} style={{ marginLeft: '8px' }}>
              <input type="checkbox" checked={filters.paymentMode.includes(mode)} onChange={() => handleFilterChange('paymentMode', mode)} />
              {mode}
            </label>
          ))}
        </div>
      </div>

      <h3>Expenses</h3>
      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Amount (₹)</th>
              <th>Category</th>
              <th>Notes</th>
              <th>Date</th>
              <th>Payment Mode</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id}>
                <td>{exp.amount}</td>
                <td>{exp.category}</td>
                <td>{exp.notes || '-'}</td>
                <td>{new Date(exp.date).toLocaleDateString()}</td>
                <td>{exp.paymentMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Analytics: Monthly Category-wise</h3>
      {analytics.length === 0 ? (
        <p>No analytics data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Rental" stackId="a" fill="#8884d8" />
            <Bar dataKey="Groceries" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Entertainment" stackId="a" fill="#ffc658" />
            <Bar dataKey="Travel" stackId="a" fill="#ff8042" />
            <Bar dataKey="Others" stackId="a" fill="#a4de6c" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default App;
