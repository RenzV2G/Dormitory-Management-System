const roomService = require('./services/roomService');
const { sendEmail } = require('./services/emailService.js');
const ActivityLog = require('../models/ActivityLogModel.js');


const createRooms = async (req, res) => {
  try {
    const result = await roomService.createRooms();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating rooms:', error);
    res.status(500).json({ message: 'Error creating rooms', error: error.message });
  }
};

const fetchUnassignedStudents = async(req, res) => {
  try{
    const students = await roomService.getUnassignedStudents();
    res.status(200).json({ students });
  } catch (error) {
    console.error('Error fetching unassigned students:', error);
    res.status(500).json({ message: error.message });
  }
};

const fetchAvailableRooms  = async(req, res) => {
  try{
    const { sex } = req.query;
    if (!sex) {
      return res.status(400).json({ message: "Sex parameter is required" });
    }
    const rooms = await roomService.getAvailableRoomsandBedsByGender(sex);
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignRoomToStudent = async (req, res) => {
  try {
    const { studentNo, roomNumber, bedLetter } = req.body;

    const student = await roomService.assignRoomToStudent(studentNo, roomNumber, bedLetter);

    const { name, email, roomAssigned } = student; 
    const { roomNumber: assignedRoomNumber, building, bedLetter: assignedBedLetter } = roomAssigned;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });


    await sendEmail(
        email,
        "You have been re/allocated to your dormitory room!",
        "roomEmail",  
        {
          formattedDate,
          name,
          assignedRoomNumber,
          building,
          assignedBedLetter,
        }
    );

    const adminName = req.admin.name;
    const activity = new ActivityLog({
      action: 'Assigned room to student',
      admin: adminName,
      targetStudent: student.studentNo,
      details: `Assigned ${roomNumber} (Bed ${bedLetter}) to student ${student.name}.`
    });

    await activity.save();



    res.status(200).json({ message: 'Room assigned successfully', student });
  } catch (error) {
    console.error('Error assigning room:', error);
    res.status(500).json({ message: error.message });
  }
}

const fetchStudentsWithRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;

    const { students, totalStudents } = await roomService.getStudentsWithRooms(page, limit);

    const formattedStudents = students.map(student => {
      const { name, roomAssigned, _id } = student;
      const { roomNumber, bedLetter, building } = roomAssigned;
      const roomDetails = `${roomNumber}(${bedLetter})`;
      return { name, _id, roomDetails, building };
    });


    const totalPages = Math.max(Math.ceil(totalStudents / limit), 1);

    res.status(200).json({
      students: formattedStudents,
      totalStudents,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching students with assigned rooms:', error);
    res.status(500).json({ message: 'Error fetching students with assigned rooms', error: error.message });
  }
};


const removeStudentRoom = async (req, res) => {
  try {
    const { _id } = req.params;

    const result = await roomService.removeRoom(_id);
    if (!result) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const adminName = req.admin.name;
    const { studentNo, name } = result;

    const activity = new ActivityLog({
      action: 'Removed student room',
      admin: adminName,
      targetStudent: studentNo,
      details: `Removed room assignment for student ${name}.`
    });

    await activity.save();

    res.status(200).json({ message: 'Room assignment removed successfully' });

  } catch (error) {
    console.error('Error removing room assignment:', error);
    res.status(500).json({ message: 'Failed to remove room assignment', error: error.message });
  }
}


const fetchOccupiedRooms = async (req, res) => {
  try {
    const { sex, building } = req.query;

    if (!sex || !building) {
      return res.status(400).json({ message: 'Both sex and building parameters are required' });
    }

    const rooms = await roomService.fetchOccupiedRoomsByGender(sex, building);

    res.status(200).json({ rooms });
  } catch (error) {
    console.error('Error fetching occupied rooms:', error);
    res.status(500).json({ message: error.message });
  }
};


const getAllAvailableRoomCounts = async (req, res) => {
  try{
    const result = await roomService.getAvailableRoomCounts();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching available room counts:', error);
    res.status(500).json({ message: error.message });
  }
}





module.exports = { createRooms, fetchUnassignedStudents, fetchAvailableRooms, assignRoomToStudent, fetchStudentsWithRooms, removeStudentRoom, fetchOccupiedRooms, getAllAvailableRoomCounts};