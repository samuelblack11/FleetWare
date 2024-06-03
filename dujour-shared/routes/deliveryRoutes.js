const express = require('express');
const router = express.Router();
const DeliveryRoute = require('../models/DeliveryRoute'); // Ensure this path matches where your Route model is saved
const User = require('../models/User'); // Make sure the path is correct
const mongoose = require('mongoose');

// PUT endpoint to update user assignments for routes
router.put('/updateUsers', async (req, res) => {
  const { updatedRoutes } = req.body;
  try {
    console.log("Trying to update user....");
    console.log(updatedRoutes)

    for (const route of updatedRoutes) {
      await DeliveryRoute.updateOne({ _id: route._id }, { driver: route.driver });
    }
    
    res.status(200).json({ message: "User assignments updated successfully." });
  } catch (error) {
    console.error('Failed to update user assignments:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/', async (req, res) => {
  const { routes } = req.body;
  try {
  const transformedRoutes = routes.map(route => {
    const { startTime, stops } = route;
    const transformedStops = stops.map(stop => ({
      // Ensure this matches your frontend submission structure
      address: stop.address,
      customerEmail: stop.customerEmail,
      masterOrderNumber: stop.masterOrderNumber,
      latitude: stop.latitude,
      longitude: stop.longitude
    }));

    return {
      // Other route details...
      stops: transformedStops,
      startTime: new Date(startTime),
    };
  });

    // Iterate over transformedRoutes to save each to the database
    for (const route of transformedRoutes) {
      const deliveryRoute = new DeliveryRoute(route);
      await deliveryRoute.save();
    }

    res.send('Delivery routes data saved to MongoDB.');
  } catch (error) {
    console.error('Error processing routes:', error);
    res.status(500).send('Error processing route');
  }
});

// DELETE endpoint to remove all routes for a specific date
router.delete('/', async (req, res) => {
    const { date } = req.query; // Date should be passed as a query parameter
    console.log("Received date for deletion:", date); // Check what is received

    try {
        // Convert the date to the same format and timezone as used in your GET method
        const startOfEstDay = new Date(`${date}T00:00:00-05:00`); // Start of day in EST
        const endOfEstDay = new Date(`${date}T23:59:59-05:00`); // End of day in EST

        // Delete routes that start within the specified day
        const result = await DeliveryRoute.deleteMany({
            startTime: {
                $gte: startOfEstDay,
                $lte: endOfEstDay
            }
        });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Delivery routes deleted successfully.' });
        } else {
            res.status(404).json({ message: 'No routes found to delete.' });
        }
    } catch (error) {
        console.error('Failed to delete delivery routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assuming you have a field like `date` or you use `startTime` in your schema to store the date
router.get('/', async (req, res) => {
    const { date } = req.query; // Get the date from query parameters

    try {
      // Assuming 'date' is in "YYYY-MM-DD" format and represents an EST date
      const startOfEstDay = new Date(`${date}T00:00:00-05:00`); // Start of day in EST, adjust offset as needed for EDT
      const endOfEstDay = new Date(`${date}T23:59:59-05:00`); // End of day in EST

      const existingRoutes = await DeliveryRoute.find({
          startTime: {
              $gte: startOfEstDay,
              $lte: endOfEstDay
          }
      });
        if (existingRoutes.length > 0) {
            res.json({ exists: true, routes: existingRoutes });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking for existing route plans:', error);
        res.status(500).send('Error finding route plans');
    }
});

router.get('/specificRoute', async (req, res) => {
    const { date, email } = req.query;

    console.log(`Received email: ${email} (Type: ${typeof email})`);
    console.log(`DATE....${date}`);
    console.log(`EMAIL....${email}`);

    // Ensure the connection is ready
    if (mongoose.connection.readyState !== 1) {
        console.error("Database not connected!");
        return res.status(500).json({ message: "Database not connected" });
    }

    // Log all users
    try {
        const allUsers = await User.find({});
        console.log('All users:', allUsers.map(user => `${user.name} - ${user.Email}`));
    } catch (err) {
        console.error('Error retrieving all users:', err);
        return res.status(500).json({ message: "Error retrieving all users" });
    }

    try {
        console.log("Attempting to find user with email:", email);
        const user = await User.findOne({ Email: email });
        console.log("User found:", user ? user : "No user found with the specified email.");

        if (!user) {
            return res.status(404).json({ message: "User not found with the given email" });
        }

        // Construct the query for route lookup
        let query = { userId: user._id };
        if (date) {
            
            const startOfEstDay = new Date(`${date}T00:00:00-05:00`); // Start of day in EST
            const endOfEstDay = new Date(`${date}T23:59:59-05:00`); // End of day in EST
            query.startTime = { $gte: startOfEstDay, $lte: endOfEstDay };
        }

        // Lookup for existing routes
        const existingRoutes = await DeliveryRoute.find(query).populate('userId', 'Email');
        if (existingRoutes.length > 0) {
            console.log('Routes found:', existingRoutes);
            res.json({ exists: true, routes: existingRoutes });
        } else {
            console.log('No routes found for this user on the specified date.');
            res.json({ exists: false, message: "No routes found for this user on the specified date." });
        }
    } catch (error) {
        console.error('Error checking for existing route plans:', error);
        res.status(500).send('Error finding route plans');
    }
});


module.exports = router;
