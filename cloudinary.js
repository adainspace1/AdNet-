
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: 'drxsvfsqf',
  api_key: '727925164445829',
  api_secret: 'VptfP20iMdkQg0t_T-gj12ZCbG4',
});

module.exports = cloudinary;