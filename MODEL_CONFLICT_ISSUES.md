# 🔍 MODEL CONFLICT ISSUES - REQUIRES FIXES BY CLAUDE AI

**Date:** January 24, 2026  
**Status:** All code changes have been rolled back. This document lists model conflict issues that prevent the backend from starting.

---

## 🚨 CRITICAL ISSUE: Mongoose Model Name Conflicts

### Problem
After implementing the Email Template Builder and Code Snippets modules, the backend server crashes on startup with the following error:

```
OverwriteModelError: Cannot overwrite `EmailTemplate` model once compiled.
```

or

```
OverwriteModelError: Cannot overwrite `CodeSnippet` model once compiled.
```

### Root Cause
The same Mongoose model names are being registered in multiple files:

1. **EmailTemplate model conflict:**
   - Defined in: `backend/models/Template.js` (line 299)
   - Also defined in: `backend/models/EmailTemplate.js` (line 114)
   - Both try to register: `mongoose.model('EmailTemplate', ...)`

2. **CodeSnippet model conflict:**
   - Defined in: `backend/models/Template.js` (line 300)
   - Also defined in: `backend/models/CodeSnippet.js` (line 93)
   - Both try to register: `mongoose.model('CodeSnippet', ...)`

3. **Files that load Template.js (which registers EmailTemplate and CodeSnippet):**
   - `backend/routes/pageBuilder.js` (line 4)
   - `backend/services/emailService.js` (line 2)

4. **Files that load the new models:**
   - `backend/routes/emailTemplates.js` loads `EmailTemplate.js`
   - `backend/routes/codeSnippets.js` loads `CodeSnippet.js`

When the server starts, it loads routes which import both the old models (from Template.js) and new models (from EmailTemplate.js and CodeSnippet.js), causing Mongoose to throw an error because you cannot register the same model name twice.

---

## 🔧 FIX INSTRUCTIONS FOR CLAUDE AI

### Solution: Remove Duplicate Model Exports from Template.js

**File to modify:** `backend/models/Template.js`

**Current code (lines 298-302):**
```javascript
module.exports = {
  EmailTemplate: mongoose.model('EmailTemplate', emailTemplateSchema),
  CodeSnippet: mongoose.model('CodeSnippet', codeSnippetSchema),
  PageBuilder: mongoose.model('PageBuilder', pageBuilderSchema)
};
```

**Change to:**
```javascript
// Only export PageBuilder - EmailTemplate and CodeSnippet are now in their own files
// EmailTemplate model is now in ./EmailTemplate.js
// CodeSnippet model is now in ./CodeSnippet.js
module.exports = {
  PageBuilder: mongoose.model('PageBuilder', pageBuilderSchema)
};
```

**Reason:** Since `EmailTemplate.js` and `CodeSnippet.js` are now dedicated model files, they should be the only ones registering these models. The `Template.js` file should only export `PageBuilder`.

---

### Update Files That Import from Template.js

#### Fix 1: Update `backend/services/emailService.js`

**Current code (line 2):**
```javascript
const { EmailTemplate } = require('../models/Template');
```

**Change to:**
```javascript
const EmailTemplate = require('../models/EmailTemplate');
```

**Reason:** `emailService.js` needs to use the new dedicated `EmailTemplate` model, not the one from `Template.js`.

---

#### Fix 2: Update `backend/routes/pageBuilder.js`

**Current code (line 4):**
```javascript
const Template = require('../models/Template');
```

**Change to:**
```javascript
const { PageBuilder } = require('../models/Template');
```

**Also update all references in the file:**

**Current code (lines 13, 42):**
```javascript
const template = await Template.findOne({
```

**Change to:**
```javascript
const template = await PageBuilder.findOne({
```

**Reason:** `pageBuilder.js` should use `PageBuilder` model, not `Template`. The `Template` variable name is confusing - it should be `PageBuilder`.

---

### Add Required Methods to EmailTemplate Model

**File to modify:** `backend/models/EmailTemplate.js`

**Add these methods before the `module.exports` line (after line 84):**

```javascript
// Static method to get default template by type
emailTemplateSchema.statics.getDefaultByType = function(type) {
  return this.findOne({ type, isDefault: true, isActive: true });
};

// Method to render template with variables
emailTemplateSchema.methods.render = function(variables = {}) {
  let html = this.htmlContent;
  let text = this.textContent;
  let subject = this.subject;
  
  // Replace all variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const value = variables[key] || '';
    
    if (html) html = html.replace(regex, value);
    if (text) text = text.replace(regex, value);
    if (subject) subject = subject.replace(regex, value);
  });
  
  return {
    subject,
    html,
    text
  };
};
```

**Reason:** The `emailService.js` file uses these methods (`getDefaultByType` and `render`), so they must be present on the EmailTemplate model.

---

## 📋 VERIFICATION STEPS

After applying fixes:

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check for errors:**
   - Should NOT see "OverwriteModelError"
   - Should see "Server running in development mode on port 5000"

3. **Test APIs:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Code snippets (public)
   curl http://localhost:5000/api/code-snippets/active/header
   
   # Email templates (requires auth)
   curl http://localhost:5000/api/email-templates
   ```

4. **Expected results:**
   - Health check returns: `{"status":"ok",...}`
   - Code snippets returns: `{"success":true,"count":0,"data":[]}`
   - Email templates returns: `{"success":false,"message":"Not authorized..."}` (expected - requires auth)

---

## 📝 SUMMARY OF CHANGES NEEDED

1. **backend/models/Template.js** - Remove EmailTemplate and CodeSnippet from exports
2. **backend/services/emailService.js** - Change import to use EmailTemplate.js
3. **backend/routes/pageBuilder.js** - Change to use PageBuilder from Template.js
4. **backend/models/EmailTemplate.js** - Add getDefaultByType and render methods

---

## ⚠️ IMPORTANT NOTES

- Do NOT delete the new model files (`EmailTemplate.js` and `CodeSnippet.js`)
- Do NOT delete the schemas from `Template.js` (they're still used for PageBuilder)
- Only remove the `mongoose.model()` registrations from `Template.js` exports
- The new dedicated model files should be the only ones registering EmailTemplate and CodeSnippet models

---

**END OF ISSUES DOCUMENT**
