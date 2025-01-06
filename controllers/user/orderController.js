const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');
const Variant = require("../../models/variantSchema");
const Wallet = require("../../models/walletSchema");
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


//////////////////////////////////////////////////////////////////////////


const getOrderDetails = async (req, res) => {
  try {
    console.log("////////////getOrderDetails////////////////");

    // Identify user from Google or session
    const user = req.user || req.session.user;
    const userId = user?.id;

    if (!userId) {
      throw new Error("User  is not logged in.");
    }

    // Fetch orders directly using userId
    const orders = await Order.find({ user: userId }).lean();

    // console.log("Orders:", JSON.stringify(orders));

    // If no orders found, render with a message
    if (!orders || orders.length === 0) {
      return res.render("orderDetails", {
        name: user.name,
        email: user.email,
        orderDetails: [],
        user,
        message: "No orders found."
      });
    }

    // Fetch product and variant details for each order
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        // console.log("Processing order:", order);

        const detailedItems = await Promise.all(
          order.orderedItems.map(async (item) => {
            // console.log("Processing item:", item);

            const product = await Product.findById(item.product).lean();
            // console.log('Fetched product for item:', item, 'Product:', product);

            if (!product) {
              console.error('Product not found for item:', item);
              return null;
            }

            const variant = await Variant.findById(product.variant).lean();
            // console.log('Fetched variant for product:', product, 'Variant:', variant);

            if (!variant) {
              console.error('Variant not found for product:', product);
              return null;
            }

            return {
              ...item,
              productDetails: product,
              variantDetails: variant, // Include variant details
            };
          })
        );

        return {
          ...order,
          orderedItems: detailedItems.filter(item => item !== null),
          deliveryAddress: order.address, // Include delivery address
          paymentMethod: order.paymentMethod // Log payment method for debugging
        };
      })
    );

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedEstimatedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-US', options);

    // Log the detailed orders for debugging
    // console.log("Order details:", JSON.stringify(detailedOrders));

    // Render data to the frontend
    res.render("orderDetails", {
      name: user.name,
      email: user.email,
      orderDetails: detailedOrders,
      user,
      estimatedDeliveryDate: formattedEstimatedDeliveryDate
    });
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).render("pageNotFound", {
      message: error.message || "Failed to fetch order details.",
    });
  }
};

//////////////////////////////////////////////////////////////////////////


