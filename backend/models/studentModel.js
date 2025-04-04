const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const studentSchema = new mongoose.Schema({
    PK: { type: String, unique: true },
    Student_no: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: {type: String},
    lastName: {type: String, required: true},
    name: {type: String, required: true},
    email: { type: String, required: true, unique: true },
    sex: { type: String, enum: ["Male", "Female"], required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, 
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
});

studentSchema.pre('save', async function (next) {
    if (this.isModified('password') && !this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (!this.isModified('PK')) {
        this.PK = `USER#${this.Student_no}`;
    } else {
        return next(new Error("Student number is required"));
    }

    next();
});


studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('student_users', studentSchema);