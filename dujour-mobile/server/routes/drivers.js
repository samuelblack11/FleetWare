const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// Driver routes
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).send('Error fetching drivers');
  }
});

router.post('/', async (req, res) => {
  const driver = new Driver(req.body);
  try {
    await driver.save();
    res.send('Driver data saved to MongoDB');
  } catch (error) {
    res.status(500).send('Error saving driver data');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).send('Error updating driver');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.send('Driver deleted successfully');
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).send('Error deleting driver');
  }
});

module.exports = router;