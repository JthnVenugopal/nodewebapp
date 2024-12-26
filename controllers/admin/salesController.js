const Order = require('../../models/orderSchema');
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const Wallet = require('../../models/walletSchema');

const ExcelJS  = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');


/////////////////////////////////////////////////////////////////

const getSalesPage = async (req, res) => {
  try {
      const recentSales = await Order.find()
          .sort({ createdOn: -1 })
          .limit(10)
          .select('orderId finalAmount discount couponApplied createdOn');

      const totalSalesCount = recentSales.length;
      const overallOrderAmount = recentSales.reduce((sum, order) => sum + order.finalAmount, 0);
      const totalDiscount = recentSales.reduce((sum, order) => sum + (order.discount || 0), 0);
      const couponsDeduction = recentSales.filter(order => order.couponApplied).length;
      const today = new Date().toISOString().split('T')[0];

      res.render('sales', {
          recentSales,
          totalSalesCount,
          overallOrderAmount,
          totalDiscount,
          couponsDeduction,
          startDate: today,
          endDate: today
      });
  } catch (error) {
      console.error("Error fetching sales data:", error.message);
      res.status(500).send("Internal Server Error");
  }
};

//////////////////////////////////////////////////////////////

const applyFilter = async (req, res) => {
  try {
      const { startDate, endDate, presetRange } = req.query;

      let filter = {};
      const today = new Date();


      let filterStartDate = startDate || today.toISOString().split('T')[0];
      let filterEndDate = endDate || today.toISOString().split('T')[0];

      if (startDate && endDate) {
          filter.createdOn = {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          };
      } else if (presetRange) {
          switch (presetRange) {
              case '1-day':
                  filter.createdOn = {
                      $gte: new Date(today.setDate(today.getDate() - 1)),
                      $lte: new Date(),
                  };
                  break;
              case '7-days':
                  filter.createdOn = {
                      $gte: new Date(today.setDate(today.getDate() - 7)),
                      $lte: new Date(),
                  };
                  break;
              case '1-month':
                  filter.createdOn = {
                      $gte: new Date(today.setMonth(today.getMonth() - 1)),
                      $lte: new Date(),
                  };
                  break;
              default:
                  break;
          }
      }

      const filteredSales = await Order.find(filter)
          .sort({ createdOn: -1 })
          .select('orderId finalAmount discount couponApplied createdOn');

      const totalSalesCount = filteredSales.length;
      const overallOrderAmount = filteredSales.reduce((sum, order) => sum + order.finalAmount, 0);
      const totalDiscount = filteredSales.reduce((sum, order) => sum + (order.discount || 0), 0);
      const couponsDeduction = filteredSales.filter(order => order.couponApplied).length;

      console.log('filterdSales :', filteredSales)

      res.render('sales', {
          startDate: filterStartDate,
          endDate: filterEndDate,
          recentSales: filteredSales,
          totalSalesCount,
          overallOrderAmount,
          totalDiscount,
          couponsDeduction,
      });
  } catch (error) {
      console.error("Error applying filter:", error.message);
      res.status(500).send("Internal Server Error");
  }
};


const calculateStats = async (startDate, endDate) => {
  try {
      const orders = await Order.find({
          createdOn : { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      console.log(`Found ${orders.length} orders between ${startDate} and ${endDate}`);

      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'Delivered').length;
      const cancelledOrders = orders.filter(order => order.status === 'Canceled').length;
      const returnedOrders = orders.filter(order => order.status === 'Returned').length;
      const totalOrdersWithCoupon = orders.filter(order => order.couponApplied).length;

      return {
          totalOrders,
          completedOrders,
          cancelledOrders,
          returnedOrders,
          totalOrdersWithCoupon
      };
  } catch (error) {
      console.error('Error calculating stats:', error);
      throw new Error('Error calculating stats');
  }
};


///////////////////////////////////////////////////////////////

const downloadSalesPDF = async (req, res) => {
  try {
      const { dateFilter, startDate, endDate } = req.query;

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);


      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);

      const orders = await Order.find({
          createdOn: { $gte: start, $lte: end },
      }).populate('orderedItems.product');
      
      console.log(orders);


      await generatePDF(res, orders, dateFilter, start, end);

  } catch (error) {
      console.error('Error generating sales PDF:', error);
      res.status(500).send('Error generating PDF');
  }
};

