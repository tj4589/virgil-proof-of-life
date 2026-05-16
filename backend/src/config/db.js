const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../ghostdetect.sqlite'),
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database Connected: Local SQLite (Offline-ready)');
    const [columns] = await sequelize.query("PRAGMA table_info('Workers')");
    const names = new Set(columns.map(column => column.name));
    const migrations = [
      ['trustScore', "ALTER TABLE `Workers` ADD COLUMN `trustScore` FLOAT"],
      ['riskLevel', "ALTER TABLE `Workers` ADD COLUMN `riskLevel` VARCHAR(255)"],
      ['anomalyScore', "ALTER TABLE `Workers` ADD COLUMN `anomalyScore` FLOAT"],
    ];
    for (const [name, sql] of migrations) {
      if (!names.has(name) && names.size > 0) {
        await sequelize.query(sql);
        console.log(`Database migration applied: Workers.${name}`);
      }
    }
    // Automatically sync models to database
    await sequelize.sync();
    console.log('Database models synchronized');
  } catch (error) {
    console.error('Database Connection Error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
