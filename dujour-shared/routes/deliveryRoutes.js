const express = require('express');
const router = express.Router();
const DeliveryRoute = require('../models/DeliveryRoute');
const User = require('../models/User');
const mongoose = require('mongoose');
const Order = require('../models/Order');

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
      }).populate({
            path: 'driver',
            select: 'name startTime'
        });

        // Loop through each route and print the datatype of startTime
        existingRoutes.forEach(route => {
            console.log('Route ID:', route._id);
            console.log('startTime:', route.startTime);
            console.log('Type of startTime:', typeof route.startTime);
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
    const { date, userId } = req.query; // Assuming userId is passed as a query parameter

    try {
        // Lookup for the user by userId
        console.log("Attempting to find user with ID:", userId);
        const user = await User.findById(userId);
        console.log("User found:", user ? user : "No user found with the specified ID.");

        if (!user) {
            return res.status(404).json({ message: "User not found with the given ID" });
        }

        // Construct the query for deliveryRoute lookup
        let query = { driver: user._id };

        if (date) {
            // Create a date object for the given date
            const [year, month, day] = date.split('-').map(Number);
            const targetDate = new Date(Date.UTC(year, month - 1, day));
            
            // Only consider the date part for the comparison
            query.createdAt = { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) };
            console.log(`Query date range: ${targetDate.toISOString()} to ${new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString()}`);
        }

        // Lookup for existing deliveryRoutes
        const existingDeliveryRoutes = await DeliveryRoute.find(query).populate('driver');
        if (existingDeliveryRoutes.length > 0) {
            res.json({ exists: true, routes: existingDeliveryRoutes });
        } else {
            console.log('No deliveryRoutes found for this user on the specified date.');
            res.json({ exists: false, message: "No deliveryRoutes found for this user on the specified date." });
        }
    } catch (error) {
        console.error('Error checking for existing deliveryRoute plans:', error);
        res.status(500).send('Error finding deliveryRoute plans');
    }
});

module.exports = router;


router.put('/updateDeliveryStatus', async (req, res) => {
  const { deliveryRouteId, stops } = req.body;

  try {
    console.log(`Updating delivery route ID: ${deliveryRouteId}`);

    const deliveryRoute = await DeliveryRoute.findById(deliveryRouteId);
    if (!deliveryRoute) {
      console.log("Delivery Route not found");
      return res.status(404).json({ message: "Delivery Route not found" });
    }

    // Update all stops' status to "Out for Delivery"
    deliveryRoute.stops = stops.map(stop => ({
      ...stop,
      status: 'Out for Delivery'
    }));
    console.log("All stops status updated to 'Out for Delivery'");

    // Save the delivery route after updating the stops' status
    await deliveryRoute.save();
    console.log("Delivery Route saved after stops' status update");

    // Update delivery route status based on the updated stops
    if (deliveryRoute.stops.some(stop => stop.status === 'Scheduled')) {
      deliveryRoute.status = 'En Route';
    } else if (deliveryRoute.stops.every(stop => stop.status === 'Delivered')) {
      deliveryRoute.status = 'Delivered';
    }
    console.log(`Updated Delivery Route status to: ${deliveryRoute.status}`);

    // Save the delivery route after updating the delivery route status
    await deliveryRoute.save();
    console.log("Delivery Route saved after status update");

    // Find the orders associated with these stops
    const masterOrderNumbers = deliveryRoute.stops.map(stop => stop.masterOrderNumber);
    const orders = await Order.find({ masterOrderNumber: { $in: masterOrderNumbers } });

    // Update the order statuses based on the updated stops
    for (const order of orders) {
      const allStopsForOrder = deliveryRoute.stops.filter(stop => stop.masterOrderNumber === order.masterOrderNumber);
      if (allStopsForOrder.some(stop => stop.status !== 'Delivered')) {
        order.overallStatus = 'Out for Delivery';
      } else {
        order.overallStatus = 'Order Delivered';
      }
      await order.save();
      console.log(`Updated Order ${order.masterOrderNumber} overall status to: ${order.overallStatus}`);
    }

    res.status(200).json({ message: "Stop status updated successfully", deliveryRoute });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
