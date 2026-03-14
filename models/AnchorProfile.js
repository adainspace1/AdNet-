const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnchorProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Basic Detail
  businessName: { type: String, required: true },
  businessBvn: { type: String, required: true },
  industry: { type: String, required: true },
  registrationType: { type: String, required: true },
  country: { type: String, default: 'NG' },
  dateOfRegistration: { type: Date, required: true },
  description: { type: String },
  website: { type: String },
  // Contact
  contactEmail: {
    general: { type: String, required: true },
    support: { type: String },
    dispute: { type: String }
  },
  contactPhone: { type: String, required: true },
  contactAddress: {
    main: {
      country: { type: String, default: 'NG' },
      state: { type: String, required: true },
      addressLine_1: { type: String, required: true },
      addressLine_2: { type: String },
      city: { type: String, required: true },
      postalCode: { type: String }
    },
    registered: {
      country: { type: String, default: 'NG' },
      state: { type: String, required: true },
      addressLine_1: { type: String, required: true },
      addressLine_2: { type: String },
      city: { type: String, required: true },
      postalCode: { type: String }
    }
  },
  // Address
  address: {
    country: { type: String, default: 'NG' },
    state: { type: String, required: true }
  },
  // Officers
  officers: [{
    role: { type: String, enum: ['DIRECTOR', 'OWNER'], required: true },
    fullName: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      middleName: { type: String },
      maidenName: { type: String }
    },
    nationality: { type: String, default: 'NG' },
    address: {
      country: { type: String, default: 'NG' },
      state: { type: String, required: true },
      addressLine_1: { type: String, required: true },
      addressLine_2: { type: String },
      city: { type: String, required: true },
      postalCode: { type: String }
    },
    dateOfBirth: { type: Date, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    bvn: { type: String, required: true },
    title: { type: String, required: true },
    percentageOwned: { type: Number, default: 0 }
  }],
  // Legacy fields
  rcNumber: { type: String }, // Keep for backward compatibility
  businessAddress: { type: String }, // Keep for backward compatibility
  businessPhone: { type: String }, // Keep for backward compatibility
  email: { type: String }, // Keep for backward compatibility
  // Anchor data
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  anchorCustomerId: { type: String },
  anchorAccountId: { type: String },
  anchorAccountNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnchorProfile', AnchorProfileSchema);
