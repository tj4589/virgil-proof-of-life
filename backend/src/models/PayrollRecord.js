const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PayrollRecord = sequelize.define('PayrollRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  baseSalary: { type: DataTypes.FLOAT, allowNull: false },
  deductions: { type: DataTypes.FLOAT, defaultValue: 0 },
  netSalary: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' }
});

module.exports = PayrollRecord;
