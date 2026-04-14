const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const listingRoutes = require('./routes/listings');
const orderRoutes = require('./routes/orders');

dotenv.config();

const app = express();

// --- MIDDLEWARE
app.use(cors());           // Allows React to connect
app.use(express.json());   // Parses JSON data in request bodies

// --- ROUTES ---
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));