// backend/config/db.js
// backend/config/db.js

const connectDB = async () => {
  try {
    console.log("✅ Fake DB Connected (No Real Database Required)");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
