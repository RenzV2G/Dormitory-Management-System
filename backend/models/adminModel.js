const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');


const adminSchema = new mongoose.Schema({
    PK: { type: String, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Custodian'] },
    email: { type: String, required: true, unique: true },
    phoneNum: {type: String, required: true, unique: true},
    password: { type: String, required: true },
    pin: { type: String, required: true },
});


adminSchema.pre('save', async function (next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified('pin')) { 
        this.pin = await bcrypt.hash(this.pin, 10);
    }

    if(!this.isModified('PK')){
        const uuid = uuidv4();
        this.PK = `USER#${uuid.slice(0, 25)}`;
    } 

    next();
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

adminSchema.methods.matchPin = async function (enteredPin) { 
    return await bcrypt.compare(enteredPin, this.pin);
};


module.exports = mongoose.model('admin_users', adminSchema);