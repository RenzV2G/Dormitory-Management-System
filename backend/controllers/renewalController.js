const renewalService = require('./services/renewalService');
const ActivityLog = require('../models/ActivityLogModel.js');
const { sendEmail } = require('./services/emailService.js');
const {  MAX_QUEUE_CAPACITY_MALE, MAX_QUEUE_CAPACITY_FEMALE, MAX_APPROVED_CAPACITY_MALE, MAX_APPROVED_CAPACITY_FEMALE } = require('../db/constants.js');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../db/awsConfig.js');

// Admin sets renewal deadline
const setRenewalDeadline = async (req, res) => {
    try {
        const { deadline } = req.body; 
        if (!deadline) {
          return res.status(400).json({ message: 'Deadline is required.' });
        }

      await renewalService.setRenewalDeadline(new Date(deadline));

      const studentsMoved = await renewalService.getRenewingStudents()

      if (!studentsMoved.length) {
        return res.status(200).json({ message: 'Renewal deadline set, but no students to notify.' });
      }

      for (const student of studentsMoved) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    
        const formattedDeadline = new Date(deadline).toLocaleString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    
        await sendEmail(
            student.email,
            "Dormitory Renewal Process Started",
            "renewalStart",
            { name: student.name, deadline: formattedDeadline, formattedDate }
        );
    }

      const adminName = req.admin.name
      const activity = new ActivityLog({
        action: 'Renewal Deadline Set',
        admin: adminName,
        details: `has set a renewal deadline (${deadline}).`,
      });

      await activity.save();

        res.status(200).json({ message: 'Renewal deadline set successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error setting renewal deadline.' });
    }
};

const checkRenewalSession = async (req, res) => {
  try{
    const renewalStarted = await renewalService.hasRenewalStarted();
    res.json({ renewalStarted });
  } catch (error) {
    res.status(500).json({ message: 'Error checking renewal session status.'})
  }
}

const checkIfStudentIsInRenewal = async (req, res) => {
  try{
    const studentNo = req.user.Student_no;

    console.log("Received studentNo:", studentNo)

    const studentInRenewal = await renewalService.isUnderRenewal(studentNo);

    res.json({ isInRenewal: !!studentInRenewal });

  } catch (error) {
    res.status(500).json({ message: 'Error checking student renewal status.' });
  }
}


