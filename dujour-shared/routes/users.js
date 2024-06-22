const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Farm = require('../models/Farm');

// Route to delete all users
router.delete('/deleteAll', async (req, res) => {
  try {
    await User.deleteMany({});
    res.send('All users deleted successfully');
  } catch (error) {
    console.error('Error deleting all users:', error);
    res.status(500).send('Error deleting all users');
  }
});

router.get('/:id', async (req, res) => {
  const updatedFields = { ...req.body };
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

// User routes
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

router.post('/', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.send('User data saved to MongoDB');
  } catch (error) {
    res.status(500).send('Error saving user data');
  }
});

router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedFields = { ...req.body };
  console.log("PUT Request UserID:", userId);
  console.log("PUT Request Body:", req.body);

  try {
    // Check if password is being updated
    if (updatedFields.password) {
      console.log("Original Password:", updatedFields.password);
      updatedFields.password = await bcrypt.hash(updatedFields.password, 10);
      console.log("Hashed Password:", updatedFields.password);
    }

    console.log("Updated Fields:", updatedFields);

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("Updated User:", updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Error updating user');
  }
});




router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      'yourSecretKey',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      userDetails: {
        _id: user._id,
        email: user.email,
        role: user.role,
        deliveryAddress: user.deliveryAddress
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      'yourSecretKey',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      userDetails: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.put('/email/:emailAddress/incrementOrderNumber', async (req, res) => {
  console.log(`Received request to increment order number for email: ${req.params.emailAddress}`);
  try {
    // Log the received email address for debugging

    const emailAddress = req.params.emailAddress;
    // Log the query being made to ensure correctness
    console.log(`Querying for user with email: ${emailAddress}`);

    const user = await User.findOne({ email: emailAddress });

    // Check if the user was found and log the result
    if (!user) {
      console.log(`No user found for email: ${emailAddress}`);
      return res.status(404).send('User not found');
    } else {
      console.log(`User found: ${user.email} with current lastOrderNumber: ${user.lastOrderNumber}`);
    }

    user.lastOrderNumber += 1;
    await user.save();

    // Log the updated order number for confirmation
    console.log(`Incremented lastOrderNumber for user: ${user.email} to ${user.lastOrderNumber}`);

    res.send(`User order number incremented successfully for ${user.email} to ${user.lastOrderNumber}`);
  } catch (error) {
    console.error('Error incrementing user order number:', error);
    res.status(500).send('Error incrementing user order number');
  }
});

router.get('/email/:emailAddress', async (req, res) => {
  try {
    const emailAddress = req.params.emailAddress;
    // Correctly find the user by email address
    const user = await User.findOne({ email: emailAddress });
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user)
  } catch (error) {
    console.error('Error incrementing user order number:', error);
    res.status(500).send('Error incrementing user order number');
  }
});

module.exports = router;
