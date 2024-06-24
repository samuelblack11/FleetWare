const express = require('express');
const router = express.Router();
const AvailableItem = require('../models/Item');

// Fetch all available items
router.get('/', async (req, res) => {
  try {
    const items = await AvailableItem.find().populate('farm');
    res.json(items);
  } catch (error) {
    res.status(500).send('Error fetching available items');
  }
});

// Assuming req.body.farm contains the ObjectId of the farm
router.post('/', async (req, res) => {
  const item = new AvailableItem(req.body); // Now expects req.body to include a farm ObjectId
  try {
    await item.save();
    res.send('Item data saved to MongoDB with farm reference');
  } catch (error) {
    res.status(500).send('Error saving item data with farm reference');
  }
});

// API Route to update item stock after an order is placed
router.put('/decrement-stock', async (req, res) => {
  const itemsToUpdate = req.body; // Expecting an array of objects: [{ itemId: '123', quantity: 10 }, ...]
  try {
    const bulkOperations = itemsToUpdate.map(item => ({
      updateOne: {
        filter: { _id: item.itemId },
        update: { $inc: { quantityAvailable: -item.quantity } }
      }
    }));

    const result = await AvailableItem.bulkWrite(bulkOperations);

    res.json({ message: 'Stock updated successfully', result });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).send('Error updating stock');
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await AvailableItem.findByIdAndUpdate(
      req.params.id,
      req.body, // Update all fields sent in the request body
      { new: true }
    ).populate('farm'); // Optionally populate 'farm' to return updated item with farm details
    res.json(updatedItem);
  } catch (error) {
    res.status(500).send('Error updating item: ' + error.message);
  }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedItem = await AvailableItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).send('Item not found');
        }
        res.send('Item deleted successfully');
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Error deleting item');
    }
});


module.exports = router;
