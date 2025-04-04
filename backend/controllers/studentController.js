const studentService = require('../controllers/services/studentService');
const userModel = require('../models/studentModel.js');
const { sendEmail } = require('./services/emailService.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// NOTE: This part is for only inject account details
/* Test Query 
{
    "Student_no": "000999",
    "firstName": "John",
    "middleName": "Paul",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "password": "password123"
}

*/

const registerStudent = async (req, res) =>{
    try{
        const {Student_no, firstName, middleName, lastName, email, password, sex } = req.body;

        if (!sex || (sex !== "Male" && sex !== "Female")) {
            return res.status(400).json({ message: "Invalid or missing 'sex' field." });
        }

        const name = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

        var student = await studentService.createUserDBService(Student_no, firstName, middleName, lastName, email, password, name, sex, verificationToken, verificationTokenExpires);
        
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        await sendEmail(
            email, 
            "Verify Your Email", 
            "verifyEmail", 
            { name, email, formattedDate, verificationLink }
        );
        
        res.status(201).json(student);
    } catch (error){
        res.status(400).json({ message: error.message });
    }
    
}


const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Invalid verification link." });
        }

        const user = await userModel.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        // Check if the token has expired
        if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
            return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
        }

        // Mark the email as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now log in." });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

        // Generate new token
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        await sendEmail(
            user.email, 
            "Verify Your Email", 
            "verifyEmail", 
            { name: user.name, email: user.email, formattedDate, verificationLink }
        );

        res.status(200).json({ message: "Verification email resent. Please check your inbox." });

    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Your email is not verified. Please check your email.",
                resendVerificationLink: `${process.env.FRONTEND_URL}/resend-verification?email=${user.email}`
            });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // Save the token and expiry in the user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Send the reset password email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        await sendEmail(
            email,
            "Password Reset Request",
            "resetPasswordEmail",
            { name: user.name, email: user.email, formattedDate, resetLink }
        );

        res.status(200).json({ message: "Password reset email sent. Please check your inbox." });
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again." });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find the user by the reset token and check if it has expired
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);


        // Update the user's password and clear the reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

const loginStudent = async (req,res) =>{
    try {
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({error: "Email and password are required"});
        }

        const {user, token} = await studentService.loginUser(email, password);

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Your email is not verified. Please check your email.",
                resendVerificationLink: `${process.env.FRONTEND_URL}/resend-verification?email=${user.email}`
            });
        }

        res.status(200).json({
            message: 'Login successful',
            user: user,
            token: token
        });
        
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
}



module.exports = { registerStudent, loginStudent, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword };