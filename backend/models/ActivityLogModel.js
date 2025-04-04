const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    admin: { type: String, required: true },  
    targetStudent: { type: String },  
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' }  
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);;
