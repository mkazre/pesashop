const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

class PDFService {
  // Generate waybill PDF
  async generateWaybillPDF(waybillData) {
    const { waybill, order, customer, company } = waybillData;

    // Currency formatting
    const currencyCode = order?.currency || 'ZAR';
    const exchangeRate = order?.exchangeRate || 1;
    const formatPrice = (zarAmount) => {
      const converted = (zarAmount || 0) / (exchangeRate || 1);
      try {
        return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 }).format(converted);
      } catch {
        return `${currencyCode} ${converted.toFixed(2)}`;
      }
    };
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Create file path
    const filename = `waybill-${waybill.waybillNumber}.pdf`;
    const filepath = path.join(__dirname, '..', 'uploads', 'waybills', filename);
    
    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    // Pipe to file
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Add company logo if exists
    if (company.logo) {
      try { doc.image(company.logo, 50, 50, { width: 150 }); } catch (e) { /* skip logo */ }
    }

    // Company details
    doc.fontSize(10)
       .text(company.name || 'PesaShop', 400, 50, { align: 'right' })
       .text(company.address || '', 400, 65, { align: 'right' })
       .text(company.phone || '', 400, 80, { align: 'right' })
       .text(company.email || '', 400, 95, { align: 'right' });

    // Title
    doc.fontSize(24)
       .text('WAYBILL', 50, 150, { align: 'center' });

    // Waybill number
    doc.fontSize(14)
       .text(`Waybill #: ${waybill.waybillNumber}`, 50, 190);

    // Generate barcode
    try {
      const barcodeBuffer = await this.generateBarcode(waybill.waybillNumber);
      doc.image(barcodeBuffer, 350, 180, { width: 200, height: 60 });
    } catch (e) {
      doc.fontSize(10).text(waybill.waybillNumber, 350, 190);
    }

    // Order details
    const orderNumber = order?.orderNumber || 'N/A';
    doc.fontSize(12)
       .text(`Order #: ${orderNumber}`, 50, 260)
       .text(`Date: ${new Date(waybill.createdAt).toLocaleDateString()}`, 50, 280)
       .text(`Time: ${new Date(waybill.createdAt).toLocaleTimeString()}`, 50, 300);

    // Shipping type
    doc.fontSize(14)
       .text(`Shipping Type: ${waybill.shippingType === 'HUB_COLLECTION' ? 'Hub Collection' : 'Direct Delivery'}`, 50, 340);

    // Customer details
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
    const customerEmail = customer?.email || 'N/A';
    const customerPhone = customer?.phone || 'N/A';
    doc.fontSize(12)
       .text('CUSTOMER DETAILS', 50, 380)
       .fontSize(10)
       .text(`Name: ${customerName}`, 50, 400)
       .text(`Email: ${customerEmail}`, 50, 415)
       .text(`Phone: ${customerPhone}`, 50, 430);

    // Shipping address or hub details
    if (waybill.shippingType === 'HUB_COLLECTION' && waybill.hubLocation) {
      doc.fontSize(12)
         .text('COLLECTION HUB', 300, 380)
         .fontSize(10)
         .text(`Hub: ${waybill.hubLocation.name || 'N/A'}`, 300, 400)
         .text(`Address: ${waybill.hubLocation.address || 'N/A'}`, 300, 415)
         .text(`City: ${waybill.hubLocation.city || 'N/A'}`, 300, 430)
         .text(`Phone: ${waybill.hubLocation.phone || 'N/A'}`, 300, 445);
    } else if (order?.shippingAddress) {
      const address = order.shippingAddress;
      doc.fontSize(12)
         .text('DELIVERY ADDRESS', 300, 380)
         .fontSize(10)
         .text(`${address.street || ''}`, 300, 400)
         .text(`${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`, 300, 415)
         .text(`${address.country || ''}`, 300, 430);
    } else {
      doc.fontSize(12)
         .text('DELIVERY ADDRESS', 300, 380)
         .fontSize(10)
         .text('Address not available', 300, 400);
    }

    // Order items
    doc.fontSize(12)
       .text('ORDER ITEMS', 50, 480);

    let yPosition = 500;
    doc.fontSize(10);

    // Table header
    doc.text('Item', 50, yPosition)
       .text('SKU', 200, yPosition)
       .text('Qty', 350, yPosition)
       .text('Price', 400, yPosition)
       .text('Total', 450, yPosition);

    yPosition += 20;

    // Table rows
    if (order?.items) {
      order.items.forEach(item => {
        doc.text(item.name, 50, yPosition, { width: 140, ellipsis: true })
           .text(item.sku || 'N/A', 200, yPosition)
           .text(item.quantity.toString(), 350, yPosition)
           .text(formatPrice(item.price), 400, yPosition)
           .text(formatPrice(item.total), 450, yPosition);
        yPosition += 20;
      });
    }

    // Total
    doc.fontSize(12)
       .text(`Total: ${formatPrice(order?.total)}`, 450, yPosition + 10);

    // Footer
    const createdByName = waybill.createdBy?.name || 'System';
    doc.fontSize(8)
       .text(`Created by: ${createdByName}`, 50, 700)
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, 715);

    // Finalize PDF and wait for write to complete
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return `/uploads/waybills/${filename}`;
  }

  // Generate POD PDF
  async generatePODPDF(podData) {
    const { pod, waybill, order, customer, company } = podData;
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Create file path
    const filename = `pod-${waybill.waybillNumber}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '..', 'uploads', 'pod', filename);
    
    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    // Pipe to file
    doc.pipe(fs.createWriteStream(filepath));

    // Add company logo if exists
    if (company.logo) {
      doc.image(company.logo, 50, 50, { width: 150 });
    }

    // Title
    doc.fontSize(24)
       .text('PROOF OF DELIVERY', 50, 150, { align: 'center' });

    // Waybill and order details
    doc.fontSize(12)
       .text(`Waybill #: ${waybill.waybillNumber}`, 50, 200)
       .text(`Order #: ${order.orderNumber}`, 50, 220)
       .text(`Delivery Date: ${new Date(pod.createdAt).toLocaleDateString()}`, 50, 240)
       .text(`Delivery Time: ${new Date(pod.createdAt).toLocaleTimeString()}`, 50, 260);

    // Recipient details
    doc.fontSize(14)
       .text('RECIPIENT INFORMATION', 50, 300)
       .fontSize(10)
       .text(`Name: ${pod.recipient.name}`, 50, 320)
       .text(`ID Number: ${pod.recipient.idNumber || 'N/A'}`, 50, 335)
       .text(`Relationship: ${pod.recipient.relationship || 'N/A'}`, 50, 350)
       .text(`Phone: ${pod.recipient.phone || 'N/A'}`, 50, 365);

    // Delivery location
    doc.fontSize(14)
       .text('DELIVERY LOCATION', 300, 300)
       .fontSize(10)
       .text(`Type: ${pod.location.type}`, 300, 320)
       .text(`Address: ${pod.location.address || 'N/A'}`, 300, 335);

    // Order summary
    doc.fontSize(14)
       .text('ORDER SUMMARY', 50, 400)
       .fontSize(10);

    let yPosition = 420;
    order.items.forEach(item => {
      doc.text(`${item.quantity}x ${item.name}`, 50, yPosition);
      yPosition += 15;
    });

    // Pre-shipment photos note
    if (pod.preShipmentPhotos && pod.preShipmentPhotos.length > 0) {
      doc.fontSize(10)
         .text(`${pod.preShipmentPhotos.length} pre-shipment photos available`, 50, yPosition + 20);
    }

    // Signature
    doc.fontSize(14)
       .text('RECIPIENT SIGNATURE', 50, 520);

    // Add signature image
    if (pod.signature && pod.signature.imageData) {
      const signatureBuffer = Buffer.from(pod.signature.imageData.split(',')[1], 'base64');
      doc.image(signatureBuffer, 50, 540, { width: 200, height: 80 });
    }

    doc.fontSize(10)
       .text(`Signed at: ${new Date(pod.signature.signedAt).toLocaleString()}`, 50, 630);

    // Staff details
    doc.fontSize(10)
       .text(`Processed by: ${pod.processedBy.name || 'Staff Member'}`, 300, 540)
       .text(`Staff ID: ${pod.processedBy._id}`, 300, 555);

    // Footer
    doc.fontSize(8)
       .text('This document serves as proof of delivery for the above mentioned items.', 50, 700, { align: 'center' })
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, 715, { align: 'center' });

    // Finalize PDF
    doc.end();

    return `/uploads/pod/${filename}`;
  }

  // Generate barcode
  async generateBarcode(data) {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'code128',
        text: data,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      }, (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      });
    });
  }

  // Generate QR code
  async generateQRCode(data) {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'qrcode',
        text: data,
        scale: 3,
        height: 10,
        includetext: false
      }, (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      });
    });
  }
}

module.exports = new PDFService();
