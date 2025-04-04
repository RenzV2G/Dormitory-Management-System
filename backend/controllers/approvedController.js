const approvedService = require('./services/approvedService');
const roomService = require('./services/roomService');
const ActivityLog = require('../models/ActivityLogModel.js');
const { sendEmail } = require('./services/emailService.js');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../db/awsConfig.js');

const getApprovedStudents = async (req, res) => {
    try{
        const allApprovedStudents = await approvedService.getApprovedStudents();
        res.status(200).json({ students: allApprovedStudents });
    } catch (error){
        console.error('Error fetching approved students:', error);
        res.status(500).json({ message: 'Error fetching approved students' });
    }
}

const getStudents = async (req, res) => {
    try{
      const { gender } = req.query; 
      const approvedStudents = await approvedService.getStudentsforTable(gender);
      res.status(200).json({ students: approvedStudents });
    } catch (error) {
        console.error('Error fetching approved students for table:', error);
        res.status(500).json({ message: 'Error fetching approved students for table' });
    }
}

const getStudentById = async (req, res) => {
    try{

    const { _id } = req.params; 
    const student = await approvedService.getById(_id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);

    } catch (error){
        console.error('Error fetching student by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const removeStudent = async (req, res) => {
    try {
        const { _id } = req.params;
        if (!_id) {
          return res.status(404).json({ message: 'Student not found' });
        } 
        const studentInfo = await approvedService.getById(_id);
        if (!studentInfo) {
          return res.status(404).json({ message: 'Student not found' });
        }

        if (studentInfo.personalInfo?.profilePicture) {
          const profilePictureUrl = studentInfo.personalInfo.profilePicture;
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

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        await sendEmail(
            studentInfo.email, 
            "You Have Been Removed from the Dormitory",
            "rejectionEmail",  
            { formattedDate, name: studentInfo.name }
        );

        const adminName = req.admin.name;
        const activity = new ActivityLog({
          action: 'Remove Student',
            admin: adminName,
            details: `${adminName} removed student ${studentInfo.name}`
        });

        await activity.save();

        const roomRemove = await roomService.removeRoom(_id);
        const student = await approvedService.removeStudent(_id);

        if (!student || !roomRemove) {
          return res.status(404).json({ message: 'Error in removing student' });
        }

        res.status(200).json({ message: 'Student removed successfully' });
      } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
}

const updateStudent = async (req, res) => {
    try {
      const { _id } = req.params; 
      const updatedDetails = req.body; 

      const updatedStudent = await approvedService.updateStudent(_id, updatedDetails);

      if (!updatedStudent) {
          return res.status(404).json({ message: 'Student not found' });
      }

      const student = await approvedService.getById(_id);

      const adminName = req.admin.name;
      const activity = new ActivityLog({
        action: 'Update Student',
        admin: adminName,
        details: `updated student ${student.name} info`
      });

      await activity.save();
  
      res.status(200).json({ message: 'Student details updated successfully', student: updatedStudent });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getApprovedStudents, getStudents, getStudentById, removeStudent, updateStudent };