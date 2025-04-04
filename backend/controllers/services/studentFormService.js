const FormModel = require('../../models/FormModel');
const CurrentStudent = require('../../models/CurrentStudent');
const ConfigModel = require('../../models/configModel');
const RenewalQueue = require('../../models/RenewalModel');
const moment = require('moment-timezone');


const checkIfFormExists = async (studentNo) => {
    try {
        return await FormModel.exists({ studentNo, status: 'Pending' });
    } catch (error) {
        console.error("Error checking form existence:", error.message);
        throw new Error('Error checking form existence');
    }
};

const checkFormInfo = async (studentNo) => {
    try {
        return await FormModel.findOne({ studentNo, status: 'Pending' });
    } catch (error) {
        console.error("Error checking form existence:", error.message);
        throw new Error('Error checking form existence');
    }
}

const submitForm = async (newFormData) => {
    try {
        const newForm = new FormModel(newFormData);
        await newForm.save();
        return newForm;
    } catch (error) {
        console.error("Error in submitForm:", error.message);
        throw new Error('Error while submitting the form');
    }
};

const getQueueCount = async (queueType) => {
    return FormModel.countDocuments({ queueType });
};

const getAllQueueCount = async () =>{
    return await FormModel.countDocuments({ status: "Pending" })
}

const getApprovedCountBySex = async (sex) => {
    try {
        return await CurrentStudent.countDocuments({ "personalInfo.sex": sex });
    } catch (error) {
        console.error("Error counting approved students by sex:", error);
        throw new Error("Error counting approved students");
    }
}

const cancelStudForm = async (_id) => {
    try {
        return await FormModel.findOneAndDelete({ _id, status: 'Pending' });
    } catch (error) {
        console.error("Error in cancelForm:", error.message);
        throw new Error('Error while cancelling the form');
    }
};


const getStudentQueue = async (queueType, page = 1) =>{
    try {
        const studentsPerPage = 5;
        const skip = (page - 1) * studentsPerPage;

        if (!['MaleQueue', 'FemaleQueue'].includes(queueType)) {
            throw new Error('Invalid queue type');
        }

        const totalStudents = await FormModel.countDocuments({ queueType });
        const totalPages = Math.ceil(totalStudents / studentsPerPage);

        const students = await FormModel.find({ queueType })
            .skip(skip)
            .limit(studentsPerPage)
            .sort({ submittedAt: 1 });



        return {
            students,
            totalStudents,
            totalPages,
            currentPage: page
        };
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching student queue');
    }
}

const getStudentFormById = async (_id) => {
    try {
        return await FormModel.findById(_id);
    } catch (error) {
        console.error("Error fetching student form by ID:", error.message);
        throw new Error("Error fetching student form by ID");
    }
}

const scheduleInterview = async (_id, scheduledDateTime, deadlineDateTime) => {
    try {
        const updatedStudent = await FormModel.findByIdAndUpdate(
          _id,
          {
            screeningSchedule: scheduledDateTime,
            deadline: deadlineDateTime
          },
          { new: true }  // Return the updated document
        );
    
        return updatedStudent;
      } catch (error) {
        console.error('Error updating schedule and deadline:', error);
        throw error;
      }
};
  

// Reject Student Form
const deleteStudentForm = async (_id) => {
    try {
        return await FormModel.findByIdAndDelete(_id);
    } catch (error) {
        throw new Error("Error deleting student form: " + error.message);
    }
}


// Approve Student Form
const approveStudent = async (studentNo) => {
    try {
        const existingApprovedStudent = await CurrentStudent.findOne({ studentNo });
        if (existingApprovedStudent) {
          throw new Error('Student is already approved.');
        }

        const studentForm = await FormModel.findOne({ studentNo });
        if (!studentForm) {
          throw new Error('Student form not found.');
        }

        const approvalTimestamp = new Date();

        const approvedStudent = new CurrentStudent({
            studentNo: studentForm.studentNo,
            email: studentForm.email,
            firstName: studentForm.firstName,
            middleName: studentForm.middleName,
            lastName: studentForm.lastName,
            name: studentForm.name,
            personalInfo: studentForm.personalInfo,
            familyBackground: studentForm.familyBackground,
            healthCondition: studentForm.healthCondition,
            hobbies: studentForm.hobbies,
            talentsSkills: studentForm.talentsSkills,
            leisureTime: studentForm.leisureTime,
            status: 'Approved', // Set status to approved
            numberOfSiblings: studentForm.familyBackground.numberOfSiblings, // Include numberOfSiblings
            submittedAt: studentForm.submittedAt,
            approvedAt: approvalTimestamp,
        });

        await approvedStudent.save();

        await FormModel.deleteOne({ studentNo });

        return { message: 'Student approved and moved to CurrentStudents.' };
    } catch (error) {
        throw new Error('Error approving student: ' + error.message);
    }
} 

