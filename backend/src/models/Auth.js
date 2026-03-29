const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
  verified: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at' }
});

const sessionSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  token: { type: String, required: true },
  device_id: { type: String },
  ip_address: { type: String },
  login_time: { type: Date, default: Date.now },
  logout_time: { type: Date }
});

const OTPModel = mongoose.model('OTP', otpSchema);
const SessionModel = mongoose.model('Session', sessionSchema);

module.exports = { OTPModel, SessionModel };
