const express = require('express');
const mongoose = require('../../dujour-shared/node_modules/mongoose');
const config = require('../../dujour-shared/config');
const cors = require('cors');
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());
const port = process.env.PORT || 3004; // Change 3001 to your preferred port

// URL encode the password to handle special characters
const encodedUsername = encodeURIComponent(config.mongoUserName); // URL encode the username if needed
const encodedPassword = encodeURIComponent(config.mongoPwd);

// Construct the MongoDB URI using imported configuration
const uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@${config.mongoClusterName}.mongodb.net/Dujour?retryWrites=true&w=majority&appName=${config.databaseName}`

mongoose.connect(uri, { useNewUrlParser: true})
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

// Function to check connection status
function checkDbConnection() {
  const state = mongoose.connection.readyState;
  console.log(`Checking DB connection: State ${state}`);
  switch (state) {
    case 0:
      console.log('Database disconnected.');
      break;
    case 1:
      console.log('Database connected.');
      break;
    case 2:
      console.log('Database connecting...');
      break;
    case 3:
      console.log('Database disconnecting...');
      break;
    default:
      console.log('Unknown database connection state.');
      break;
  }
}

// Set interval to check database connection every 5 seconds
//setInterval(checkDbConnection, 5000);


// Import and use routes
const orderRoutes = require('../../dujour-shared/routes/orders');
const userRoutes = require('../../dujour-shared/routes/users');
const deliveryRoutes = require('../../dujour-shared/routes/deliveryRoutes');
const pickPlans = require('../../dujour-shared/routes/pickPlans');

app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deliveryRoutes', deliveryRoutes);
app.use('/api/pickPlans', pickPlans);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
