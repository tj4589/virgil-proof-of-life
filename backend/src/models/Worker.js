const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Worker = sequelize.define('Worker', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batch: { type: DataTypes.STRING, defaultValue: 'BATCH_1' },
  staffId: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  nin: { type: DataTypes.STRING },
  bvn: { type: DataTypes.STRING },
  bankAccount: { type: DataTypes.STRING },
  bankCode: { type: DataTypes.STRING },
  salary: { type: DataTypes.FLOAT, allowNull: false },
  department: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
  aiConfidence: { type: DataTypes.FLOAT },
  trustScore: { type: DataTypes.FLOAT },
  riskLevel: { type: DataTypes.STRING },
  anomalyScore: { type: DataTypes.FLOAT },
  aiReasons: { type: DataTypes.JSON },
  lastVerified: { type: DataTypes.DATE }
}, {
  indexes: [
    { fields: ['batch'] },
    { fields: ['status'] },
    { fields: ['staffId'] }
  ]
});

module.exports = Worker;
