const userModel = require('../../models/studentModel');
const jwt = require('jsonwebtoken');

const createUserDBService = async (Student_no, firstName, middleName, lastName, email, password, name, sex, verificationToken, verificationTokenExpires) => {

    const studentExists = await userModel.findOne({ email, Student_no });
    if (studentExists) {
        return {
            code: 400,
            status: "error",
            message: "Student email already exists."
        };
    }

    const student = new userModel({Student_no, firstName, middleName, lastName, email, password, name, sex, verificationToken, verificationTokenExpires});
    await student.save();
    return {
        code: 201,
        status: "success",
        data: student
    };
};


const loginUser = async (email, password) => {

    const user = await userModel.findOne({ email });
    if (!user) {
        throw new Error("Student not found.");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch){
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        { 
            PK: user.PK, 
            Student_no: user.Student_no,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            sex: user.sex,
        },
        process.env.JWT_SECRET_KEY,
        {expiresIn: '2h'}
    )

    return {user, token};
};


module.exports = { createUserDBService, loginUser}; 