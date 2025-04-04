const jwt = require('jsonwebtoken');
const studentModel = require('../../models/studentModel');
const adminModel = require('../../models/adminModel');
const blacklist = new Set();

//============== +++++++++++ ============== //
// ============== STUDENT SIDE ============== //
//============== +++++++++++ ============== //

// AUTHENTICATE THE JWT TOKEN OF THE STUDENT
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(403).json({ error: "Access denied, token missing" });
    }

    if (blacklist.has(token)) {
        return res.status(403).json({ error: "Token is invalid or blacklisted" });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }

        req.user = decoded;  // Attach decoded data to req.user
        next();  // Proceed to the next middleware
    });
};


// GET STUDENT INFORMATION
const getUserProfile = async (req, res) => {
    try {
        const student = await studentModel.findOne({ PK: req.user.PK }).select('firstName middleName lastName name PK email Student_no sex'); 
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//============== +++++++++++ ============== //
// ============== ADMIN SIDE ============== //
//============== +++++++++++ ============== //

// AUTHENTICATE THE JWT TOKEN OF THE ADMIN
const authenticateAdminJWT = (req, res, next) => {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token is found, deny access
    if (!token) {
        return res.status(403).json({ error: "Access denied, token missing" });
    }

    if (blacklist.has(token)) {
        return res.status(403).json({ error: "Token is invalid or blacklisted" });
    }

    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }

        // Store decoded user data in request object for further use
        req.admin = decoded;

        // Role-based access control check
        if(req.admin.role !== "Admin" && req.admin.role !== "Custodian"){
            return res.status(403).json({ error: "You do not have sufficient privileges"});
        }


        next();  // Proceed to the next middleware or route handler
    });
};

// GET ADMIN information
const getAdminProfile = async (req, res) => {
    try {
        const admin = await adminModel.findOne({ PK: req.admin.PK }).select('name PK role phoneNum email'); // Fetch only name and PK
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};    










// This Logout function is for every user
const logout = (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        blacklist.add(token);
        res.status(200).json({ message: "Logged out successfully" });
    } else {
        res.status(400).json({ error: "No token provided" });
    }
};


module.exports = {authenticateJWT, getUserProfile, getAdminProfile, authenticateAdminJWT, logout};
