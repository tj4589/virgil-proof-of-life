
const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/ghostdetect";

mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit(1);
  });