const generatePDF = async (res, orders, dateFilter, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 10, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFilter}.pdf`);

  doc.pipe(res);

  const itemsPerPage = 7;
  let currentPage = 1;
  let itemsOnCurrentPage = 0;

  let totalRegularPrice = 0;
  let totalSaledPrice = 0;
  let totalQuantity = 0;
  let totalDiscount = 0;
  let totalNetPrice = 0;
  let totalReturnedAmount = 0;

  let fixedY = 230;

  const stats = await calculateStats(startDate, endDate);

  const addHeader = (includeSummary) => {
      doc.fontSize(16).text('Sales Report - Sole Heaven IN', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      if (includeSummary) {
          doc.fontSize(12).text('Sales Summary');
          doc.moveDown();
          doc.fontSize(10)
              .text(`Total Item Ordered: ${stats.totalOrders}`)
              .text(`Payment Completed: ${stats.completedOrders}`)
              .text(`Cancelled Orders: ${stats.cancelledOrders}`)
              .text(`Returned Orders: ${stats.returnedOrders}`)
              .text(`Total Coupon Applied: ${stats.totalOrdersWithCoupon}`);
          doc.moveDown();
      }

      doc.fontSize(16).text('Sales Report (payment completed)', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text('SI', 30, 200, { continued: false, width: 10 });
      doc.text('Order ID', 60, 200, { continued: false, width: 60 });
      doc.text('Date', 140, 200, { continued: false, width: 60 });
      doc.text('Product', 220, 200, { continued: false, width: 60 });
      doc.text('Name', 290, 200, { continued: false, width: 60 });
      doc.text('Color', 380, 200, { continued: false, width: 60 });
      doc.text('Regular Price', 430, 200, { continued: false, width: 60 });
      doc.text('Saled Price', 500, 200, { continued: false, width: 60 });
      doc.text('Quantity', 570, 200, { continued: false, width: 60 });
      doc.text('Order Status', 620, 200, { continued: false, width: 60 });
      doc.text('Discount', 690, 200, { continued: false, width: 60 });
      doc.text('Net Price', 750, 200, { width: 60 });
      doc.moveDown();
  };

  const resetPageTotals = () => {
      totalRegularPrice = 0;
      totalSaledPrice = 0;
      totalQuantity = 0;
      totalDiscount = 0;
      totalNetPrice = 0;
      totalReturnedAmount = 0;
  };

  addHeader(true);

  let si = 1;
  let grandTotalRegularPrice = 0;
  let grandTotalSaledPrice = 0;
  let grandTotalQuantity = 0;
  let grandTotalDiscount = 0;
  let grandTotalNetPrice = 0;
  let grandTotalReturnedAmount = 0;

  const ordersWithProducts = await Order.find({
      'invoiceDate': { $gte: startDate, $lte: endDate }
  })
      .populate('orderedItems.product')
      .exec();

  ordersWithProducts.forEach((order, orderIndex) => {
      order.orderedItems.forEach((item, itemIndex) => {
          if (itemsOnCurrentPage === itemsPerPage) {
              doc.addPage();
              currentPage++;
              itemsOnCurrentPage = 0;
              resetPageTotals();

              fixedY = 80;
          }

          const regularPrice = item.product.regularPrice * item.quantity;
          const saledPrice = item.price * item.quantity;
          const discount = (item.product.regularPrice - item.product.salePrice) * item.quantity;
          const netPrice = saledPrice;

          const paymentStatus = Array.isArray(order.payment) 
              ? order.payment.find(payment => payment.status === 'completed')?.status || 'N/A'
              : 'N/A';

          doc.fontSize(8)
              .text(si++, 30, fixedY, { continued: false, width: 10 })
              .text(order.orderId?.toString().slice(-6) || 'N/A', 60, fixedY, { continued: false, width: 60 })
              .text(order.createdOn ? order.createdOn.toLocaleString() : 'N/A', 140, fixedY, { continued: false, width: 60 })
              .text(item.product.productName || 'N/A', 220, fixedY, { continued: false, width: 60 })
              .text(order.address.name.toString() || 'N/A', 290, fixedY, { continued: false, width: 60 })
              .text(item.product.color || 'N/A', 380, fixedY, { continued: false, width: 60 })
              .text(regularPrice.toFixed(2), 430, fixedY, { continued: false, width: 60 })
              .text(saledPrice.toFixed(2), 500, fixedY, { continued: false, width: 60 })
              .text((item.quantity || 0).toString(), 570, fixedY, { continued: false, width: 60 })
              .text(order.status, 620, fixedY, { continued: false, width: 60 })
              .text(discount.toFixed(2), 690, fixedY, { continued: false, width: 60 })
              .text(netPrice.toFixed(2), 750, fixedY, { width: 60 });

          totalRegularPrice += regularPrice;
          totalSaledPrice += saledPrice;
          totalQuantity += item.quantity || 0;
          totalDiscount += discount;
          totalNetPrice += netPrice;

          grandTotalRegularPrice += regularPrice;
          grandTotalSaledPrice += saledPrice;
          grandTotalQuantity += item.quantity || 0;
          grandTotalDiscount += discount;
          grandTotalNetPrice += netPrice;

          if (order.status === "Returned" || order.status === "Canceled") {
              totalReturnedAmount += netPrice;
              grandTotalReturnedAmount += netPrice;
          }

          itemsOnCurrentPage++;
          fixedY += 50;

          if (orderIndex === ordersWithProducts.length - 1 && itemIndex === order.orderedItems.length - 1) {
              doc.fontSize(12).fillColor('black').text("Summary Totals:", 600, fixedY, { bold: true });
              fixedY += 20;

              doc.fontSize(10).text("Returned Total:", 600, fixedY, { continued: false, width: 100 });
              doc.text(grandTotalReturnedAmount.toFixed(2), 750, fixedY, { width: 60 });
              
              doc.fontSize(10).text("Total Regular Price:", 600, fixedY += 15, { continued: false, width: 120 });
              doc.text(grandTotalRegularPrice.toFixed(2), 750, fixedY, { width: 60 });

              doc.fontSize(10).text("Total Saled Price:", 600, fixedY += 15, { continued: false, width: 120 });
              doc.text(grandTotalSaledPrice.toFixed(2), 750, fixedY, { width: 60 });

              doc.fontSize(10).text("Total Quantity:", 600, fixedY += 15, { continued: false, width: 120 });
              doc.text(grandTotalQuantity.toFixed(2), 750, fixedY, { width: 60 });

              doc.fontSize(10).text("Total Discount:", 600, fixedY += 15, { continued: false, width: 120 });
              doc.text(grandTotalDiscount.toFixed(2), 750, fixedY, { width: 60 });

              doc.fontSize(12).text('Net Total:', 600, fixedY += 30, { bold: true });
              doc.text((grandTotalNetPrice - grandTotalReturnedAmount).toFixed(2), 750, fixedY, {bold: true, width: 60 });

          }
      });
  });

  doc.end();
};


///////////////////////////////////////////////////////////////

const downloadSalesExcel = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      console.log(start, end)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).send('Invalid date format. Please provide valid startDate and endDate.');
      }

      const orders = await Order.find({
          createdOn: { $gte: start, $lte: end },
      }).populate('orderedItems.product');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
          { header: 'SI', key: 'si', width: 10 },
          { header: 'Order ID', key: 'orderId', width: 20 },
          { header: 'Date', key: 'date', width: 20 },
          { header: 'Product', key: 'product', width: 30 },
          { header: 'SKU', key: 'sku', width: 20 },
          { header: 'Color', key: 'color', width: 15 },
          { header: 'Regular Price', key: 'regularPrice', width: 15 },
          { header: 'Sale Price', key: 'salePrice', width: 15 },
          { header: 'Quantity', key: 'quantity', width: 10 },
          { header: 'Order Status', key: 'status', width: 15 },
          { header: 'Discount', key: 'discount', width: 15 },
          { header: 'Net Price', key: 'netPrice', width: 15 },
      ];

      let si = 1;

      orders.forEach(order => {
          order.orderedItems.forEach(item => {
              const regularPrice = item.product.regularPrice * item.quantity;
              const salePrice = item.price * item.quantity;
              const discount = (item.product.regularPrice - item.product.salePrice) * item.quantity;
              const netPrice = salePrice;

              const row = worksheet.addRow({
                  si: si++,
                  orderId: order.orderId?.toString().slice(-6) || 'N/A',
                  date: order.createdOn ? order.createdOn.toLocaleString() : 'N/A',
                  product: item.product.productName || 'N/A',
                  sku: item.product._id.toString().slice(-6) || 'N/A',
                  color: item.product.color || 'N/A',
                  regularPrice: regularPrice.toFixed(2),
                  salePrice: salePrice.toFixed(2),
                  quantity: item.quantity || 0,
                  status: order.status || 'N/A',
                  discount: discount.toFixed(2),
                  netPrice: netPrice.toFixed(2),
              });
              row.eachCell(cell => {
                  cell.alignment = { vertical: 'middle', horizontal: 'center' };
              });
          });
      });

      worksheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
      });

      res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
          'Content-Disposition',
          `attachment; filename=sales-report-${startDate}-to-${endDate}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send('Error generating Excel file');
  }
};


///////////////////////////////////////////////////////////////


module.exports = {
  getSalesPage,
  applyFilter,
  downloadSalesPDF,
  downloadSalesExcel,
};