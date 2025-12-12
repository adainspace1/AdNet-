const mongoose = require('mongoose');
const { Schema } = mongoose;


const PlanSchema = new Schema({
company: { type: String, required: true },
contactName: { type: String },
email: { type: String, required: true },
phone: { type: String },
users: { type: Number, default: 1 },
contractMonths: { type: Number, default: 12 },
modules: [String],
budget: { type: Number, default: 0 }, // stored in NGN (integer)
notes: { type: String },
planType: { type: String, enum: ['micro','macro','enterprise','custom'], default: 'custom' },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Plan', PlanSchema);