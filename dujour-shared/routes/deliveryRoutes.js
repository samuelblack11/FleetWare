const express = require('express');
const router = express.Router();
const DeliveryRoute = require('../models/DeliveryRoute'); // Ensure this path matches where your Route model is saved
const Driver = require('../models/Driver'); // Make sure the path is correct
const mongoose = require('mongoose');

// PUT endpoint to update driver assignments for routes
router.put('/updateDrivers', async (req, res) => {
    const { updatedRoutes } = req.body;
    try {
        console.log("Trying to update drivers....");
        // Execute all updates concurrently
        await Promise.all(updatedRoutes.map(route =>
            DeliveryRoute.updateOne(
                { _id: route._id },
                { $set: { driverId: route.driverId } }
            )
        ));

        res.status(200).json({ message: "Driver assignments updated successfully." });
    } catch (error) {
        console.error('Failed to update driver assignments:', error);
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
      orderNumber: stop.orderNumber,
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

    // Log all drivers
    try {
        const allDrivers = await Driver.find({});
        console.log('All drivers:', allDrivers.map(driver => `${driver.name} - ${driver.Email}`));
    } catch (err) {
        console.error('Error retrieving all drivers:', err);
        return res.status(500).json({ message: "Error retrieving all drivers" });
    }

    try {
        console.log("Attempting to find driver with email:", email);
        const driver = await Driver.findOne({ Email: email });
        console.log("Driver found:", driver ? driver : "No driver found with the specified email.");

        if (!driver) {
            return res.status(404).json({ message: "Driver not found with the given email" });
        }

        // Construct the query for route lookup
        let query = { driverId: driver._id };
        if (date) {
            
            const startOfEstDay = new Date(`${date}T00:00:00-05:00`); // Start of day in EST
            const endOfEstDay = new Date(`${date}T23:59:59-05:00`); // End of day in EST
            query.startTime = { $gte: startOfEstDay, $lte: endOfEstDay };
        }

        // Lookup for existing routes
        const existingRoutes = await DeliveryRoute.find(query).populate('driverId', 'Email');
        if (existingRoutes.length > 0) {
            console.log('Routes found:', existingRoutes);
            res.json({ exists: true, routes: existingRoutes });
        } else {
            console.log('No routes found for this driver on the specified date.');
            res.json({ exists: false, message: "No routes found for this driver on the specified date." });
        }
    } catch (error) {
        console.error('Error checking for existing route plans:', error);
        res.status(500).send('Error finding route plans');
    }
});


module.exports = router;
