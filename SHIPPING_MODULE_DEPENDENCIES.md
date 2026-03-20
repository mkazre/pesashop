# Shipping Module Dependencies

## Backend Dependencies

Add these dependencies to your backend package.json:

```bash
cd backend
npm install pdfkit bwip-js multer
```

### Required packages:
- `pdfkit` - For generating PDF documents (waybills and POD)
- `bwip-js` - For generating barcodes and QR codes
- `multer` - For handling file uploads (already installed)

## Admin Panel Dependencies

Add these dependencies to your admin-panel package.json:

```bash
cd admin-panel
npm install html5-qrcode react-signature-canvas react-barcode
```

### Required packages:
- `html5-qrcode` - For camera-based barcode/QR code scanning
- `react-signature-canvas` - For capturing digital signatures
- `react-barcode` - For displaying barcodes in the UI

## Frontend Dependencies

The frontend already has all required dependencies (react-query, date-fns, lucide-react).

## Installation Instructions

1. **Backend Setup:**
   ```bash
   cd backend
   npm install pdfkit bwip-js
   ```

2. **Admin Panel Setup:**
   ```bash
   cd admin-panel
   npm install html5-qrcode react-signature-canvas react-barcode
   ```

3. **Database Migration:**
   The new models (Waybill, ShippingEvent, ProofOfDelivery, ShippingHub) will be automatically created when the server starts.

4. **Permissions Setup:**
   Update existing roles to include the new shipping permissions:
   - shipping_waybills (CRUD)
   - shipping_photos (CRUD)
   - shipping_scanout (CRUD)
   - shipping_scanin (CRUD)
   - shipping_pod (CRUD)
   - shipping_reports (Read)
   - shipping_hubs (CRUD)

## Testing the Module

1. Create a test order in the system
2. Navigate to the order detail page
3. Click "Create Waybill" to generate a waybill
4. Test the mobile scanner by navigating to `/shipping/mobile`
5. Test POD capture for orders with status "WITH_DELIVERY_DRIVER" or "RECEIVED_AT_HUB"
