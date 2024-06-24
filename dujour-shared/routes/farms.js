const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// Fetch all available items
router.get('/', async (req, res) => {
  try {
    const farms = await Farm.find();
    res.json(farms);
  } catch (error) {
    res.status(500).send('Error fetching available items');
  }
});

// Fetch a farm by name
router.get('/byname/:name', async (req, res) => {
    try {
        const farm = await Farm.findOne({ name: req.params.name });
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }
        res.json(farm);
    } catch (error) {
        console.error('Error fetching farm by name:', error);
        res.status(500).json({ message: 'Error fetching farm' });
    }
});



router.post('/', async (req, res) => {
    const farm = new Farm(req.body); // Assuming Farm is your mongoose model for farms
    try {
        await farm.save();
        res.status(201).send(farm);
    } catch (error) {
        console.error('Error adding farm:', error);
        res.status(500).send('Server error');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedFarm = await Farm.findByIdAndDelete(req.params.id);
        if (!deletedFarm) {
            return res.status(404).send('Farm not found');
        }
        res.send('Farm deleted successfully');
    } catch (error) {
        console.error('Error deleting Farm:', error);
        res.status(500).send('Error deleting itFarmem');
    }
});


module.exports = router;
