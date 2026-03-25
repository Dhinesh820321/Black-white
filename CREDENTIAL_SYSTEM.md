# Employee Credential System - Implementation Guide

## 🔐 Credential Creation Flow

### Method 1: Admin Creates Employee (Recommended)

```
Admin Dashboard → Employees → Add Employee
         ↓
    Enter Details:
    - Name
    - Phone (unique)
    - Role (admin/manager/stylist/helper)
    - Branch assignment
    - Salary
         ↓
    System generates:
    - Employee ID (auto)
    - Temporary Password (auto)
         ↓
    SMS sent to employee:
    "Your login: Phone: xxx, Password: Temp@123"
```

### Method 2: OTP Login (Modern)

```
Employee opens app
         ↓
Enters phone number
         ↓
System sends 6-digit OTP (expires 5 min)
         ↓
Employee enters OTP
         ↓
Login successful (no password needed)
```

## 🛡️ Security Features

### 1. Password Hashing
- All passwords hashed with bcrypt (10 rounds)
- Never stored in plain text

### 2. OTP System
- 6-digit random code
- 5-minute expiry
- Hash stored in database
- Single use

### 3. Device Binding
- Each employee can have 1 registered device
- Device ID stored in database
- Login from new device triggers alert

### 4. Geo-Fencing
- GPS location captured on login
- Compared with branch coordinates
- Uses Haversine formula for distance
- Outside radius = blocked

### 5. Session Management
- JWT tokens (24h expiry)
- Session tracking in database
- Multiple sessions per user
- Force logout capability

### 6. First Login Password Change
- New employees must change temp password
- Modal forces password update
- Old password required for change

## 📱 Database Tables

### employees
```sql
id, employee_id, name, role, phone
password (hashed), device_id
branch_id, salary, status
password_changed_at, created_at
```

### otp_verifications
```sql
id, phone, otp (hashed)
expires_at, verified, attempts, created_at
```

### auth_sessions
```sql
id, employee_id, token, device_id
ip_address, login_time, logout_time
```

## 🔄 Login Flow Diagram

```
┌─────────────────────────────────────┐
│         Employee Login               │
└─────────────────────────────────────┘
                  ↓
         ┌───────────────────┐
         │  Choose Method    │
         └───────────────────┘
                  ↓
    ┌────────────┴────────────┐
    ↓                        ↓
Password?                 OTP?
    ↓                        ↓
┌─────────┐            ┌────────────┐
│Enter    │            │Enter Phone│
│Creds    │            └────────────┘
└─────────┘                 ↓
    ↓              ┌────────────────┐
┌────────────┐     │  Send OTP     │
│Verify      │     │  (SMS/Print)  │
│Password    │     └────────────────┘
└────────────┘              ↓
    ↓               ┌────────────┐
    │        ┌──────┤Enter OTP  ├──────┐
    │        ↓      └────────────┘      │
    │   ┌────────┐                      │
    │   │Valid?  │                      │
    │   └────────┘                      │
    │    ↓         ↓                     │
    │  Yes        No                     │
    │   ↓          ↓                     │
    │  ┌──────────────┐                  │
    │  │Check GPS     │                  │
    │  └──────────────┘                  │
    │       ↓        ↓                     │
    │   In Range  Out Range               │
    │     ↓         ↓                     │
    │   ┌────────────────┐   ┌──────────┐│
    │   │Create Session │   │  BLOCKED ││
    │   │Generate JWT   │   └──────────┘│
    │   └────────────────┘                │
    │         ↓                          │
    │   ┌────────────────┐               │
    └──►│  Login Success │◄──────────────┘
        └────────────────┘
```

## 📋 Admin Employee Creation API

```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "phone": "9876543210",
  "role": "stylist",
  "branch_id": 1,
  "salary": 25000,
  "send_creds": true
}

// Response:
{
  "success": true,
  "data": {
    "id": 5,
    "employee_id": "ABC12345",
    "name": "John Doe",
    "role": "stylist",
    "phone": "9876543210",
    "temp_password": "Xy7@pass",
    "message": "Credentials sent via SMS"
  }
}
```

## 🔑 Employee Self-Service

### Password Reset Flow
1. Click "Forgot Password" on login
2. Enter phone number
3. New temp password sent via SMS
4. Login with temp password
5. Force change password

### Change Password
1. Go to Profile → Change Password
2. Enter current + new password
3. Confirm new password
4. Session continues

## 🚨 Security Alerts

The system logs:
- Failed login attempts
- Device mismatches
- Geo-location violations
- Password changes
- Session creations

## 📍 GPS Verification

```javascript
// Haversine formula calculates distance
const distance = haversineDistance(
  userLat, userLng,
  branchLat, branchLng
);

// Allow if within radius
if (distance <= geoRadius) {
  // Allow login
} else {
  // Block with message
}
```

## 🎯 Best Practices

1. **Admin creates all accounts** - No self-registration
2. **Force password change** - On first login
3. **Device binding** - Prevents credential sharing
4. **GPS verification** - Prevents fake attendance
5. **Session expiry** - 24h JWT tokens
6. **Audit logging** - Track all auth events

## 📱 Future Enhancements

- [ ] Biometric authentication
- [ ] Hardware security keys
- [ ] IP whitelisting
- [ ] Login attempt limiting
- [ ] Auto-logout after inactivity
- [ ] Two-factor authentication
