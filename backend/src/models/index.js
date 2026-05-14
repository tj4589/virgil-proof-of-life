const Worker = require('./Worker');
const AttendanceRecord = require('./AttendanceRecord');
const PayrollRecord = require('./PayrollRecord');
const PaymentTransaction = require('./PaymentTransaction');
const AuditEntry = require('./AuditEntry');

// Define Associations
Worker.hasMany(AttendanceRecord, { foreignKey: 'workerId', as: 'attendance' });
AttendanceRecord.belongsTo(Worker, { foreignKey: 'workerId' });

Worker.hasMany(PayrollRecord, { foreignKey: 'workerId', as: 'payroll' });
PayrollRecord.belongsTo(Worker, { foreignKey: 'workerId' });

Worker.hasMany(PaymentTransaction, { foreignKey: 'workerId', as: 'payments' });
PaymentTransaction.belongsTo(Worker, { foreignKey: 'workerId' });

Worker.hasMany(AuditEntry, { foreignKey: 'workerId', as: 'auditEntries' });
AuditEntry.belongsTo(Worker, { foreignKey: 'workerId' });

module.exports = {
  Worker,
  AttendanceRecord,
  PayrollRecord,
  PaymentTransaction,
  AuditEntry
};
