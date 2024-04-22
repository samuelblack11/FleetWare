const express = require('express');
const mongoose = require('../../dujour-shared/node_modules/mongoose');
const cors = require('cors');
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());
const port = process.env.PORT || 3001; // Change 3001 to your preferred port

mongoose.connect('mongodb://localhost:27017/fleetware', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Dujour-Mobile connected to fleetware database...');
  console.log('Mongoose connection state:', mongoose.connection.readyState);

  try {
    const info = await mongoose.connection.db.admin().serverInfo();
    console.log('MongoDB server version:', info.version);
  } catch (err) {
    console.error('Failed to retrieve MongoDB server version:', err);
  }

  console.log('Check 123');
  console.log('Connected to MongoDB database:', mongoose.connection.db.databaseName);

  try {
    const collectionsResult = await mongoose.connection.db.command({ listCollections: 1 });
    const collections = collectionsResult.cursor.firstBatch;
    console.log('Collections:', collections.map(collection => collection.name));
  } catch (err) {
    console.error('Failed to retrieve collections:', err);
  }
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
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
setInterval(checkDbConnection, 5000);


// Import and use routes
const orderRoutes = require('../../dujour-shared/routes/orders');
const driverRoutes = require('../../dujour-shared/routes/drivers');
const userRoutes = require('../../dujour-shared/routes/users');
const deliveryRoutes = require('../../dujour-shared/routes/deliveryRoutes');

app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deliveryRoutes', deliveryRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
