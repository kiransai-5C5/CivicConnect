// db.js temporary for testing
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://kiransai_434:kiransai@cluster0.mhbuuqn.mongodb.net/civix?appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
  }
};

module.exports = connectDB;
