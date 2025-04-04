const adminModel = require('../../models/adminModel');
const jwt = require('jsonwebtoken');

const createAdminDBService = async(name, role, email, phoneNum, password, pin) => {
    const adminExists = await adminModel.findOne({ email, name });
    if(adminExists) {
        return{
            code: 400,
            status: "error",
            message: "Admin email already exists"
        };
    }

    const admin = new adminModel({name, role, email, phoneNum, password, pin});
    await admin.save();

    return{
        code: 201,
        status: "success",
        data: admin
    };
};

// const loginAdmin = async (email, password) => {
    
//     const admin = await adminModel.findOne({ email });
//     if (!admin) {
//         throw new Error("Admin user not found.");
//     }

//     const isMatch = await admin.matchPassword(password);
//     if(!isMatch){
//         throw new Error("Invalid credentials");
//     }

//     const token = jwt.sign(
//         { 
//             PK: admin.PK,
//             name: admin.name,
//             role: admin.role
//         },
//         process.env.JWT_SECRET_KEY,
//         {expiresIn: '5h'}
//     )

//     return {admin, token};
// };

const validateAdminCredentials = async (email, password) => {
    const admin = await adminModel.findOne({ email });
    if (!admin) {
        throw new Error("Admin user not found.");
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    return admin;
};

const validateAdminPin = async (adminId, pin) => {
    const admin = await adminModel.findById(adminId);
    if (!admin) {
        throw new Error("Admin user not found.");
    }

    const isPinMatch = await admin.matchPin(pin);
    if (!isPinMatch) {
        throw new Error("Invalid PIN");
    }

    const token = jwt.sign(
        {
            PK: admin.PK,
            name: admin.name,
            role: admin.role
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '5h' }
    );

    return { admin, token };
};


const getAllAdminsDBService = async () => {
    try {
        return await adminModel.find({}, 'name role email phoneNum');
    } catch (error) {
        throw new Error('Failed to fetch admins: ' + error.message);
    }
};

const getAdminById = async (adminId) => {
    try {
        return await adminModel.findById(adminId);
    } catch (error) {
        throw new Error('Failed to fetching admin: ' + error.message);
    }
};

const deleteUser = async (adminId) => {
    try {
        return await adminModel.findByIdAndDelete(adminId);
    } catch (error) {
        throw new Error('Failed to delete admin: ' + error.message);
    }
}

const updateUser = async (adminId, name, phoneNum) => {
    try{
        const admin = await adminModel.findByIdAndUpdate(
            adminId,
            { name, phoneNum},
            { new: true }
        );

        if (!admin) throw new Error("Invalid credentials");

        return admin;

    } catch (error) {
        throw new Error('Failed to update admin: ' + error.message);
    }
}



module.exports = { createAdminDBService, getAllAdminsDBService, getAdminById, deleteUser, updateUser, validateAdminPin, validateAdminCredentials };