# 🛍️ PRODUCTS MODULE - COMPLETE OVERHAUL INSTRUCTIONS

**Date:** January 24, 2026  
**Status:** Implementation instructions ready for Claude AI

---

## 📋 IMPLEMENTATION PLAN

This document provides complete instructions to overhaul the Products module with:

✅ Real-time search (3 characters minimum)  
✅ Fix image upload and storage  
✅ Show category in product list  
✅ Fix bulk edit feature  
✅ Fix product detail page (blank page issue)  
✅ SEO-friendly URLs (slugs)  
✅ Auto-generate SKU system (PS-001, PS-002, etc.)  
✅ Product variations & attributes (WooCommerce style)  
✅ WooCommerce CSV import compatibility  
✅ Product AI Generator (OpenAI integration)  
✅ Trash/Restore functionality  

---

## STEP 1: Update Product Model

**File:** `backend/models/Product.js`  
**Action:** REPLACE entire file with new schema (see full code in instructions)

**Key Changes:**
- Add slug field with auto-generation
- Add SKU auto-generation (PS-001 format)
- Add status field (active, draft, trash)
- Add trashedAt field
- Simplify variation schema
- Add aiGenerated tracking
- Add seoTitle, seoDescription, seoKeywords

---

## STEP 2: Update Products Routes

**File:** `backend/routes/products.js`  
**Action:** REPLACE entire file with new routes (see full code in instructions)

**Key Changes:**
- Add multer configuration for image uploads
- Search requires 3+ characters
- Get by slug or ID
- Image upload handling
- Trash/restore endpoints
- Permanent delete endpoint
- Bulk edit endpoint
- Bulk trash endpoint
- Next SKU endpoint

---

## STEP 3: Create Product AI Generator Route

**File:** `backend/routes/productAI.js`  
**Action:** CREATE new file (see full code in instructions)

**Endpoints:**
- POST `/api/products-ai/generate-description/:id`
- POST `/api/products-ai/apply-description/:id`
- POST `/api/products-ai/bulk-generate`

---

## STEP 4: Create WooCommerce CSV Import Route

**File:** `backend/routes/woocommerceImport.js`  
**Action:** CREATE new file (see full code in instructions)

**Endpoints:**
- POST `/api/woocommerce-import/products`
- GET `/api/woocommerce-import/sample`

---

## STEP 5: Register New Routes in server.js

**File:** `backend/server.js`  
**Action:** ADD routes and static file serving

**Changes needed:**
1. Add `const path = require('path');` at top
2. Add routes:
   ```javascript
   app.use('/api/products-ai', require('./routes/productAI'));
   app.use('/api/woocommerce-import', require('./routes/woocommerceImport'));
   ```
3. Add static file serving:
   ```javascript
   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
   ```

---

## STEP 6: Install Dependencies

**Already installed:** ✅ multer, csv-parser, axios

**Action:** Create uploads directories:
```bash
mkdir -p backend/uploads/products
mkdir -p backend/uploads/temp
```

---

## STEP 7: Add OpenAI API Key

**File:** `backend/.env`  
**Action:** ADD line:
```
OPENAI_API_KEY=your_openai_api_key_here
```

---

## STEP 8: Update Frontend Product Routes

**Files to modify:**
1. `frontend/src/pages/ProductDetailPage.jsx` - Change `id` to `slug`
2. `frontend/src/App.jsx` - Update route to use `:slug`
3. `frontend/src/components/common/ProductCard.jsx` - Use slug in links

---

## STEP 9: Update Frontend API Service

**File:** `frontend/src/services/api.js`  
**Action:** UPDATE productsAPI with new endpoints

---

## ⚠️ IMPORTANT NOTES

- The existing Product model has a complex structure - the new one simplifies it
- Image upload paths will change to `/uploads/products/`
- SKU format changes to PS-001, PS-002, etc.
- Product URLs will use slugs instead of IDs
- Trash functionality replaces hard delete

---

**END OF INSTRUCTIONS DOCUMENT**
