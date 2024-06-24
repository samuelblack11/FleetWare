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

    for (const route of updatedRoutes) {
      // Retrieve the current status of the route
      const routeID = new mongoose.Types.ObjectId(route._id);

      const currentRoute = await DeliveryRoute.findById(route._id).select('status');

      // Update driver and status to 'Driver Assigned'
      let allOrdersReadyForPickup = true;

      // Check the status of each order associated with the stops
      for (const stop of route.stops) {
          const orderObjectId = new mongoose.Types.ObjectId(stop.orderId);
          const order = await Order.findById(orderObjectId);
          if (!order || order.overallStatus !== 'Ready for Driver Pickup') {
              allOrdersReadyForPickup = false;
              break;
          }
      }

    const deliveryRouteStatus = allOrdersReadyForPickup ? 'Ready for Driver Pickup' : 'Driver Assigned';

      // Update driver and status directly in the existing document
      await DeliveryRoute.updateOne(
        { _id: route._id },
        {
          driver: route.driver,
          status: deliveryRouteStatus
        }
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
    let createdRoutesWithIds = []; // Array to hold created routes along with their MongoDB IDs

    for (const route of routes) {
      const { startTime, stops } = route;
      const transformedStops = stops.map(stop => ({
        address: stop.address,
        customerEmail: stop.customerEmail,
        masterOrderNumber: stop.masterOrderNumber,
        latitude: stop.latitude,
        longitude: stop.longitude,
        orderId: stop.orderId
      }));

      let allOrdersReadyForPickup = true;
      for (const stop of transformedStops) {
        const orderObjectId = new mongoose.Types.ObjectId(stop.orderId);
        const order = await Order.findById(orderObjectId);
        if (!order || order.overallStatus !== 'Ready for Driver Pickup') {
          allOrdersReadyForPickup = false;
          break;
        }
      }

      const deliveryRouteStatus = allOrdersReadyForPickup ? 'Ready for Driver Pickup' : 'Scheduled';
      const deliveryRoute = new DeliveryRoute({
        stops: transformedStops,
        startTime: new Date(startTime),
        status: deliveryRouteStatus
      });
      
      const savedRoute = await deliveryRoute.save();
      createdRoutesWithIds.push({ routeId: savedRoute._id, ...savedRoute.toObject() }); // Store the newly created route ID and other data
    }

    res.json({ message: 'Delivery routes data saved to MongoDB.', routes: createdRoutesWithIds });
  } catch (error) {
    console.error('Error processing routes:', error);
    res.status(500).send('Error processing route');
  }
});


// DELETE endpoint to remove all routes for a specific date
router.delete('/', async (req, res) => {
    const { date } = req.query; // Date should be passed as a query parameter

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
    const userObjectId = new mongoose.Types.ObjectId(userId);
    // Lookup for the user by userId
    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "User not found with the given ID" });
    }

    // Print out all delivery routes for debugging
    const allDeliveryRoutes = await DeliveryRoute.find().populate('driver');

    // Construct the query for deliveryRoute lookup
    let query = { driver: user._id };

    // If a date is provided, include date filter in the query
    if (date) {
      // Create a date object for the given date
      const [year, month, day] = date.split('-').map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day));
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(targetDate.getUTCDate() + 1);

      // Add date range filter to the query using startTime
      query.startTime = { $gte: targetDate, $lt: nextDay };
      
    }

    // Lookup for existing deliveryRoutes with the constructed query
    const existingDeliveryRoutes = await DeliveryRoute.find(query).populate('driver');
    if (existingDeliveryRoutes.length > 0) {
      res.json({ exists: true, routes: existingDeliveryRoutes });
    } else {
      res.json({ exists: false, message: "No deliveryRoutes found for this user on the specified date." });
    }
  } catch (error) {
    console.error('Error checking for existing deliveryRoute plans:', error);
    res.status(500).send('Error finding deliveryRoute plans');
  }
});





router.put('/updateDeliveryStatus', async (req, res) => {
  const { deliveryRouteId, stops } = req.body;

  try {

    const deliveryRoute = await DeliveryRoute.findById(deliveryRouteId);
    if (!deliveryRoute) {
      return res.status(404).json({ message: "Delivery Route not found" });
    }

    // Update all stops' status to "Out for Delivery"
    deliveryRoute.stops = stops.map(stop => ({
      ...stop,
      status: 'Out for Delivery'
    }));

    // Save the delivery route after updating the stops' status
    await deliveryRoute.save();

    // Update delivery route status based on the updated stops
    if (deliveryRoute.stops.some(stop => stop.status === 'Scheduled' || stop.status === 'Ready for Driver Pickup')) {
      deliveryRoute.status = 'En Route';
    } else if (deliveryRoute.stops.every(stop => stop.status === 'Delivered')) {
      deliveryRoute.status = 'Delivered';
    }

    // Save the delivery route after updating the delivery route status
    await deliveryRoute.save();

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
    }

    res.status(200).json({ message: "Stop status updated successfully", deliveryRoute });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
