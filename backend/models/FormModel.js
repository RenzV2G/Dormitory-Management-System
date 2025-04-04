const mongoose = require('mongoose');


// Set to false if the user has no illness at all
const illnessSchema = new mongoose.Schema({
  name: { type: String, required: false },
  age: { type: Number, required: false },
});

// Set to false if the user has no siblings at all
const siblingsSchema = new mongoose.Schema({
    name: { type: String, required: false},
    classification: { type: String , required: false},
    sex: { type: String, enum: ['Male', 'Female'] , required: false},
    age: { type: Number , required: false},
    civilStatus: { type: String , required: false},
    schoolOccupation: { type: String , required: false},
    gradeCompany: { type: String, required: false},
});

const checklistItemSchema = new mongoose.Schema({
    item: { type: String, required: true },
    completed: { type: Boolean, default: false }
  });
  

const formSchema = new mongoose.Schema({
    studentNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true},
    middleName: { type: String},
    lastName: { type: String, required: true},
    name: { type: String, required: true },
    personalInfo: {
        profilePicture: {type: String, default: null},
        course: { type: String, required: true },
        yearLevel: { type: String, required: true },
        sex: { type: String, enum:["Male", "Female"], required: true },
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
                city:{ type: String, required: true },
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
                city:{ type: String, required: true },
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
            maritalStatus: { type: String, required: true},
            parentsMarriage: { type: Boolean, required: true},
            guardianDetails: {
                name: {type: String, required: true},
                occupation: {type: String, required: true},
                relation: {type: String, required: true},
            },
            languageSpoken: {type: String, required: true},
            noOfChildren: {type: Number, required: true},
            ordinalPosition: {type: String, required: true},
            AverageMonthlyIncome: {type: String, required: true}
        },
        numberOfSiblings: [siblingsSchema],
    },
    healthCondition: {
        weight: { type: Number, required: true },
        height: { type: Number, required: true },
        glasses: { type: Boolean, required: true},
        illnesses: [illnessSchema] ,
        comments: { type: String, required: false },
    },
    hobbies: [{ type: String, required: false }],
    talentsSkills: [{ type: String, required: false }],
    leisureTime: [{ type: String, required: false }],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    queueType: {
        type: String,
        enum: ['MaleQueue', 'FemaleQueue'], // Restrict to MaleQueue or FemaleQueue
        // required: true,
    },
    checklist: {
        type: [checklistItemSchema],
        default: [
            { item: 'Medical Certificate', completed: false },
            { item: 'Chest x-ray', completed: false },
            { item: 'Hepa B test', completed: false },
            { item: 'Stool test', completed: false },
            { item: 'Urine test', completed: false },
            { item: 'Vaccine card', completed: false },
            { item: '1mnth advance', completed: false },
            { item: '1mnth deposit', completed: false },
            { item: 'Utility deposit', completed: false },
            { item: 'Mineral water', completed: false },
        ]
    },
    screeningSchedule: {type: Date, default: null},
    deadline: {type: Date, default: null},
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

formSchema.index({ studentNo: 1 });
formSchema.index({ queueType: 1, status: 1 });
formSchema.index({ submittedAt: 1 });

module.exports = mongoose.model('forms-queue', formSchema);

/*
{
    "course": "Computer Science",
    "yearLevel": "3rd Year",
    "sex": "Male",
    "dateOfBirth": "2002-01-15",
    "placeOfBirth": "Mabalacat City",
    "age": "22",
    "religion": "Christianity",
    "nationality": "Filipino",
    "civilStatus": "Single",
    "homeAddress": {
        "country": "Philippines",
        "city": "Angeles City",
        "zipCode": "2009",
        "province": "Pampanga",
        "houseNumber": "123"
    },
    "facebookAcct": "johndoe",
    "telNo": "123456789",
    "fatherDetails": {
        "name": "John Doe Sr.",
        "dateOfBirth": "1975-04-10",
        "age": "48",
        "placeOfBirth": "Manila",
        "homeAddress": {
            "country": "Philippines",
            "city": "Angeles City",
            "zipCode": "2009",
            "province": "Pampanga",
            "houseNumber": "456"
        },
        "telNo": "987654321",
        "religion": "Christianity",
        "nationality": "Filipino",
        "occupation": "Engineer",
        "nameOfEmployer": "XYZ Corp"
    },
    "motherDetails": {
        "name": "Jane Doe",
        "dateOfBirth": "1978-05-12",
        "age": "45",
        "placeOfBirth": "Manila",
        "homeAddress": {
            "country": "Philippines",
            "city": "Angeles City",
            "zipCode": "2009",
            "province": "Pampanga",
            "houseNumber": "456"
        },
        "telNo": "987654321",
        "religion": "Christianity",
        "nationality": "Filipino",
        "occupation": "Teacher",
        "nameOfEmployer": "ABC School"
    },
    "parentStatus": {
        "maritalStatus": "Married",
        "parentsMarriage": true,
        "guardianDetails": {
            "name": "Guardian Name",
            "occupation": "Guardian Occupation",
            "relation": "Uncle"
        },
        "languageSpoken": "English, Tagalog",
        "noOfChildren": 3,
        "ordinalPosition": "1st",
        "AverageMonthlyIncome": "Php 50,000"
    },
    "numberOfSiblings": [
        {
            "name": "Sibling 1",
            "classification": "Younger",
            "sex": "Female",
            "age": 18,
            "civilStatus": "Single",
            "schoolOccupation": "Student",
            "gradeCompany": "12th Grade"
        }
    ],
    "weight": 65,
    "height": 170,
    "glasses": true,
    "illnesses": [
        { "name": "Asthma", "age": 10 }
    ],
    "comments": "No other illnesses.",
    "hobbies": ["Reading", "Cycling"],
    "talentsSkills": ["Programming", "Drawing"],
    "leisureTime": ["Watching movies", "Playing video games"]
}
    */