# 🛍️ PRODUCTS MODULE - COMPLETE IMPLEMENTATION GUIDE

**Date:** January 24, 2026  
**Status:** Complete implementation instructions for Claude AI

---

## 📋 OVERVIEW

This document provides complete code for overhauling the Products module. All code snippets below should be implemented exactly as provided.

---

## STEP 1: Replace Product Model

**File:** `backend/models/Product.js`  
**Action:** REPLACE entire file with the code provided in the user's instructions

**Key Features:**
- Auto-generate SKU (PS-001, PS-002 format)
- Auto-generate slug from name
- Status field (active, draft, trash)
- Simplified variation schema
- AI generation tracking
- SEO fields

---

## STEP 2: Replace Products Routes

**File:** `backend/routes/products.js`  
**Action:** REPLACE entire file with the code provided in the user's instructions

**Key Features:**
- Multer configuration for image uploads
- Search requires 3+ characters
- Get by slug or ID
- Image upload handling
- Trash/restore endpoints
- Bulk operations
- Next SKU endpoint

---

## STEP 3: Create Product AI Route

**File:** `backend/routes/productAI.js`  
**Action:** CREATE new file with code from user's instructions

---

## STEP 4: Create WooCommerce Import Route

**File:** `backend/routes/woocommerceImport.js`  
**Action:** CREATE new file with code from user's instructions

---

## STEP 5: Update server.js

**File:** `backend/server.js`  
**Changes needed:**

1. Add path import at top:
```javascript
const path = require('path');
```

2. Add new routes (after line 84):
```javascript
app.use('/api/products-ai', require('./routes/productAI'));
app.use('/api/woocommerce-import', require('./routes/woocommerceImport'));
```

3. Update static files (line 42 already has it, but ensure it uses path.join):
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

## STEP 6: Create Upload Directories

**Commands:**
```bash
mkdir -p backend/uploads/products
mkdir -p backend/uploads/temp
```

---

## STEP 7: Add OpenAI Key to .env

**File:** `backend/.env`  
**Add:**
```
OPENAI_API_KEY=your_openai_api_key_here
```

---

## STEP 8: Update Frontend Files

**Files to modify:**

1. `frontend/src/pages/ProductDetailPage.jsx`
   - Change `const { id } = useParams();` to `const { slug } = useParams();`
   - Update query key and API call to use `slug`

2. `frontend/src/App.jsx`
   - Change route from `path="/product/:id"` to `path="/product/:slug"`

3. `frontend/src/components/common/ProductCard.jsx`
   - Change links from `/product/${product._id}` to `/product/${product.slug}`

4. `frontend/src/services/api.js`
   - Update productsAPI with all new endpoints from user's instructions

---

## ⚠️ IMPORTANT NOTES

- The new Product model simplifies the existing complex structure
- Field name changes: `basePrice` → `regularPrice` in new model
- Status enum changes: `['draft', 'published', 'archived']` → `['active', 'draft', 'trash']`
- Image storage path: `/uploads/products/`
- SKU format: Changes to PS-001, PS-002, etc.
- Slug-based URLs instead of ID-based

---

## 📝 VERIFICATION

After implementation:
- Backend should start without errors
- Products API should work with new structure
- Search should require 3+ characters
- Image uploads should work
- Trash/restore should work
- Frontend should use slugs in URLs

---

**END OF IMPLEMENTATION GUIDE**
