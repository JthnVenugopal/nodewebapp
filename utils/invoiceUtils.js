const PDFDocument = require("pdfkit");
const Order = require('../models/orderSchema');
const Address = require('../models/addressSchema')
const User = require('../models/userSchema')




function generateHeader(doc) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("ElectroMart", { align: "center" }) // Center the heading
        .fontSize(10)
        .text("ElectroMart Inc.", 200, 65, { align: "right" })
        .text("Trivandrum, Kerala, India", 200, 80, { align: "right" })
        .moveDown();
}

function generateFooter(doc) {
    doc.fontSize(10).text("Thank You for shopping with us!", 50, 750, {
        align: "center",
        width: 500,
    });
}

async function generateCustomerInformation(doc, orderData) {
    const addressData = orderData.address;

    if (addressData) {
        let selectedAddress = addressData;

        doc
            .fontSize(12)
            .text(`Order ID: ${orderData.orderid}`, 50, 100)
            .text(`Order Date: ${new Date(orderData.createdOn).toLocaleDateString()}`, 50, 115)
            .text(`Total Price: \u20B9${orderData.totalPrice}`, 50, 130)
            .text(`Discount: \u20B9${orderData.discount}`, 50, 145)
            .text(`Final Amount: \u20B9${orderData.finalAmount}`, 50, 160)
            .moveDown()
            .text("Shipping Address:", 50, 200)
            .text(
                `${selectedAddress.addressType}`,
                50,
                215
            )
            .text(`${selectedAddress.name}`, 50, 230)
            .text(`${selectedAddress.landMark}`, 50, 245)
            .text(`${selectedAddress.city},${selectedAddress.state}-${selectedAddress.pincode}`, 50, 260)
            .text(`Phone: ${selectedAddress.phone}`, 50, 275)
            
    } else {
        doc.text("Address data is missing or incorrect.", 50, 200);
    }
}

function generateBody(doc, orderData) {
    const startY = 310; // Adjust the starting position for the table
    const tableWidth = 510; // Width of the table
    const rowHeight = 20; // Height of each row
    const tableX = 50; // X-position for the table

    // Draw table border
    doc
        .rect(tableX, startY, tableWidth, rowHeight * (orderData.orderedItems.length + 2))
        .stroke();

    // Table headers
    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Product", tableX + 10, startY + 5)
        .text("Quantity", tableX + 200, startY + 5)
        .text("Price", tableX + 400, startY + 5, { align: "right" });

    // Table rows
    orderData.orderedItems.forEach((item, index) => {
        const currentY = startY + rowHeight * (index + 1);

        doc
            .font("Helvetica")
            .fontSize(10)
            .text(item.product.productName, tableX + 10, currentY + 5)
            .text(item.quantity.toString(), tableX + 200, currentY + 5)
            .text(`\u20B9${item.price}`, tableX + 400, currentY + 5, { align: "right" });
    });

    // Total row
    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total:", tableX + 300, startY + rowHeight * (orderData.orderedItems.length + 1) + 5)
        .text(`\u20B9${orderData.totalPrice}`, tableX + 400, startY + rowHeight * (orderData.orderedItems.length + 1) + 5, { align: "right" });
}

function generateInvoicePDF(writeStream, endStream, orderData) {
    const doc = new PDFDocument({ size: "A4",margin: 50 });

    doc.on("data", writeStream);
    doc.on("end", endStream);

    generateHeader(doc);
    generateCustomerInformation(doc, orderData);
    generateBody(doc, orderData);
    generateFooter(doc);

    doc.end();
}









module.exports = {
    generateInvoicePDF,
};