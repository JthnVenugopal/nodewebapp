
const ExcelJS = require('exceljs');
const pdf = require('pdfkit');
const streamBuffers = require('stream-buffers');








const generatePDF = (data, reportType) => {
    return new Promise((resolve, reject) => {
        const doc = new pdf();
        const writableStream = new streamBuffers.WritableStreamBuffer();

        doc.pipe(writableStream);

        // Set up page margins
        doc.page.margins = { top: 50, left: 50, bottom: 50, right: 50 };

        // Title
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('Sales Report-ElectroMart', { align: 'center' });

        // Add a horizontal line
        doc.moveDown(1).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(1); 

        // Report type and date
        const reportDate = new Date().toLocaleDateString();
        doc.fontSize(12).font('Helvetica').text(`Report Type: ${reportType} | Date: ${reportDate}`, { align: 'center' });

        doc.moveDown(2);

        // Totals Section
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Sales Count: ${data.totalSalesCount}`, { align: 'left' });
        doc.text(`Total Order Amount: INR ${formatCurrency(data.totalOrderAmount)}`, { align: 'left' });
        doc.text(`Total Discount: INR ${formatCurrency(data.totalDiscount)}`, { align: 'left' });
        doc.text(`Total Coupon Deduction: INR ${formatCurrency(data.totalCouponDeduction)}`, { align: 'left' });

        doc.moveDown(2);

        // Order Details Heading
        doc.fontSize(16).font('Helvetica-Bold').text('Order Details:', { underline: true });

        // Create a table of orders
        const tableTop = doc.y;
        const headers = ['Order ID', 'User', 'Grand Total', 'Discount', 'Final Amount', 'Payment Type', 'Order Date'];
        const tableColumnWidth = [120, 70, 80, 70, 90, 60, 60];
        const tableHeight = 40; // Row height

        // Draw table header row
        doc.fontSize(12).font('Helvetica-Bold');
        headers.forEach((header, i) => {
            const x = 50 + tableColumnWidth.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(header, x + 5, tableTop + 10, { width: tableColumnWidth[i]-10, align: 'center' });
            // Draw header cell borders
            doc.rect(x, tableTop, tableColumnWidth[i], tableHeight).stroke();
        });

        // Add horizontal line after the headers
        doc.moveDown(1);
        doc.lineWidth(0.5);
        doc.moveTo(50, tableTop + tableHeight).lineTo(550, tableTop + tableHeight).stroke();

        // Draw the order rows
        doc.fontSize(10).font('Helvetica');
        data.orders.forEach((order, index) => {
            const yPosition = tableTop + (index + 1) * tableHeight; // Spacing between rows
            headers.forEach((header, colIndex) => {
                const x = 50 + tableColumnWidth.slice(0, colIndex).reduce((a, b) => a + b, 0);
                const content =
                    header === 'Order ID' ? order.orderId :
                    header === 'User' ? order.user.name :
                    header === 'Grand Total' ? `INR ${formatCurrency(order.totalPrice)}` :
                    header === 'Discount' ? `INR ${formatCurrency(order.discount)}` :
                    header === 'Final Amount' ? `INR ${formatCurrency(order.finalAmount)}` :
                    header === 'Payment Type' ? order.paymentType :
                    new Date(order.createdOn).toLocaleDateString();

                doc.text(content, x + 5, yPosition + 10, { width: tableColumnWidth[colIndex], align: 'center' });
                // Draw cell borders
                doc.rect(x, yPosition, tableColumnWidth[colIndex], tableHeight).stroke();
            });
        });

        // Finalize PDF
        doc.end();

        writableStream.on('finish', () => {
            const filename = `sales_report_${reportType}_${reportDate.replace(/\//g, '-')}.pdf`;
            resolve({ pdfBuffer: writableStream.getContents(), filename });
        });

        writableStream.on('error', reject);
    });
};




// Helper function to format numbers in INR with commas
const formatCurrency = (amount) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};





const generateExcel = async (reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define headers
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'User', key: 'user', width: 25 },
        { header: 'Grand Total', key: 'totalPrice', width: 20 },
        { header: 'Discount', key: 'discount', width: 20 },
        { header: 'Final Amount', key: 'finalAmount', width: 20 },
        { header: 'Payment Type', key: 'paymentType', width: 20 },
        { header: 'Order Date', key: 'createdOn', width: 25 },
    ];

    // Populate data rows
    reportData.orders.forEach(order => {
        worksheet.addRow({
            orderId: order.orderId,
            user: order.user.name,
            totalPrice: order.totalPrice,
            discount: order.discount,
            finalAmount: order.finalAmount,
            paymentType: order.paymentType,
            createdOn: new Date(order.createdOn).toLocaleDateString(),
        });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.width = Math.max(column.header.length + 2, column.width);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};





module.exports = { generatePDF , generateExcel,};