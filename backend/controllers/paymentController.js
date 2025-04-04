const paymentService = require('./services/paymentService');
const ActivityLog = require('../models/ActivityLogModel.js');


const addPayment = async (req, res) => {
    try{
        const paymentData = req.body;
        
        const newPayment = await paymentService.addPayment(paymentData);

        const adminName = req.admin.name; 
        const studentNo = paymentData.studentNo; 
        const amount = paymentData.amount; 
        const transactionNo = newPayment.transactionNo; 

        const activity = new ActivityLog({
            action: 'Added Payment',
            admin: adminName,
            targetStudent: studentNo,
            details: `Added a payment of PHP ${amount} for student ${studentNo}. Transaction No: ${transactionNo}.`
        });

        await activity.save();

       res.status(201).json({ message: 'Payment added successfully', payment: newPayment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while adding payment' });
    }
};

const getAllCurrentStudents = async (req, res) => {
    try {
        const students = await paymentService.getAllStudent();

        if (!students || students.length === 0) {
            return res.status(200).json({ students: [], message: 'No current students found.' });
        }

        res.status(200).json({ students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching students', error: error.message });
    }
}


const getStudentPayments = async (req, res) => {
    try {
        const { studentNo } = req.params;
        const { page = 1, limit = 10 } = req.query; 

        const { payments, totalPayments, totalAmount } = await paymentService.getStudentPayments(studentNo, page, limit);

        res.status(200).json({
            payments,
            totalPayments,
            totalAmount, 
            totalPages: Math.ceil(totalPayments / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


module.exports = { getAllCurrentStudents, addPayment, getStudentPayments };