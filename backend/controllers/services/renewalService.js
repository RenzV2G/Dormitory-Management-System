const RenewalQueue = require('../../models/RenewalModel');
const CurrentStudent = require('../../models/CurrentStudent');
const roomService = require('./roomService');
const moment = require('moment-timezone');


const setRenewalDeadline = async (deadline) => {
  try {
      const studentsToMove = await CurrentStudent.find({ renewalStatus: 'NotStarted' });

      for (const student of studentsToMove) {
        await roomService.removeRoom(student._id);

        const renewalDetails = {
          ...student.toObject(),
          status: 'Renewal',
          renewalStatus: 'Started',
          renewalDeadline: deadline,
          queueType: student.personalInfo.sex === 'Male' ? 'MaleQueue' : 'FemaleQueue',
        };
  
        const renewalEntry = new RenewalQueue(renewalDetails);
        await renewalEntry.save();
      }

      await CurrentStudent.updateMany(
        { renewalStatus: 'NotStarted' },
        { renewalStatus: 'Started', renewalDeadline: deadline }
      );
  
      await CurrentStudent.deleteMany({ renewalStatus: 'Started' });

  } catch (error) {
      throw error;
  }
};

const getRenewingStudents = async () => {
  try {
    return await RenewalQueue.find({ renewalStatus: 'Started' });
  } catch (error) {
    throw error;
  }
};

const hasRenewalStarted = async () => {
  try {
    const count = await RenewalQueue.countDocuments({ renewalStatus: 'Started' });
    return count > 0;
  }catch (error) {
    throw error;
  }
}

const isUnderRenewal = async (studentNo) => {
  try {
    const student = await RenewalQueue.findOne({ studentNo });
    return !!student; 
  } catch (error) {
    throw new Error('Error checking student approval status.');
  }
}

const getRenewalByStudentNo = async (studentNo) => {
  try {
    return await RenewalQueue.findOne({ studentNo });
  } catch (error) {
    console.error("Error checking form existence:", error.message);
    throw new Error('Error checking form existence');
  }
}


// For student side to press the button
const renewStudent = async (studentNo) => {
  try {
      const renewalEntry = await RenewalQueue.findOneAndUpdate(
        { studentNo },
        { renewalStatus: 'Pending' },
        { new: true }
      );

      if (!renewalEntry) {
        throw new Error('Student not found in the renewal queue or renewal hasnt started yet');
      }

      return renewalEntry;
  } catch (error) {
      throw error;
  }
};

const checkStudentifSubmitted = async (studentNo) => {
  try {
    return await RenewalQueue.exists({ studentNo, renewalStatus: 'Pending' });
  } catch (error) {
    throw error;
  }
}

const getRenewalQueue = async (queueType, page = 1) => {
  try {
    const studentsPerPage = 5;
    const skip = (page - 1) * studentsPerPage;

    if (!['MaleQueue', 'FemaleQueue'].includes(queueType)) {
      throw new Error('Invalid queue type');
    }

    const totalStudents = await RenewalQueue.countDocuments({ queueType, renewalStatus: 'Pending' });
    const totalPages = Math.ceil(totalStudents / studentsPerPage);

    const students = await RenewalQueue.find({ queueType, renewalStatus: 'Pending' })
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
};

const getRenewalStudentByID = async (_id) => {
    try {
        return await RenewalQueue.findById(_id);
    } catch (error) {
        console.error("Error fetching student form by ID:", error.message);
        throw new Error("Error fetching student form by ID");
    }
}

const getAllRenewingStudents = async () => {
  try {
    return await RenewalQueue.find({ renewalStatus: 'Pending' });
  } catch (error) {
    console.error('Error fetching approved students: ', error);
    throw error;
  }
}


const cancelRenewal = async (studentNo) => {
  try {
    const renewalEntry = await RenewalQueue.findOne({ studentNo, renewalStatus: { $in: ['Started', 'Pending'] } });

    if (!renewalEntry) {
      return null;
    }

    const deleteResult = await RenewalQueue.deleteOne({ studentNo });

    return deleteResult.deletedCount > 0;

  } catch (error) {
    console.error('Error canceling renewal:', error);
    throw error;
  }
};

const scheduleInterview = async (_id, scheduledDateTime, deadlineDateTime) => {
    try {
        const updatedStudent = await RenewalQueue.findByIdAndUpdate(
          _id,
          {
            screeningSchedule: scheduledDateTime,
            deadline: deadlineDateTime
          },
          { new: true }  
        );
    
        return updatedStudent;
      } catch (error) {
        console.error('Error updating schedule and deadline:', error);
        throw error;
      }
};


const checker = async (studentNo) => {
    try {
        return await RenewalQueue.findOne({ studentNo });
    } catch (error){
        throw new Error('Error checking student approval status.');
    }
};

const approveRenewal = async (studentNo) => {
    try {
        const existingApprovedStudent = await CurrentStudent.findOne({ studentNo });
        if (existingApprovedStudent) {
          throw new Error('Student is already approved.');
        }

        const studentForm = await RenewalQueue.findOne({ studentNo });
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
            status: 'Approved', 
            numberOfSiblings: studentForm.familyBackground.numberOfSiblings, 
            submittedAt: studentForm.submittedAt,
            approvedAt: approvalTimestamp,
        });

        await approvedStudent.save();

        await RenewalQueue.deleteOne({ studentNo });

        return { message: 'Student approved and moved to CurrentStudents.' };
    } catch (error) {
        throw new Error('Error approving student: ' + error.message);
    }
}; 

const rejectRenewal = async (_id) => {
  try {
    return await RenewalQueue.findByIdAndDelete(_id);
  } catch (error) {
    throw new Error("Error deleting student form: " + error.message);
  }
}

const checkExpiredRenewals = async () => {
  try{
    const manilaTime = moment.tz('Asia/Manila');

    const utcTime = manilaTime.utc();

    const expiredForms = await RenewalQueue.find({
      renewalStatus: ['Pending', 'Started'],
      renewalDeadline: { $lt: utcTime },
      $or: [
        { checklist: { $exists: false } },
        { 'checklist.completed': false }
      ]
    });

    return expiredForms;
  } catch (error) {
    console.error("Error in checking expired renewal forms: ", error.message);
    throw new Error("Error during auto-deletion of expired forms.");
  }
}

const toDeleteExpiredRenewals = async (_id) => {
  try {
    return await RenewalQueue.findByIdAndDelete(_id);
  } catch (error) {
    throw new Error("Error deleting student form: " + error.message);
  }
}

const getApprovedCountBySex = async (gender) => {
      try {
          return await CurrentStudent.countDocuments({ "personalInfo.sex": gender });
      } catch (error) {
          console.error("Error counting approved students by sex:", error);
          throw new Error("Error counting approved students");
      }
};

const updateInfo = async (_id, data) => {
    try {
      return await RenewalQueue.findByIdAndUpdate(_id, data, { new: true });
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
};



module.exports = { checker, hasRenewalStarted, getRenewalByStudentNo, isUnderRenewal, getApprovedCountBySex, setRenewalDeadline, renewStudent, checkStudentifSubmitted, cancelRenewal, getRenewalQueue, getRenewalStudentByID, getAllRenewingStudents, scheduleInterview, approveRenewal, rejectRenewal, checkExpiredRenewals, toDeleteExpiredRenewals, getRenewingStudents, updateInfo};