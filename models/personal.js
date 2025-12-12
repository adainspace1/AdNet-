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
  password: { type: String },

  // Step 3: Address
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },

  // Plan info
  plan: { type: String, default: '' },    // can store something like "Custom Plan - 12 months / 10 users"
  total: { type: Number, default: 0 },   // store total cost of this plan

  tier: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  creditLimit: { type: Number, default: 500000 },
  creditWarning: { type: Number, default: 300000 },
  usedCredit: { type: Number, default: 0 },
  availableCredit: { type: Number, default: function() { return this.creditLimit; } },
}, {
  timestamps: true
});

module.exports = mongoose.model('UserForm', userFormSchema);
