# 🚀 Quick Start - Run in 60 Seconds!

## Terminal 1 - Database Migration
```powershell
cd server
node run-migration.js
```

## Terminal 2 - Start Backend
```powershell
cd server
node index.js
```

## Terminal 3 - Start Frontend
```powershell
cd client
npm start
```

## 🎉 Done!
Open browser: **http://localhost:3000**

---

## Test It Out

1. **Register**: http://localhost:3000/register
2. **Check Email** for verification link
3. **Click Link** to verify
4. **Login**: http://localhost:3000/login
5. **Try a Problem**: Navigate to Practice

**OR use Google Sign-In** for instant access (no verification needed)!

---

## Make Yourself Admin

```sql
-- Run in MySQL:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Then access: **http://localhost:3000/admin**

---

## 📚 Full Documentation
- `IMPLEMENTATION_COMPLETE.md` - Complete guide
- `STARTUP_CHECKLIST.md` - Detailed setup
- `FIREBASE_SETUP_GUIDE.md` - Firebase docs

---

**Status:** ✅ Ready to Run!