const checkIfAlreadyApproved = async (studentNo) => {
    try {
        return await CurrentStudent.exists({ studentNo, status: 'Approved' });
    } catch (error){
        throw new Error('Error checking student approval status.');
    }
};

const checkIfUnderRenewal = async (studentNo) => {
    try {
        return await RenewalQueue.exists({ studentNo });
    } catch (error){
        throw new Error('Error checking student approval status.');
    }
}

const checker = async (studentNo) => {
    try {
        return await FormModel.findOne({ studentNo });
    } catch (error){
        throw new Error('Error checking student approval status.');
    }
};

const getStudentInfo = async (studentNo) => {
    try{
        const submittedForm = await FormModel.findOne({ studentNo, status: 'Pending' });

        const approvedStudent = await CurrentStudent.findOne({ studentNo, status: 'Approved' });

        const renewalStudent = await RenewalQueue.findOne({ studentNo });

        if (approvedStudent) {
            return { status: 'Approved', data: approvedStudent };
        } else if (renewalStudent) {
            return { status: 'Renewal', data: renewalStudent };
        } else if (submittedForm) {
            return { status: 'Submitted', data: submittedForm };
        } else {
            return null; 
        }

    } catch (error){
        console.error("Error fetching student info:", error.message);
        throw new Error('Error fetching student information');
    }
}


const checkSubmissionStatus = async () => {
    try{
        let lockStatus = await ConfigModel.findOne();
    
        if (!lockStatus) {
          lockStatus = new ConfigModel({
            lockedGenders: [] 
          });
          await lockStatus.save();
        }

        return lockStatus;
    } catch (error){
        console.error('Error during checkSubmissionStatus:', error);
        throw new Error('Error fetching lock status or creating new config');
    }
};

const updateSubmissionLock = async (isLocked) => {
    const check = await checkSubmissionStatus();
    if (!check) {
        throw new Error('Config not found');
    }

    if (check.formSubmissionLocked !== isLocked) {
        check.formSubmissionLocked = isLocked;
        await check.save();
    }
};



// FOR AUTO DELETION
const checkExpiredForms = async () => {
    try {
        const manilaTime = moment.tz('Asia/Manila');
        const utcTime = manilaTime.utc();

        const expiredForms = await FormModel.find({
            status: 'Pending',
            deadline: { $lt: utcTime }, 
            $or: [
                { checklist: { $exists: false } },
                { 'checklist.completed': false }
            ]
        });

        const expiredRenewals = await RenewalQueue.find({
            renewalStatus: ['Pending', 'Started'], 
            renewalDeadline: { $lt: utcTime }, 
            $or: [
                { checklist: { $exists: false } },
                { 'checklist.completed': false }
            ]
        });

        return { expiredForms, expiredRenewals };

    } catch (error) {
        console.error("Error in checking expired forms:", error.message);
        throw new Error("Error during auto-deletion of expired forms.");
    }
};

const toDeleteExpiredForms = async (_id) => {
    try {
        return await FormModel.findByIdAndDelete(_id);
    } catch (error) {
        console.error("Error deleting student form:", error.message);
        throw new Error("Error during auto-deletion of expired student forms.");
    }
};

const toDeleteExpiredRenewals = async (_id) => {
    try {
        return await RenewalQueue.findByIdAndDelete(_id);
    } catch (error) {
        console.error("Error deleting renewal form:", error.message);
        throw new Error("Error during auto-deletion of expired renewal forms.");
    }
};


module.exports = { getApprovedCountBySex, getAllQueueCount, checkFormInfo, checkSubmissionStatus, checkIfFormExists, submitForm, getQueueCount, cancelStudForm, getStudentQueue, getStudentFormById, checkExpiredForms, toDeleteExpiredForms, toDeleteExpiredRenewals, scheduleInterview, deleteStudentForm, approveStudent, checkIfAlreadyApproved, checkIfUnderRenewal, checker, updateSubmissionLock, getStudentInfo };