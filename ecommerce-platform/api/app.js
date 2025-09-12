const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic routes
app.get('/api/products', (req, res) => {
  res.json([{ id: 1, name: 'Product 1', price: 100 }]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});