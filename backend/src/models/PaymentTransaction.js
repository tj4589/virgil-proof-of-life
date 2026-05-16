const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workerId:  { type: DataTypes.UUID, allowNull: true },
  reference: { type: DataTypes.STRING, unique: true, allowNull: false },
  amount:    { type: DataTypes.FLOAT, allowNull: false },
  status:    { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' }, // PENDING, SUCCESS, CONFIRMED, FAILED
});

module.exports = PaymentTransaction;
