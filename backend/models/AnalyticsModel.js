const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: String, required: true },
  submissionCount: { type: Number, default: 0 },
  approvedCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  genderBased: { 
    male: {
      totalSubmissions: { type: Number, default: 0 },
      approvedCount: { type: Number, default: 0 },
      rejectedCount: { type: Number, default: 0 },
    },
    female: {
      totalSubmissions: { type: Number, default: 0 },
      approvedCount: { type: Number, default: 0 },
      rejectedCount: { type: Number, default: 0 },
    }
  },
  provinceAnalytics: [{
    province: { type: String, required: true },
    submissionCount: { type: Number, default: 0 },
}],
});

AnalyticsSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);