const mongoose = require('mongoose');

const userFormSchema = new mongoose.Schema({
  // Step 1: Personal
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  bio: { type: String },
  portfolioUrl: { type: String, required: true },

  // Step 2: Contact
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String }, // Add hashing if needed

  // Step 3: Address
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  plan: { type: String, required: true },
  zipCode: { type: String, required: true },
    tier: {
    type: Number,
    enum: [1, 2, 3], // 1=API Wallet, 2=Platform Wallet, 3=Bank & Third-Party
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserForm', userFormSchema);
