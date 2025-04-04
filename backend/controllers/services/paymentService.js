const CurrentStudent = require('../../models/CurrentStudent');
const Payments = require('../../models/PaymentModel');



const getAllStudent = async () => {
    try {
        return await CurrentStudent.find();
    } catch (error) {
        throw new Error(`Error retrieving all the current students: ${error.message}`);
    }
};    

const addPayment = async (paymentData) => {
    try{
        const { name, studentNo, transactionNo, paymentDate, amount, paymentBy, remarks } = paymentData;
        
        const student = await CurrentStudent.findOne({ studentNo });
        if (!student) {
            throw new Error('Student not found');
        }


        const newPayment = new Payments({
            name,
            studentNo,
            transactionNo,
            paymentDate,
            amount,
            paymentBy,
            remarks,
        });


        await newPayment.save();
        return newPayment;

    } catch (error) {
        throw new Error(`Error adding payment: ${error.message}`);
    }
};

const getStudentPayments = async (studentNo, page, limit) => {
    try {
        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch payments with pagination
        const payments = await Payments.find({ studentNo })
            .sort({ paymentDate: -1 }) // Sort by payment date, newest first
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate the total amount of all payments for the student
        const totalPayments = await Payments.countDocuments({ studentNo });
        const totalAmount = await Payments.aggregate([
            { $match: { studentNo } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
        ]);

        return {
            payments,
            totalPayments,
            totalAmount: totalAmount[0] ? totalAmount[0].totalAmount : 0, // If no payments, return 0
        };
    } catch (error) {
        throw new Error(`Error retrieving payments: ${error.message}`);
    }
};

module.exports = { getAllStudent, addPayment, getStudentPayments};