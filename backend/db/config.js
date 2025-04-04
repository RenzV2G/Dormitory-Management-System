const mongoose = require("mongoose");

var CONNECTION_URI = process.env.MONGO_URI; //Database environment credentials

const connectDB = async () => {
    try{
        await mongoose.connect(CONNECTION_URI);
        console.log("Connected to MongoDB");

    } catch (err){
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;