const { connectDB, sequelize } = require('./src/config/db');

async function testConnection() {
  try {
    await connectDB();
    console.log('Successfully connected to SQLite database');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

testConnection();
