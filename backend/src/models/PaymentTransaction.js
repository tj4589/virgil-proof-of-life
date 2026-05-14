const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING, unique: true, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false } // SUCCESS, FAILED, PENDING
});

module.exports = PaymentTransaction;
