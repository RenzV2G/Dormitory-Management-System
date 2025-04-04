const adminService = require('../controllers/services/adminService');
const ActivityLogs = require('../models/ActivityLogModel');

// NOTE: This part is for only inject account details
/* Test Query 
{
    "name" : "TestAdmin",
    "role" : "Admin",  or "Custodians"
    "email" : "JABAWORKEE@gmail.com",
    "phoneNum" : "099982322142",
    "password" : "Password123"
}
*/

const registerAdmin = async (req, res) => {
    try{
        const{name, role, email, phoneNum, password, pin} = req.body;

        if (pin.length !== 6 || isNaN(pin)) {
            return res.status(400).json({ message: 'PIN must be a 6-digit number.' });
        }

        var admin = await adminService.createAdminDBService(name, role, email, phoneNum, password, pin);
        res.status(201).json(admin);
    } catch (error){
        res.status(400).json({ message: error.message });
    }
}

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const admin = await adminService.validateAdminCredentials(email, password);

        return res.status(200).json({ message: "PIN required", adminId: admin._id });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

const validatePin = async (req, res) => {
    try {
        const { adminId, pin } = req.body;

        if (!adminId || !pin) {
            return res.status(400).json({ error: "Admin ID and PIN are required." });
        }

        const { admin, token } = await adminService.validateAdminPin(adminId, pin);

        return res.status(200).json({ message: "Admin login successful", admin, token });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};


const getAllAdmins = async (req, res) => {
    try {
        const admins = await adminService.getAllAdminsDBService();
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminById = async (req, res) => {
    try {
        const adminId = req.params._id;

        const admin = await adminService.getAdminById(adminId);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        res.status(200).json(admin);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userRole = req.admin.role;
        if (userRole !== 'Admin') {
            return res.status(403).json({ message: 'Permission denied. Admins only.' });
        }



        const adminId = req.params._id;
        await adminService.deleteUser(adminId);

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const updateUser = async (req, res) => {
    try{
        const userRole = req.admin.role;
        if (userRole !== 'Admin') {
            return res.status(403).json({ message: 'Permission denied. Admins only.' });
        }


        const { name, phoneNum } = req.body;
        const adminId = req.params._id;

        const admin = await adminService.updateUser(adminId, name, phoneNum);

        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        res.status(200).json(admin);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLogs.find().sort({ timestamp: -1 });  
        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving activity logs' });
    }
}


module.exports = { registerAdmin, loginAdmin, getAllAdmins, getAdminById, deleteUser, updateUser, getActivityLogs, validatePin };