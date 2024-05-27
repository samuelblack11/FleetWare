const express = require('express');
const mongoose = require('../../../dujour-shared/node_modules/mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001; // Change 3001 to your preferred port
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fleetware', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to fleetware database...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Import and use routes
const farmRoutes = require('../../../dujour-shared/routes/farms');
const itemRoutes = require('../../../dujour-shared/routes/items');
const orderRoutes = require('../../../dujour-shared/routes/orders');
const driverRoutes = require('../../../dujour-shared/routes/drivers');
const userRoutes = require('../../../dujour-shared/routes/users');
const optimizeDeliveries= require('../../../dujour-shared/routes/optimize-deliveries');
const deliveryRoutes= require('../../../dujour-shared/routes/deliveryRoutes');

app.use('/api/farms', farmRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/optimize-deliveries', optimizeDeliveries);
app.use('/api/deliveryRoutes', deliveryRoutes);



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
