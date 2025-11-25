const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Call', 'Email', 'Meeting', 'Note', 'Task', 'WhatsApp', 'SMS'],
        required: true
    },
    subject: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    duration: { type: Number }, // in minutes, for calls/meetings

    // Relations
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
