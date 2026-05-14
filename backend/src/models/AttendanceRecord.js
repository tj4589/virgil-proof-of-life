const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING, allowNull: false } // PRESENT, ABSENT, ON_LEAVE
});

module.exports = AttendanceRecord;
