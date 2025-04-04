const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
    PK: {type: String, default: () => `PK#${uuidv4()}`, unique: true},
    name: {type: String, required: true },
    studentNo: { type: String, required: true },
    transactionNo: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paymentBy: { type: String, enum: ['Cash', 'Bank Transfer', 'Online'], required: true },
    remarks: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payments', paymentSchema);
