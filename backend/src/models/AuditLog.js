const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['CREATE', 'EDIT', 'DELETE', 'VIEW'], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByName: { type: String },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'audit_logs'
});

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);

class AuditLog {
  static async create(data) {
    try {
      const auditLog = new AuditLogModel(data);
      await auditLog.save();
      return auditLog.toObject();
    } catch (error) {
      console.error('AuditLog create error:', error.message);
      return null;
    }
  }

  static async findByEntity(entityType, entityId, limit = 50) {
    return AuditLogModel.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('performedBy', 'name email role')
      .lean();
  }
}

module.exports = AuditLog;
