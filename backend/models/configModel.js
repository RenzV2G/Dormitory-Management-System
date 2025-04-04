// configModel.js
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  lockedGenders: { type: [String], default: [] } 
});


module.exports = mongoose.model('Config', configSchema);