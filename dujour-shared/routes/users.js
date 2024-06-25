const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Farm = require('../models/Farm');
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

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

// Example in your user data fetching endpoint
router.get('/forOrderPlacement/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // Decrypt the credit card details
    const decryptedCardNumber = decrypt(user.creditCardNumber);
    const maskedCardNumber = decryptedCardNumber;

    const decryptedExpDate= decrypt(user.ccExpirationDate);
    const maskedExpDate = decryptedExpDate;



    // Send masked data
    res.json({
      ...user.toJSON(),
      creditCardNumber: maskedCardNumber, // only send masked number
      creditCardExpiration: maskedExpDate, // consider masking if necessary
    });
  } catch (error) {
    res.status(500).send('Server error');
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

// PUT route
router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedFields = { ...req.body };

  if (updatedFields.creditCardNumber) {
    updatedFields.creditCardNumber = encrypt(updatedFields.creditCardNumber);
  }

  if (updatedFields.ccExpirationDate) {
    updatedFields.ccExpirationDate = encrypt(updatedFields.ccExpirationDate);
  }

  if (updatedFields.password) {
    updatedFields.password = await bcrypt.hash(updatedFields.password, 10);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', userId: updatedUser._id });
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
        name: user.name,
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
    const accountStatus = role === 'customer' ? 'active' : 'inactive';


    const user = new User({ name, email, password: hashedPassword, role, accountStatus });
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
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.put('/email/:emailAddress/incrementOrderNumber', async (req, res) => {
  try {
    // Log the received email address for debugging

    const emailAddress = req.params.emailAddress;
    // Log the query being made to ensure correctness

    const user = await User.findOne({ email: emailAddress });

    // Check if the user was found and log the result
    if (!user) {
      return res.status(404).send('User not found');
    } else {
      console.log(`User found: ${user.email} with current lastOrderNumber: ${user.lastOrderNumber}`);
    }

    user.lastOrderNumber += 1;
    await user.save();

    // Log the updated order number for confirmation

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

// Route to send email
router.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  // Create transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or another email provider
    auth: {
      user: process.env.EMAIL_USER, // your email address
      pass: process.env.EMAIL_PASS // your email password
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER, // sender address
    to: 'sam@dujourdelivery.com', // receiver
    subject: 'Message from Dujour Customer', // Subject line
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`, // plain text body
    html: `<p>Name: <b>${name}</b></p><p>Email: <b>${email}</b></p><p>Message: <b>${message}</b></p>` // html body
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send email', error);
    res.status(500).send({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = router;