const cancelOrder = async (req, res) => {
  try {
    console.log("//////////////////cancelOrder//////////////////////");

    const { orderId } = req.body;
    console.log("Order ID received for cancellation:", orderId);

    const userId = req.session.user.id || req.session.user._id;
    const orderDetails = await Order.findById(orderId)
      .populate('orderedItems.product'); // Populate product details if needed

    console.log("orderDetails----------------------", orderDetails);

    // Check if the order exists
    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order is already cancelled
    if (orderDetails.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Process refund
    const wallet = await Wallet.findOne({ userId: req.session.user.id }).exec();
    console.log("wallet data----------------------", wallet);

    // Check if the wallet exists
    if (!wallet || wallet === undefined) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Refund logic based on payment method
    const refundAmount = orderDetails.totalPrice;
    if (orderDetails.paymentMethod === 'razorpay' || orderDetails.paymentMethod === 'wallet') {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for cancelled order (${orderDetails.paymentMethod})`,
        transactionId: orderId
      });
      console.log(`Refund processed successfully to wallet (${orderDetails.paymentMethod}):`, refundAmount);
    }

    await wallet.save();

    // Update order status to 'Cancelled'
    orderDetails.status = 'Cancelled';
    await orderDetails.save();

    const { orderedItems } = orderDetails;
    console.log("Ordered Items:", orderedItems);

    // Fetch product and variant data for each ordered item using forEach
    await Promise.all(orderedItems.map(async (item) => {
      const productId = item.product;
      const productData = await Product.findById(productId).populate('variant');

      if (productData && productData.variant) {
        const variantId = productData.variant._id;
        const variantData = await Variant.findById(variantId);
        if (variantData) {
          console.log(`Current Variant Quantity for ${productData.productName}:`, variantData.quantity);
          variantData.quantity += item.quantity;
          console.log(`Updated Variant Quantity for ${productData.productName}:`, variantData.quantity);

          // Save the updated variant data
          await variantData.save();
          console.log(`Variant Data saved for ${productData.productName}`);
        } else {
          console.error(`Variant not found for product ${productId}`);
        }
      } else {
        console.error(`Product or Variant not found for product ${productId}`);
      }
    }));

    console.log("Order cancelled successfully:", orderId);

    return res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};


//////////////////////////////////////////////////////////////////////////



const getSingleOrderDetails = async (req, res) => {
  try {
    console.log("//////////////////getSingleOrderDetails//////////////////////");

    const orderId = req.params.orderId;
    console.log("orderId----------------------", orderId);

    if (!orderId) {
      return res.status(400).render('error', { message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('orderedItems.product');

    const orderedItems = order.orderedItems.map(item => {

      const { product, quantity, price } = item;
      const { productName, variant } = product;

      return {
        productName,
        quantity,
        price,
        variant,
        product,

      }
    });
    // console.log("orderItems----------------------", orderedItems);
    
    const variantIds = orderedItems.map(item => item.variant);

    const variants = await Variant.find({ _id: { $in: variantIds } });

    // console.log("variants----------------------", variants);
   

    
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }

    

    // Calculate or fetch the estimated delivery date
    const estimatedDeliveryDate = calculateEstimatedDeliveryDate(order.createdAt);

    res.render('singleOrderDetails', {
      user : req.user || req.session.user,
      orderId : orderId,
      orderData : order,
      order: order.orderedItems,
      totalPrice: order.totalPrice,
      address: order.address,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      estimatedDeliveryDate ,
      variants : variants,

    });
  } catch (error) {
    console.log('Error fetching order details:', error);
    res.status(500).render('pageNotFound', { message: 'An error occurred while fetching the order details' });
  }
};

// Example function to calculate estimated delivery date
const calculateEstimatedDeliveryDate = (createdAt) => {
  const estimatedDays = 7; // Example: 7 days for delivery
  const deliveryDate = new Date(createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
  return deliveryDate.toDateString(); // Format as needed
};




//////////////////////////////////////////////////////////////////////////


  const downloadInvoice = async (req, res) => {


    console.log('------------downloadInvoice-------------');
    try {
        const { orderId } = req.params;

        const userId = req.session.user.id;
        if (!userId) return res.redirect('/login');

        const userData = await User.findById(userId).populate({
            path: 'orderHistory',
            populate: { path: 'orderedItems.product', model: 'Product' },
        });

        const orderDetails = await Order.find({orderId : orderId})
            .populate({
                path: 'orderedItems.product',
                select: 'productName regularPrice salePrice',
            });

            console.log("orderDetails/////////////////"+orderDetails);

            console.log("orderDetails/////////////////"+orderDetails);


        if (!userData) return res.redirect('/login');

        const order = userData.orderHistory.find(o => o.orderId === orderId);
        if (!order) return res.status(404).send('Order not found');

        const invoicesDir = path.join(__dirname, '../invoices');
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

        const filePath = path.join(invoicesDir, `invoice-${orderId}.pdf`);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        const currentDate = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(currentDate);
        const formattedTime = new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(currentDate);

        doc.fontSize(18).text('Tax Invoice', { align: 'center', underline: true });
        doc.fontSize(14).text('BuyHive', { align: 'center' });
        doc.moveDown(2);
        doc.moveTo(50, 105).lineTo(550, 105).stroke();

        const leftColumnX = 50;
        const rightColumnX = 300;
        const startY = 120;

        doc.fontSize(10).text('Sold by:', leftColumnX, startY, { underline: true });
        doc.text('BuyHive No 6', leftColumnX, startY + 15);
        doc.text('India', leftColumnX, startY + 30);
        doc.text('Pin: 688888', leftColumnX, startY + 45);

        doc.fontSize(10).text(`Order ID: ${order.orderId.slice(-12)}`, rightColumnX, startY);
        doc.text(`Invoice No: ${Math.random().toString(36).substring(2, 10)}`, rightColumnX, startY + 15);
        doc.text(`Order Date: ${formattedDate}, ${formattedTime}`, rightColumnX, startY + 30);
        doc.text(`Invoice Date: ${formattedDate}, ${formattedTime}`, rightColumnX, startY + 45);
        doc.text(`Payment Method: ${order.paymentMethod}`, rightColumnX, startY + 60);

        doc.moveTo(50, startY + 80).lineTo(550, startY + 80).stroke();

        const shippingAddressY = startY + 100;
        doc.fontSize(10).text('Shipping Address:', leftColumnX, shippingAddressY, { underline: true });
        doc.text(userData.name, leftColumnX, shippingAddressY + 15);
        doc.text(order.address.house, leftColumnX, shippingAddressY + 30);
        doc.text(`${order.address.state}, ${order.address.city}, ${order.address.landMark}`, leftColumnX, shippingAddressY + 45);
        doc.text(`Pin: ${order.address.pincode}`, leftColumnX, shippingAddressY + 60);
        doc.text(`Phone: ${order.address.phone}`, leftColumnX, shippingAddressY + 75);
        doc.moveDown(2);

        const tableTop = shippingAddressY + 110;
        let currentRow = tableTop + 25;
        doc.text('Product Name', 50, currentRow);
        doc.text('Quantity', 200, currentRow);
        doc.text('Regular Price', 250, currentRow);
        doc.text('Sale Price', 340, currentRow);
        doc.text('Discount', 400, currentRow);
        doc.text('Total', 500, currentRow);

        currentRow += 20;
        doc.moveTo(50, currentRow - 2).lineTo(550, currentRow - 2).stroke();
        doc.moveDown();
        doc.font('Helvetica').fontSize(10);
        order.orderedItems.forEach(item => {
            const product = item.product || {};
            const productName = product.productName || 'Unknown Product';
            const regularPrice = product.regularPrice || 0;
            const salePrice = product.salePrice || 0;
            const quantity = item.quantity || 0;
            const amount = salePrice * quantity; 
            const discount = (regularPrice - salePrice) * quantity; 

            doc.text(productName, 50, currentRow, { width: 150, ellipsis: true });
            doc.text(quantity, 216, currentRow);
            doc.text(regularPrice.toFixed(2), 250, currentRow);
            doc.text(salePrice.toFixed(2), 340, currentRow);
            doc.text(discount.toFixed(2), 400, currentRow);
            doc.text(amount.toFixed(2), 500, currentRow);

            currentRow += 30;
        });

        doc.moveTo(50, currentRow + 5).lineTo(550, currentRow + 5).stroke();

        const totalY = currentRow + 15;
        doc.font('Helvetica-Bold').fontSize(12);

        if (order.couponApplied) {
            const discountAmount = order.totalPrice - order.finalAmount;
            doc.text('Coupon Applied:', 350, totalY);
            doc.text(`-  ${(discountAmount).toFixed(2)}`, 450, totalY);
            doc.moveDown();
            doc.text('Total Amount:', 350, totalY + 20);
            doc.text(` ${(order.finalAmount).toFixed(2)}`, 450, totalY + 20);
        } else {
            doc.text('Total Amount:', 350, totalY);
            doc.text(` ${(order.finalAmount).toFixed(2)}`, 450, totalY);
        }

        // const totalY = currentRow + 15;
        // doc.font('Helvetica-Bold').fontSize(12);
        // doc.text('Total Amount:', 350, totalY);
        // doc.text(`₹ ${(order.finalAmount).toFixed(2)}`, 450, totalY);

        doc.moveDown();
        doc.text('All values are in INR ₹', 50, 600);
        doc.moveDown(3);
        doc.text('Thank you for shopping with us!',{align : "center"});
      
        doc.fontSize(5).text("*ASSPL-BuyHive Seller Services Pvt. Ltd., ARIPL-Sole Retail India Pvt. Ltd. only where Sole Heaven Retail India Pvt. Ltd. fulfillment center is co-located Customers desirous of availing input GST credit are requested to create a Business account and purchase on SoleHeaven.in/business from Business eligible offers Please note that this invoice is not a demand for payment",{align : "center"})
      
        doc.end();

        stream.on('finish', () => {
            res.download(filePath, `invoice-${orderId}.pdf`, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error downloading invoice');
                }
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete file:', err);
                });
            });
        });

        stream.on('error', (err) => {
            console.error('Stream Error:', err);
            res.status(500).send('Failed to generate invoice');
        });

        console.log("Invoice downloaded//////////////////");
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


//////////////////////////////////////////////////////////////////////////

module.exports = {
  getOrderDetails,
  cancelOrder,
  getSingleOrderDetails,
  downloadInvoice,

}