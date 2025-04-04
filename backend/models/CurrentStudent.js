const mongoose = require('mongoose');

const currentStudentSchema = new mongoose.Schema({
  studentNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  name: { type: String, required: true },
  personalInfo: {
      profilePicture: { type: String, default: null },
      course: { type: String, required: true },
      yearLevel: { type: String, required: true },
      sex: { type: String, enum: ['Male', 'Female'], required: true },
      dateOfBirth: { type: Date, required: true },
      placeOfBirth: { type: String, required: true },
      age: { type: Number, required: true },
      religion: { type: String, required: true },
      nationality: { type: String, required: true },
      civilStatus: { type: String, required: true },
      homeAddress: {
          country: { type: String, required: true },
          city: { type: String, required: true },
          zipCode: { type: String, required: true },
          province: { type: String, required: true },
          houseNumber: { type: String, required: true },
      },
      facebookAcct: { type: String, required: true },
      telNo: { type: String, required: true },
  },
  familyBackground: {
      fatherDetails: {
          name: { type: String, required: true },
          dateOfBirth: { type: Date, required: true },
          age: { type: Number, required: true },
          placeOfBirth: { type: String, required: true },
          homeAddress: {
              country: { type: String, required: true },
              city: { type: String, required: true },
              zipCode: { type: String, required: true },
              province: { type: String, required: true },
              houseNumber: { type: String, required: true },
          },
          telNo: { type: String, required: true },
          religion: { type: String, required: true },
          nationality: { type: String, required: true },
          occupation: { type: String, required: true },
          nameOfEmployer: { type: String, required: true },
      },
      motherDetails: {
          name: { type: String, required: true },
          dateOfBirth: { type: Date, required: true },
          age: { type: Number, required: true },
          placeOfBirth: { type: String, required: true },
          homeAddress: {
              country: { type: String, required: true },
              city: { type: String, required: true },
              zipCode: { type: String, required: true },
              province: { type: String, required: true },
              houseNumber: { type: String, required: true },
          },
          telNo: { type: String, required: true },
          religion: { type: String, required: true },
          nationality: { type: String, required: true },
          occupation: { type: String, required: true },
          nameOfEmployer: { type: String, required: true },
      },
      parentStatus: {
          maritalStatus: { type: String, required: true },
          parentsMarriage: { type: Boolean, required: true },
          guardianDetails: {
              name: { type: String, required: true },
              occupation: { type: String, required: true },
              relation: { type: String, required: true },
          },
          languageSpoken: { type: String, required: true },
          noOfChildren: { type: Number, required: true },
          ordinalPosition: { type: String, required: true },
          AverageMonthlyIncome: { type: String, required: true },
      },
      numberOfSiblings: [{ type: Object, required: false }],  // Sibling info here
  },
  healthCondition: {
      weight: { type: Number, required: true },
      height: { type: Number, required: true },
      glasses: { type: Boolean, required: true },
      illnesses: [{ type: Object, required: false }],
      comments: { type: String },
  },
  hobbies: [{ type: String }],
  talentsSkills: [{ type: String }],
  leisureTime: [{ type: String }],
  status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
  },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }, 
  roomAssigned: {
    type: {
      roomNumber: { type: String },
      building: { type: String },
      bedLetter: { type: String },
      roomType: { type: String },
    },
    default: null, // Indicates no room assigned yet
  },
  renewalStatus: {
    type: String,
    enum: ['NotStarted', 'Started', 'Pending'],
    default: 'NotStarted',
  },
  renewalDeadline: { type: Date, default: null },
}, { timestamps: true });


currentStudentSchema.index({ "personalInfo.yearLevel": 1 });

module.exports = mongoose.model('current-students', currentStudentSchema);