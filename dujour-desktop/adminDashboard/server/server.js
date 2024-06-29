require('dotenv').config();
const express = require('express');
const mongoose = require('../../../dujour-shared/node_modules/mongoose');
const cors = require('cors');
const path = require('path');  // Import the 'path' module here
const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
const port = process.env.PORT || 3000; // Change 3001 to your preferred port

// URL encode the password to handle special characters
const encodedUsername = encodeURIComponent(process.env.mongoUserName);
const encodedPassword = encodeURIComponent(process.env.mongoPwd);

// Construct the MongoDB URI using imported configuration
const uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@${process.env.mongoClusterName}.mongodb.net/Dujour?retryWrites=true&w=majority&appName=${process.env.databaseName}`

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB Atlas database...');
    
    // Ensure we're using the correct database
    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);

    // List collection names
    db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
        return;
      }
      console.log('Collections:');
      collections.forEach(collection => console.log(collection.name));
    });
  })
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1); // Exit the process to avoid running the server without a database connection
  });

app.use(express.static(path.join(__dirname, 'client/build')));
app.use(express.static(path.join(__dirname, 'client/public')));

// Import and use routes
const farmRoutes = require('../../../dujour-shared/routes/farms');
const itemRoutes = require('../../../dujour-shared/routes/items');
const orderRoutes = require('../../../dujour-shared/routes/orders');
const userRoutes = require('../../../dujour-shared/routes/users');
const optimizeDeliveries = require('../../../dujour-shared/routes/optimize-deliveries')({
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
});

const deliveryRoutes= require('../../../dujour-shared/routes/deliveryRoutes');
const pickPlans= require('../../../dujour-shared/routes/pickPlans');

app.use('/api/farms', farmRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/optimize-deliveries', optimizeDeliveries);
app.use('/api/deliveryRoutes', deliveryRoutes);
app.use('/api/pickPlans', pickPlans);



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
