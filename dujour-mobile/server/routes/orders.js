const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const AvailableItem = require('../models/Item');

router.post('/', async (req, res) => {
  console.log("found post order route....")
  const order = new Order(req.body);

  try {
    // Save the order first to ensure it's valid and can be processed
    await order.save();

    // After saving the order, adjust the inventory for each ordered item
    for (const item of order.items) {
      await AvailableItem.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );
    }
    res.send('Order data saved to MongoDB and inventory updated.');
  } catch (error) {
    console.error('Error processing order or updating inventory', error);
    res.status(500).send('Error processing order or updating inventory');
  }
});

// Fetch all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).send('Error fetching orders');
  }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedItem = await Order.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).send('Order not found');
        }
        res.send('Order deleted successfully');
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).send('Error deleting order');
    }
});

module.exports = router;