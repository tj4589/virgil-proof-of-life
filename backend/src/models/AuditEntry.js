const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditEntry = sequelize.define('AuditEntry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  action: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT },
  squadReference: { type: DataTypes.STRING }
});

module.exports = AuditEntry;
