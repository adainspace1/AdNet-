const mongoose = require('mongoose');

const customPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        name: {
          type: String,
          required: true
        },
        desc: String,
        qty: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        total: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
contract: {
  type: Number,
  enum: [1,3,6,12,24,36,48,60,72,84,96,108,120], // now 10 years (120 months) is valid
  required: true
}
    ,
    users: {
      type: Number,
      default: 1,
      min: 1,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdnetOrder', customPlanSchema);
