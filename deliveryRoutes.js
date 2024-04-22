const express = require('express');
const router = express.Router();
const DeliveryRoute = require('../models/DeliveryRoute'); // Ensure this path matches where your Route model is saved
const Driver = require('../models/Driver'); // Make sure the path is correct

// PUT endpoint to update driver assignments for routes
router.put('/updateDrivers', async (req, res) => {
    const { date, updatedRoutes } = req.body;
    try {
        // Loop through each route in updatedRoutes and update the database
        for (let updatedRoute of updatedRoutes) {
            await DeliveryRoute.updateOne(
                { _id: updatedRoute._id }, // Assuming each route has a unique _id
                { $set: { driverId: updatedRoute.driverId } } // Update the driverId
            );
        }

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

router.get('/', async (req, res) => {
    const { date, email } = req.query; // Changed 'driver' to 'email' to reflect that you receive an email
    console.log(`DATE....${date}`)
    console.log(`EMAIL....${email}`)
    try {
        let query = {};
        
        // First, find the driver by email to get the driverId
        const driver = await Driver.findOne({ Email: { $regex: new RegExp('^' + email + '$', 'i') } });
        console.log(`DRIVER....${driver}`)
        if (!driver) {
            return res.status(404).json({ message: "Driver not found with the given email" });
        }
        
        // Adjust query based on the presence of 'date'
        if (date) {
            const startOfEstDay = new Date(`${date}T00:00:00-05:00`); // Start of day in EST
            const endOfEstDay = new Date(`${date}T23:59:59-05:00`); // End of day in EST
            query.startTime = {
                $gte: startOfEstDay,
                $lte: endOfEstDay
            };
        }

        // Use the found driverId to filter routes
        query.driverId = driver._id;

        // Perform the query with the constructed conditions
        const existingRoutes = await DeliveryRoute.find(query).populate('driverId', 'Email'); // Populating 'Email' is optional now since you know it already
        
        if (existingRoutes.length > 0) {
            res.json({ exists: true, routes: existingRoutes });
        } else {
            res.json({ exists: false, message: "No routes found for this driver on the specified date." });
        }
    } catch (error) {
        console.error('Error checking for existing route plans:', error);
        res.status(500).send('Error finding route plans');
    }
});

module.exports = router;