// Student presses the renewal button
const renewStudent = async (req, res) => {
    try {
        const studentNo = req.user.Student_no;
        const email = req.user.email;
        const name = req.user.name;

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });


        if (!studentNo) {
          return res.status(400).json({ message: 'Student number is required.' });
        }

        const renewalEntry = await renewalService.renewStudent(studentNo);
        
        await sendEmail(
          email,
          "Dormitory Renewal Process Started",
          "renewalEmail",
          { name, formattedDate }
        );

        res.status(200).json({
          message: 'Renewal request submitted successfully.',
          renewalEntry,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getRenewalStatus = async (req, res) => {
  try {
    const studentNo = req.user.Student_no;
    if (!studentNo) {
      return res.status(400).json({ message: 'Student number is required.' });
    }

    const renewalEntry = await renewalService.checkStudentifSubmitted(studentNo);
    if (renewalEntry) {
      return res.json({ onGoingRenewal: true });
    }

    res.json({ onGoingRenewal: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching renewal status.' });
  }
};

const cancelRenewal = async (req, res) => {
  try {
    const studentNo = req.user.Student_no;
    const email = req.user.email;
    const name = req.user.name;

    if (!studentNo) {
      return res.status(400).json({ message: 'Student number is required.' });
    }

    const renewalToDelete = await renewalService.getRenewalByStudentNo(studentNo);

    if (!renewalToDelete) {
      return res.status(404).json({ message: 'No renewal request found to cancel.' });
    }

    if (renewalToDelete.personalInfo?.profilePicture) {
      const profilePictureUrl = renewalToDelete.personalInfo.profilePicture;
      const s3Key = profilePictureUrl.split('.amazonaws.com/')[1]; // Extract S3 key

      if (s3Key) {
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
        };

        try {
          await s3Client.send(new DeleteObjectCommand(deleteParams));
        } catch (s3Error) {
          console.error('❌ Error deleting profile picture from S3:', s3Error.message);
        }
      }
    }

    await req.redis.set(`cooldown:${studentNo}`, 'true', 'EX', 43200);

    const deletedRenewal = await renewalService.cancelRenewal(studentNo);
    if (!deletedRenewal) {
      return res.status(404).json({ message: 'Failed to cancel renewal. Renewal not found.' });
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

    await sendEmail(
      email, 
      "Renewal Cancellation Confirmation", 
      "cancelEmail", 
      { name, studentNo, formattedDate, email }
    );

    res.status(200).json({ message: 'Renewal canceled successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error canceling renewal.' });
  }
}

const getRenewalQueue = async (req, res) => {
      try{
          const { queueType } = req.query;
          const page = parseInt(req.query.page) || 1;
  
          const result = await renewalService.getRenewalQueue(queueType, page);
  
          res.json(result);
  
      } catch (error) {
          if (error.message === 'Invalid queue type') {
              return res.status(400).json({ message: error.message });
          } 
          return res.status(500).json({ message: 'Internal server error' });
    }
}

const getRenewalStudentByID = async (req, res) => {
  try {
    const { _id } = req.params;

    const formDetails = await renewalService.getRenewalStudentByID(_id);

    if (!formDetails) {
      return res.status(404).json({ message: "Student form not found." });
    }

    res.status(200).json(formDetails);

  } catch (error) {
    console.error("Error fetching student form by ID:", error.message);
    throw new Error("Error fetching student form by ID");
  }
}

const updateChecklistItem = async (req, res) => {
  try {
    const { _id } = req.params;
    const { item } = req.body;

    if (!item) {
      return res.status(400).json({ message: 'Checklist item is required.' });
    }

    const form = await renewalService.getRenewalStudentByID(_id);
    if (!form) {
      return res.status(404).json({ message: 'Student form not found' });
    }   

    if (!form.checklist) {
      form.checklist = [];
    }

    const checklistItem = form.checklist.find(c => c.item === item);
    if (checklistItem) {
        checklistItem.completed = !checklistItem.completed;
    } else {
        form.checklist.push({ item, completed: true });
    }

    form.markModified('checklist');

    await form.save();

    return res.status(200).json({ checklist: form.checklist });


  } catch (error) {
    console.error('Error in updateChecklist:', error);
    res.status(500).json({ message: 'Error updating checklist' });
  }
}

const setScreeningSchedule = async (req, res) => {
  try {
    const { _id } = req.params;
    const { scheduledDateTime, deadlineDateTime } = req.body;

    if (!scheduledDateTime || !deadlineDateTime) {
      return res.status(400).json({ message: 'Scheduled date and deadline are required.' });
    }

    const updatedStudent = await renewalService.scheduleInterview(_id, scheduledDateTime, deadlineDateTime);

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

    // Format the scheduled date and time for the email
    const scheduleDate = new Date(scheduledDateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const scheduleTime = new Date(scheduledDateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Format the deadline date and time for the email
    const deadlineDate = new Date(deadlineDateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const deadlineTime = new Date(deadlineDateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Send the email with the formatted dates and times
    await sendEmail(
      updatedStudent.email,
      "Dormitory Screening Schedule Set",
      "scheduleEmail",
      {
        email: updatedStudent.email,
        name: updatedStudent.name,
        studentNo: updatedStudent.studentNo,
        scheduleDate,
        scheduleTime,
        deadlineDate,
        deadlineTime,
        formattedDate
      }
    );

    const adminName = req.admin.name;
    const activity = new ActivityLog({
      action: 'Set screening schedule',
      admin: adminName,
      targetStudent: updatedStudent.studentNo,
      details: `Set screening schedule for student ${updatedStudent.name} on ${scheduleDate} at ${scheduleTime}, with a deadline of ${deadlineDate} at ${deadlineTime}.`
    });

    await activity.save();

    res.status(200).json({
      message: 'Interview schedule and deadline updated successfully.',
      scheduledDateTime: updatedStudent.screeningSchedule,
      deadlineDateTime: updatedStudent.deadline
    });


  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Error scheduling screening' });
  }
};

const approveRenewal = async (req, res) => {
  try {
    const { studentNo } = req.params;

    const currentStudent = await renewalService.checker(studentNo);
    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found." });
    }

    const gender = currentStudent.personalInfo.sex;

    const approvedCount = await renewalService.getApprovedCountBySex(gender);
    const maxCapacity = gender === "Male" ? MAX_APPROVED_CAPACITY_MALE : MAX_APPROVED_CAPACITY_FEMALE;

    if (approvedCount >= maxCapacity) {
      return res.status(400).json({ message: `No more available renewal slots for ${gender} students.` });
    }

    const result = await renewalService.approveRenewal(studentNo);
    if (result) {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

      const email = currentStudent.email;
      const name = currentStudent.name;

      await sendEmail(
        email,
        "You Have Been Approved!",
        "approvedEmail",
        { formattedDate, name }
      );
    }

    const adminName = req.admin.name;
    const activity = new ActivityLog({
      action: 'Renewal Approved student',
      admin: adminName,
      targetStudent: currentStudent.studentNo,
      details: `Approved the renewal student ${currentStudent.name} for dormitory.`
    });

    await activity.save();


    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error approving student.' });
  }
};

const rejectRenewal = async (req, res) => {
  try {
    const { _id } = req.params;
    const studentForm = await renewalService.getRenewalStudentByID(_id);

    if (!studentForm) {
      return res.status(404).json({ message: 'Student form not found.' });
    }

    if (studentForm.personalInfo?.profilePicture) {
      const profilePictureUrl = studentForm.personalInfo.profilePicture;
      const s3Key = profilePictureUrl.split('.amazonaws.com/')[1];

      if (s3Key) {
          const deleteParams = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: s3Key,
          };

          try {
              await s3Client.send(new DeleteObjectCommand(deleteParams));
          } catch (s3Error) {
              console.error('❌ Error deleting profile picture from S3:', s3Error.message);
          }
      }
  }

    await req.redis.set(`cooldown:${studentForm.studentNo}`, 'true', 'EX', 43200);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

    await sendEmail(
      studentForm.email,
      "Your Form Has Been Rejected",
      "rejectionEmail",
      { name: studentForm.name, formattedDate }
    );

    const adminName = req.admin.name;
    const activity = new ActivityLog({
      action: 'Rejected Renewal Student',
      admin: adminName,
      targetStudent: studentForm.studentNo,
      details: `Rejected the renewal student ${studentForm.name} for dormitory.`
    });

    await activity.save();


    await renewalService.rejectRenewal(_id);

    res.status(200).json({ message: 'Student form rejected, cooldown set, and email sent successfully.' });


  } catch (error) {
    console.error('Error rejecting student form:', error);
    res.status(500).json({ message: 'Error rejecting student form' });
  }
};

const getAllRenewalStudents = async (req, res) => {
      try{
          const allApprovedStudents = await renewalService.getAllRenewingStudents();
          res.status(200).json({ students: allApprovedStudents });
      } catch (error){
          console.error('Error fetching approved students:', error);
          res.status(500).json({ message: 'Error fetching approved students' });
      }
}


// Updates their information
const updateStudent = async (req, res) => {
  try {
    const studentNo = req.user.Student_no;
    const parsedBody = JSON.parse(req.body.data);
    const data = parsedBody?.data || {}; 

    const student = await renewalService.checker(studentNo);
    if (!student) {
      return res.status(404).json({ message: 'Student not found in renewal records.' });
    }

    const updatedPersonalInfo = { ...student.personalInfo, ...data.personalInfo };

    if (req.file) {
      if (req.file && student.personalInfo?.profilePicture) {
        await deleteFileFromS3(student.personalInfo.profilePicture);
      }

      updatedPersonalInfo.profilePicture = req.file.location;
    }

    data.personalInfo = updatedPersonalInfo;

    const updatedInfo = await renewalService.updateInfo(student._id, data);

    if (!updatedInfo) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(updatedInfo); 

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteFileFromS3(fileUrl) {
  if (!fileUrl) {
    return;
  }

  try {
    const url = new URL(fileUrl);
    const fileKey = url.pathname.substring(1);


    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey
    };

    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}




module.exports = { setRenewalDeadline, checkIfStudentIsInRenewal, checkRenewalSession, renewStudent, getRenewalStatus, cancelRenewal, getRenewalQueue, getRenewalStudentByID, getAllRenewalStudents, updateChecklistItem, setScreeningSchedule, approveRenewal, rejectRenewal, updateStudent };