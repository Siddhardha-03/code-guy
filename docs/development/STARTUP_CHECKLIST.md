# 🚀 Firebase Integration - Startup Checklist

## ⚠️ IMPORTANT: Before You Can Run the Server

The server **will not start** until you complete Step 1 below. This is required for Firebase Admin SDK to work.

---

## Step 1: Download Firebase Service Account Key (REQUIRED)

### Quick Steps:

1. **Visit:** https://console.firebase.google.com/project/code-guy/settings/serviceaccounts/adminsdk

2. **Click:** "Generate New Private Key" button

3. **Download:** A JSON file will download (e.g., `code-guy-firebase-adminsdk-xxxxx.json`)

4. **Rename:** Change the filename to `serviceAccountKey.json`

5. **Move:** Place it in `server/config/serviceAccountKey.json`

### Visual Guide:

```
Your Project
├── server/
│   ├── config/
│   │   └── serviceAccountKey.json  ← PUT THE FILE HERE
│   ├── firebaseAdmin.js
│   └── index.js
```

### Verify Installation:

```powershell
# Check if file exists
Test-Path "server\config\serviceAccountKey.json"
# Should output: True
```

---

## Step 2: Run Database Migration

Update your MySQL database schema for Firebase:

```powershell
cd server
node run-migration.js
```

**Expected Output:**
```
✅ Connected to database successfully
✅ Password column is now nullable (Firebase integration)
🎉 Migration completed successfully
```

---

## Step 3: Start the Application

### Terminal 1 - Start Server:

```powershell
cd server
node index.js
```

**Look for:**
```
✅ Firebase Admin initialized with service account
Server running on port 5000
```

### Terminal 2 - Start Client:

```powershell
cd client
npm start
```

**Opens:** http://localhost:3000

---

## Step 4: Test the Integration

### Option A: Manual Testing (Recommended)

1. **Navigate to:** http://localhost:3000/register
2. **Create account** with your email
3. **Check email** for verification link
4. **Click link** to verify email
5. **Login** at http://localhost:3000/login
6. **Success!** You should be redirected to homepage

### Option B: Automated Testing

```powershell
cd server
node test-firebase-auth.js
```

---

## 🔧 Troubleshooting

### Error: "Failed to initialize Firebase Admin SDK"

**Cause:** Service account key not found

**Solution:**
```powershell
# Check if file exists
Test-Path "server\config\serviceAccountKey.json"

# If False, go back to Step 1
```

### Error: "Cannot find module './config/serviceAccountKey.json'"

**Cause:** File is in wrong location

**Solution:**
```powershell
# File should be at:
server/config/serviceAccountKey.json

# NOT at:
server/serviceAccountKey.json
config/serviceAccountKey.json
```

### Server starts but can't register users

**Cause:** Database migration not run

**Solution:**
```powershell
cd server
node run-migration.js
```

### Can't log in after registration

**Cause:** Email not verified

**Solution:**
- Check your email inbox (and spam folder)
- Click the verification link
- Then try logging in

### "Please verify your email before logging in"

**Cause:** This is normal behavior!

**Solution:**
- Firebase requires email verification for security
- Check your email and click the verification link
- If you didn't receive it, there should be a "Resend" button

---

## 📋 Quick Reference

### Environment Variables Required

**Server (.env):**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=code_guy
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=AIzaSyDiJxM8u4v2dJPUcKp3fK5eNXxJl9Y0234
REACT_APP_FIREBASE_AUTH_DOMAIN=code-guy.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-guy
REACT_APP_FIREBASE_STORAGE_BUCKET=code-guy.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=537699654231
REACT_APP_FIREBASE_APP_ID=1:537699654231:web:3ba4e58f90ceee30d65a63
```

---

## ✅ What's Changed

### Frontend:
- ✅ Login page uses Firebase Authentication
- ✅ Register page uses Firebase Authentication
- ✅ Added Forgot Password page
- ✅ AuthContext manages Firebase tokens automatically
- ✅ Tokens auto-refresh every 50 minutes

### Backend:
- ✅ All routes use Firebase token verification
- ✅ Passwords stored in Firebase (not MySQL)
- ✅ MySQL stores app data (role, submissions, progress)
- ✅ Auto-creates MySQL user on first login
- ✅ Firebase Admin SDK verifies all tokens

### Security:
- ✅ Email verification required
- ✅ Enterprise-grade password security
- ✅ Built-in password reset
- ✅ Automatic token refresh
- ✅ Protection against brute-force attacks

---

## 🎯 Next Steps After Setup

1. **Create an admin account:**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

2. **Test all features:**
   - Register new user
   - Verify email
   - Login
   - Access protected routes
   - Test admin panel
   - Test password reset

3. **Read the guides:**
   - `FIREBASE_SETUP_GUIDE.md` - Detailed documentation
   - `FIREBASE_QUICK_START.md` - Quick reference

---

## 🆘 Need Help?

1. Check server console for error messages
2. Check browser console for client errors
3. Review `FIREBASE_SETUP_GUIDE.md` for detailed docs
4. Ensure all environment variables are set
5. Verify MySQL is running and accessible

---

**Status:** 🔴 Waiting for Service Account Key (Step 1)

Once you complete Step 1, the server will start successfully! 🎉
