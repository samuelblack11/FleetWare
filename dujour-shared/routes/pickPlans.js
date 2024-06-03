const express = require('express');
const router = express.Router();
const PickPlan = require('../models/PickPlan'); // Assuming you have a PickPlan model
const User = require('../models/User'); // Assuming you have a User model
const Order = require('../models/Order'); // Assuming you have a User model

// Get pick plans by date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const pickPlans = await PickPlan.find({ date }).populate('user');
    res.json(pickPlans);
  } catch (error) {
    console.error('Error fetching pick plans:', error);
    res.status(500).send('Server error');
  }
});

// Save pick plans
router.post('/', async (req, res) => {
  try {
    const { date, pickPlans } = req.body;
    console.log("Received pick plans:", pickPlans);

    // Loop through each pick plan and each item to print the orderId
    pickPlans.forEach(plan => {
      plan.items.forEach(item => {
        console.log(`Order ID for item ${item.itemName}: ${item.orderID}`);
      });
    });

    await PickPlan.deleteMany({ date }); // Remove existing plans for the date
    const newPickPlans = pickPlans.map(plan => new PickPlan(plan));
    await PickPlan.insertMany(newPickPlans);
    res.status(201).send('Pick plans saved successfully');
  } catch (error) {
    console.error('Error saving pick plans:', error);
    res.status(500).send('Server error');
  }
});


// Update pick plan users
router.put('/updateUsers', async (req, res) => {
  try {
    const { date, updatedPickPlans } = req.body;
    for (const plan of updatedPickPlans) {
      await PickPlan.updateOne({ _id: plan._id }, { user: plan.userId });
    }
    res.status(200).send('Pick plans updated successfully');
  } catch (error) {
    console.error('Error updating pick plans:', error);
    res.status(500).send('Server error');
  }
});

// Delete pick plans
router.delete('/', async (req, res) => {
  try {
    const { date } = req.query;
    await PickPlan.deleteMany({ date });
    res.status(200).send('Pick plans deleted successfully');
  } catch (error) {
    console.error('Error deleting pick plans:', error);
    res.status(500).send('Server error');
  }
});

router.get('/specificPickPlan', async (req, res) => {
    const { date, userId } = req.query; // Assuming userId is passed as a query parameter

    try {
        // Lookup for the user by userId
        console.log("Attempting to find user with ID:", userId);
        const user = await User.findById(userId);
        console.log("User found:", user ? user : "No user found with the specified ID.");

        if (!user) {
            return res.status(404).json({ message: "User not found with the given ID" });
        }

        // Construct the query for pickPlan lookup
        let query = { user: user._id };

        if (date) {
            // Create a date object for the given date
            const [year, month, day] = date.split('-').map(Number);
            const targetDate = new Date(Date.UTC(year, month - 1, day));
            
            // Only consider the date part for the comparison
            query.date = { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) };
            console.log(`Query date range: ${targetDate.toISOString()} to ${new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString()}`);
        }

        // Lookup for existing pickPlans
        const existingPickPlans = await PickPlan.find(query).populate('user');
        console.log("existingPickPlans....")
        console.log(existingPickPlans);
        if (existingPickPlans.length > 0) {
            console.log('Routes found:', existingPickPlans);
            res.json({ exists: true, pickPlans: existingPickPlans });
        } else {
            console.log('No pickPlans found for this user on the specified date.');
            res.json({ exists: false, message: "No pickPlans found for this user on the specified date." });
        }
    } catch (error) {
        console.error('Error checking for existing pickPlan plans:', error);
        res.status(500).send('Error finding pickPlan plans');
    }
});

router.put('/updatePickStatus', async (req, res) => {
  const { pickPlanId, itemId, newStatus } = req.body;

  try {
    console.log(`Updating pick plan ID: ${pickPlanId}, item ID: ${itemId}, new status: ${newStatus}`);
    
    const pickPlan = await PickPlan.findById(pickPlanId);
    if (!pickPlan) {
      console.log("Pick Plan not found");
      return res.status(404).json({ message: "Pick Plan not found" });
    }

    const item = pickPlan.items.id(itemId);
    if (!item) {
      console.log("Item not found in Pick Plan");
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item status
    item.status = newStatus;
    console.log(`Updated item status to: ${newStatus}`);

    // Save the pick plan after updating the item status
    await pickPlan.save();
    console.log("Pick Plan saved after item status update");

    // Update pick plan status based on the updated items
    if (pickPlan.items.some(item => item.status === 'Not Picked')) {
      pickPlan.status = 'Pick In Progress';
    } else {
      pickPlan.status = 'Pick Complete';
    }
    console.log(`Updated Pick Plan status to: ${pickPlan.status}`);

    // Save the pick plan after updating the pick plan status
    await pickPlan.save();
    console.log("Pick Plan saved after status update");

    // Find the order associated with this item
    const order = await Order.findOne({ masterOrderNumber: item.masterOrderNumber });
    if (!order) {
      console.log("Order not found");
      return res.status(404).json({ message: "Order not found" });
    }

    // Find all pick plans associated with this order
    const allPickPlansForOrder = await PickPlan.find({ 'items.masterOrderNumber': item.masterOrderNumber });
    console.log(`All pick plans for order (masterOrderNumber: ${item.masterOrderNumber}):`, allPickPlansForOrder);

    // Transform allPickPlansForOrder to get all items associated with the order
    const allItemsForOrder = allPickPlansForOrder.flatMap(pp => pp.items.filter(i => i.masterOrderNumber === item.masterOrderNumber));
    console.log(`All items for order:`, allItemsForOrder);

    // Update the order status based on the statuses of all items across all pick plans
    if (allItemsForOrder.some(item => item.status === 'Not Picked')) {
      order.overallStatus = 'Order Pick in Progress';
    } else {
      order.overallStatus = 'Order Pick Complete';
    }
    console.log(`Updated Order overall status to: ${order.overallStatus}`);

    // Save the order after updating the order status
    await order.save();
    console.log("Order saved after status update");

    res.status(200).json({ message: "Item status updated successfully", pickPlan });
  } catch (error) {
    console.error('Error updating pick status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
