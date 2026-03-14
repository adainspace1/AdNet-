const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnchorWebhookLogSchema = new Schema({
  eventType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnchorWebhookLog', AnchorWebhookLogSchema);
