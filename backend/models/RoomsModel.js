const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  sex: { type: String, enum: ['Male', 'Female'], required: true }, 
  building: { type: String, required: true },
  roomType: { type: String, enum: ['Single', 'Double', 'Quad', 'Hexa'], required: true },
  availableBeds: [{ type: String }], 
  occupiedBeds: [
      {
          bedLetter: { type: String },
          student: {
              studentNo: { type: String, required: true },
              name: { type: String, required: true },
              contactNo: { type: String, required: true },
              course: { type: String, required: true },
              yearLevel: { type: String, required: true },
          },
      },
  ],
}, { timestamps: true });

RoomSchema.index({ sex: 1, roomNumber: 1, occupiedBeds: 1});

module.exports = mongoose.model('Room', RoomSchema);