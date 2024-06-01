const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const AvailableItem = require('../models/Item');
const nodemailer = require('nodemailer');
const stripe = require('stripe')('your-stripe-secret-key'); // Make sure to replace 'your-stripe-secret-key' with your actual Stripe secret key

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

router.post('/', async (req, res) => {
  console.log("found post order route....");
  const { orderData, paymentMethodId, amount, currency, emailHtml } = req.body;

  try {
  //  // Step 1: Process payment
  //  const paymentIntent = await stripe.paymentIntents.create({
  //    amount,
  //    currency,
  //    payment_method: paymentMethodId,
  //    confirmation_method: 'manual',
  //    confirm: true,
  //  });

  //  if (paymentIntent.status !== 'succeeded') {
  //    return res.status(400).send('Payment processing failed.');
  //  }


    // Step 2: Save the order
    const order = new Order(orderData);
    await order.save();

    // Step 3: Update inventory
    for (const item of order.items) {
      await AvailableItem.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );
    }

    // Step 4: Send confirmation email
   // await sendOrderEmail(order.customerEmail, 'Your Order Summary', emailHtml);

    res.send('Order data saved to MongoDB, inventory updated, and email sent.');
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).send('Error processing order');
  }
});
// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

// Function to send email
const sendOrderEmail = (to, subject, html) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};

module.exports = router;
