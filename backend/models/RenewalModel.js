const mongoose = require('mongoose');

const illnessSchema = new mongoose.Schema({
  name: { type: String, required: false },
  age: { type: Number, required: false },
});

const siblingsSchema = new mongoose.Schema({
  name: { type: String, required: false },
  classification: { type: String, required: false },
  sex: { type: String, enum: ['Male', 'Female'], required: false },
  age: { type: Number, required: false },
  civilStatus: { type: String, required: false },
  schoolOccupation: { type: String, required: false },
  gradeCompany: { type: String, required: false },
});

const checklistItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const renewalQueueSchema = new mongoose.Schema(
  {
    studentNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    name: { type: String, required: true },
    personalInfo: {
      profilePicture: {type: String, default: null},
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
      numberOfSiblings: [siblingsSchema],
    },
    healthCondition: {
      weight: { type: Number, required: true },
      height: { type: Number, required: true },
      glasses: { type: Boolean, required: true },
      illnesses: [illnessSchema],
      comments: { type: String, required: false },
    },
    hobbies: [{ type: String, required: false }],
    talentsSkills: [{ type: String, required: false }],
    leisureTime: [{ type: String, required: false }],
    status: {
      type: String,
      enum: ['Renewal', 'Approved', 'Rejected'],
      default: 'Renewal',
    },
    queueType: {
      type: String,
      enum: ['MaleQueue', 'FemaleQueue'], // Maintain gender-based queue separation
    },
    checklist: {
      type: [checklistItemSchema],
      default: [
        { item: 'Paid fee', completed: false },
        { item: 'Violations History', completed: false },
      ],
    },
    screeningSchedule: { type: Date, default: null },
    deadline: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
    renewalStatus: { type: String, required: true, 
      enum: ['Started', 'Pending', 'Approved', 'Rejected'] 
    },
    renewalDeadline: { type: Date, required: true },
  },
  { timestamps: true }
);

renewalQueueSchema.index({ studentNo: 1 });
renewalQueueSchema.index({ queueType: 1, status: 1 });
renewalQueueSchema.index({ submittedAt: 1 });

module.exports = mongoose.model('renewal-queue', renewalQueueSchema);
