const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const AvailableItem = require('../models/Item');
const nodemailer = require('nodemailer');
const stripe = require('stripe')('your-stripe-secret-key'); // Make sure to replace 'your-stripe-secret-key' with your actual Stripe secret key
const Farm = require('../models/Farm');
const mongoose = require('mongoose');

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

        // Debug logging to check each item and farm details
        //console.log("Order Item: ", JSON.stringify(orderItem, null, 2));
       // console.log("Item: ", JSON.stringify(item, null, 2));
        //console.log("Farm: ", JSON.stringify(farm, null, 2));

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

    //console.log("Detailed Orders: ", JSON.stringify(detailedOrders, null, 2)); // Log the detailed orders

    res.json(detailedOrders);
  } catch (error) {
    console.error('Error fetching detailed orders:', error);
    res.status(500).send('Server error');
  }
});



// Get all orders
router.get('/', async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find().exec();

    // For each order, fetch the corresponding items
    for (let order of orders) {
      for (let item of order.items) {
        const itemDetails = await AvailableItem.findById(item._id);
        item.item = itemDetails; // Replace the item ID with the full item details
      }
    }

    // Log the populated orders to verify the results
    console.log('Populated Orders:', JSON.stringify(orders, null, 2));

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
    console.log(id)
    console.log(overallStatus)
    console.log("Type of orderId:", typeof id); // Print out the type of userId

    const orderObjectId = new mongoose.Types.ObjectId(id);
    console.log("Converted userId to ObjectId:", orderObjectId);


    const order = await Order.findById(orderObjectId);
    console.log("----")
    console.log(order)
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
    console.log(id)
    console.log("Type of orderId:", typeof id); // Print out the type of userId

    const orderObjectId = new mongoose.Types.ObjectId(id);
    console.log("Converted userId to ObjectId:", orderObjectId);


    const order = await Order.findById(orderObjectId);
    console.log("----")
    console.log(order)
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.overallStatus = "Delivered";
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

    // Step 4: Send confirmation email
   // await sendOrderEmail(order.customerEmail, 'Your Order Summary', emailHtml);

    res.status(200).json({ order });
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
