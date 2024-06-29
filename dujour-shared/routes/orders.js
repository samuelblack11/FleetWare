const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const AvailableItem = require('../models/Item');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);
const Farm = require('../models/Farm');
const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode'); // Assuming the model is in a directory called models

// New route to get all orders with nested item and farm details
router.get('/detailed-orders', async (req, res) => {
  try {
    const { date } = req.query;
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const orders = await Order.find({
      deliveryDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      }
    }).exec();

    // Transform the orders to include vendorLocationNumber for each item
    const detailedOrders = await Promise.all(orders.map(async (order) => {
      const transformedItems = await Promise.all(order.items.map(async (orderItem) => {
        const item = await AvailableItem.findById(orderItem._id).exec();
        if (!item) {
          console.error(`Item not found for orderItem: ${orderItem._id}`);
          return {
            itemName: 'Unknown',
            itemUnitCost: 0,
            quantity: orderItem.quantity,
            vendorLocationNumber: 'Unknown',
            farmName: 'Unknown'
          };
        }

        const farm = await Farm.findById(item.farm).exec();

        return {
          itemName: item.itemName,
          itemUnitCost: item.unitCost,
          quantity: orderItem.quantity,
          vendorLocationNumber: farm ? farm.vendorLocationNumber : 'Unknown',
          farmName: farm ? farm.name : 'Unknown'
        };
      }));

      return {
        ...order.toObject(),
        items: transformedItems
      };
    }));

    res.json(detailedOrders);
  } catch (error) {
    console.error('Error fetching detailed orders:', error);
    res.status(500).send('Server error');
  }
});

// Route to validate a promo code
router.post('/promocode', async (req, res) => {
  try {
    const { promoCode } = req.body;

    {/*// Retrieve and log all promo codes in the database
    const allPromoCodes = await PromoCode.find({});
    console.log("All available promo codes:", allPromoCodes);*/}

    const codeDetails = await PromoCode.findOne({ code: promoCode });
    if (!codeDetails) {
      return res.status(404).json({ isValid: false, message: "Promo code is not valid" });
    }
    res.json({
      isValid: true,
      type: codeDetails.type,
      amount: codeDetails.type === 'discount' ? codeDetails.amount : undefined
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).send('Server error');
  }
});


// Get orders with an optional date parameter
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    let orders;

    if (date) {
      // Calculate the start and end of the day for the specified date
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999); // Set the end of the day to the last millisecond

      // Fetch orders for the specific date
      orders = await Order.find({
        deliveryDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).exec();
    } else {
      // Fetch all orders if no date is provided
      orders = await Order.find().exec();
    }

    // For each order, fetch the corresponding items
    for (let order of orders) {
      for (let item of order.items) {
        const itemDetails = await AvailableItem.findById(item._id);
        item.item = itemDetails; // Replace the item ID with the full item details
      }
    }

    // Send the response
    res.json(orders);
  } catch (error) {
    // Log any errors
    console.error('Error fetching orders:', error);
    res.status(500).send('Server error');
  }
});



// Route to get the statuses of multiple orders by their IDs
router.post('/order-statuses', async (req, res) => {
  try {
    const { orderIDs } = req.body; // Expect an array of orderIDs in the request body
    const orders = await Order.find({ '_id': { $in: orderIDs } }, 'overallStatus'); // Fetch only the 'overallStatus' field
    // Create an array of statuses
    const statuses = orders.map(order => ({ 
      orderId: order._id.toString(), 
      status: order.overallStatus 
    }));
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching order statuses:', error);
    res.status(500).send('Server error');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { overallStatus } = req.body;
    const orderObjectId = new mongoose.Types.ObjectId(id);
    const order = await Order.findById(orderObjectId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.overallStatus = overallStatus;
    await order.save();

    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Server error');
  }
});

router.put('/deliverPackage/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { overallStatus } = req.body;
    const orderObjectId = new mongoose.Types.ObjectId(id);
    const order = await Order.findById(orderObjectId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.overallStatus = "Delivered";
    await order.save();

    ///////////////////////////////////////////////

    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"Dujour Delivery" <sam@dujourdelivery.com>',
      to: order.customerEmail,
      subject: 'Your Order has been Delivered!',
      text: `Hello ${order.customerName},\n\nYour order has been successfully delivered. Thank you for choosing Dujour Delivery!\n\nBest Regards,\nThe Dujour Team`, // plain text body
      html: `<p>Hello <b>${order.customerName}</b>,</p><p>Your order has been successfully delivered. Thank you for choosing Dujour Delivery!</p><p>Best Regards,<br>The Dujour Team</p>` // html body
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send delivery confirmation email', error);
    }
    ///////////////////////////////////////////////
    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Server error');
  }
});

router.put('/pickupPackage/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { overallStatus } = req.body;
    const orderObjectId = new mongoose.Types.ObjectId(id);
    const order = await Order.findById(orderObjectId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.overallStatus = "Picked up by Driver";
    await order.save();

    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Server error');
  }
});

// Route to get multiple orders by IDs
router.post('/by-IDs', async (req, res) => {
  try {
    const { orderIDs } = req.body; // Expect an array of orderIDs in the request body
    const orders = await Order.find({ '_id': { $in: orderIDs } }) // Use the $in operator to find all orders with IDs in the orderIDs array
                            .populate('items.item'); // Optionally populate the 'item' field in each order's items array

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by IDs:', error);
    res.status(500).send('Server error');
  }
});


// Route to get orders for a specific user by their email
router.get('/orders-by-user', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).send('Customer email is required');
  }

  try {
    const orders = await Order.find({ customerEmail: email });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders for user:', error);
    res.status(500).send('Server error');
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
  const { orderData, paymentMethodId, amount, currency, emailHtml, return_url } = req.body;

  try {
    // Step 1: Process payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: return_url
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).send('Payment processing failed.');
    }

    // Step 2: Generate master order number and save the order
    const maxMasterOrder = await Order.findOne().sort({ masterOrderNumber: -1 }).exec();
    const maxMasterOrderNumber = maxMasterOrder ? maxMasterOrder.masterOrderNumber : 0;
    const orderStatus = 'Order Confirmed'

    const order = new Order({
      ...orderData,
      masterOrderNumber: maxMasterOrderNumber + 1,
      overallStatus: orderStatus
    });

    await order.save();

    // Step 3: Update inventory
    for (const item of order.items) {
      await AvailableItem.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );
    }

    ///////////////////////////////////////////////

    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"Dujour Delivery" <sam@dujourdelivery.com>',
      to: order.customerEmail,
      subject: 'Your Order is Confirmed',
      text: `Hello ${order.customerName},\n\nThank you for your order with Dujour Delivery! Your order has been placed successfully and will be delivered as per your request.\n\nIf you have any questions or need to adjust your order, please contact us through dujourdelivery.com.\n\nBest Regards,\nThe Dujour Team`, // plain text body
      html: `<p>Hello <b>${order.customerName}</b>,</p><p>Thank you for your order with Dujour Delivery! Your order has been placed successfully and will be delivered as per your request.</p><p>If you have any questions or need to adjust your order, please contact us through dujourdelivery.com.</p><p>Best Regards,<br>The Dujour Team</p>` // html body
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send order confirmation email', error);
    }
    ///////////////////////////////////////////////





    res.status(200).json({ order });
}
catch (error) {
  console.error("Error processing order:", error);
  return res.status(500).send('Error processing order');
}
});

module.exports = router;
