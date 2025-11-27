const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
});

const deliverySchema = new mongoose.Schema({
  type: { type: String, enum: ['self_pickup', 'waybill', 'motorcycle', 'truck'], required: true },
  price: { type: Number, default: 0 },

  // 🔥 DRIVER INFO STORED AUTOMATICALLY
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  drivername: { type: String, default: "" },
  driverPhone: { type: String, default: "" },

  // 🔥 VEHICLE INFO
  vehicleNumber: { type: String, default: "" },
  vehicleMake: { type: String, default: "" },
  vehicleModel: { type: String, default: "" },
  vehicleColor: { type: String, default: "" },

  logisticsCompany: { type: String, default: "" },
  location: { type: String, default: "" },
  collectionPoint: { type: String, default: "" }
});


const orderSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  buyername: { type: String, required: true },
  buyeremail: { type: String, required: true },
  productpassword: { type: String, required: true },
  expectedDelivery: { type: Date },
  items: [orderItemSchema],
  itemsCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  notes: { type: String, default: '' },
  confirm: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'in_transit', 'delivered', 'overdue'], default: 'pending' },
  qrCode: { type: String },
  delivery: deliverySchema, // <--- added
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('order', orderSchema);
