# 🔍 BACKEND PORT CONFLICT ISSUE - REQUIRES FIXES BY CLAUDE AI

**Date:** January 24, 2026  
**Status:** Issue identified - Backend port conflict detected

---

## 🚨 ISSUE IDENTIFIED: Port 5000 Already In Use (EADDRINUSE)

### Problem
When attempting to start the backend server, it fails with the following error:

```
Error: listen EADDRINUSE: address already in use :::5000
    at Server.setupListenHandle [as _listen2] (node:net:1937:16)
    ...
    code: 'EADDRINUSE',
    errno: -48,
    syscall: 'listen',
    address: '::',
    port: 5000
```

### Root Cause Analysis

**Current Situation:**
- Multiple Node.js processes are running on port 5000
- There are multiple backend server instances running simultaneously:
  - Nodemon process (PID varies)
  - Direct node server.js processes (multiple PIDs)
- When trying to start a new instance, it fails because port 5000 is already occupied

**Possible Causes:**
1. **Multiple backend instances started** - Previous instances weren't properly stopped
2. **Nodemon restart loop** - Nodemon may have restarted multiple times creating duplicate processes
3. **Stale processes** - Old backend processes from previous sessions still running
4. **File watching causing restarts** - Nodemon may be restarting too frequently due to file changes

### Evidence Found

**Processes detected:**
- Multiple `node server.js` processes running
- Nodemon process running
- All attempting to use port 5000

**Log evidence:**
- Logs show: `[nodemon] restarting due to changes...` multiple times
- Server successfully started initially: `Server running in development mode on port 5000`
- MongoDB connection successful: `MongoDB Connected: localhost`
- Health check was responding: `GET /health 200`

---

## 🔧 FIX INSTRUCTIONS FOR CLAUDE AI

### Solution 1: Kill All Existing Backend Processes

**Step 1: Stop all backend processes**

```bash
# Find and kill all node processes related to the backend
pkill -f "node.*server.js"
pkill -f "nodemon.*server.js"

# Or more specifically:
lsof -ti:5000 | xargs kill -9

# Wait a moment for processes to terminate
sleep 2

# Verify port 5000 is free
lsof -ti:5000
# Should return nothing (empty)
```

**Step 2: Verify no processes are using port 5000**

```bash
lsof -i:5000
# Should show no results
```

**Step 3: Start backend cleanly**

```bash
cd backend
npm run dev
```

---

### Solution 2: Add Process Management to server.js

**File to modify:** `backend/server.js`

**Add graceful shutdown handling before the server.listen() call (around line 130-140):**

```javascript
// Before: const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {

// Add this check:
const PORT = process.env.PORT || 5000;

// Check if port is already in use
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('Please stop the existing server or use a different port.');
    console.error('To stop existing processes, run: lsof -ti:5000 | xargs kill -9');
    process.exit(1);
  } else {
    throw err;
  }
});
```

---

### Solution 3: Update package.json Scripts

**File to modify:** `backend/package.json`

**Add a cleanup script:**

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seeders/index.js",
    "stop": "lsof -ti:5000 | xargs kill -9 2>/dev/null || true",
    "restart": "npm run stop && sleep 2 && npm run dev"
  }
}
```

**This allows:**
- `npm run stop` - Cleanly stop all backend processes
- `npm run restart` - Stop and restart the backend

---

### Solution 4: Prevent Nodemon Restart Loops

**File to modify:** `backend/package.json` or create `nodemon.json`

**Option A: Add nodemon config to package.json:**

```json
{
  "nodemonConfig": {
    "ignore": [
      "node_modules",
      "uploads",
      "*.log",
      ".env"
    ],
    "delay": 1000,
    "verbose": false
  }
}
```

**Option B: Create `backend/nodemon.json`:**

```json
{
  "ignore": [
    "node_modules",
    "uploads",
    "*.log",
    ".env"
  ],
  "delay": 1000,
  "verbose": false,
  "restartable": "rs"
}
```

---

## 📋 VERIFICATION STEPS

After applying fixes:

1. **Stop all processes:**
   ```bash
   lsof -ti:5000 | xargs kill -9
   sleep 2
   ```

2. **Verify port is free:**
   ```bash
   lsof -i:5000
   # Should return nothing
   ```

3. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Check for errors:**
   - Should NOT see "EADDRINUSE" error
   - Should see "Server running in development mode on port 5000"
   - Should see "MongoDB Connected: localhost"

5. **Test health endpoint:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"ok",...}
   ```

6. **Check process count:**
   ```bash
   ps aux | grep "node.*server.js\|nodemon" | grep -v grep | wc -l
   # Should return: 1 (only one nodemon process)
   ```

---

## 📝 SUMMARY OF ISSUE

**Problem:** Multiple backend processes running on port 5000 causing "EADDRINUSE" error

**Root Cause:** 
- Multiple Node.js processes not properly terminated
- Nodemon creating duplicate processes
- No cleanup mechanism for stale processes

**Recommended Fixes:**
1. Kill all existing processes (immediate fix)
2. Add error handling for port conflicts (preventive)
3. Add stop/restart scripts (convenience)
4. Configure nodemon to prevent restart loops (preventive)

---

## ⚠️ IMPORTANT NOTES

- **Do NOT** manually edit running processes
- Always stop existing processes before starting new ones
- Use `npm run stop` (if implemented) or `lsof -ti:5000 | xargs kill -9` to clean up
- Check for multiple processes before reporting "backend not running"
- The backend may actually be running but not responding due to conflicts

---

**END OF ISSUES DOCUMENT**
