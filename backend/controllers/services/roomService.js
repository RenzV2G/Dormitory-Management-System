const Room = require('../../models/RoomsModel');
const CurrentStudent = require('../../models/CurrentStudent');

const createRooms = async () => {
  try {
    const roomsToCreate = [];

    const createBuildingRooms = (buildingPrefix, shortCode, startRoomNumber, endRoomNumber, sex, buildingName, roomTypes) => {
      for (let roomNumber = startRoomNumber; roomNumber <= endRoomNumber; roomNumber++) {
        const roomName = `${shortCode}${roomNumber}`; 
        let capacity, roomType;

        if (roomTypes.single.includes(roomNumber)) {
          roomType = 'Single';
          capacity = 1;
        } else if (roomTypes.double.includes(roomNumber)) {
          roomType = 'Double';
          capacity = 2;
        } else if (roomTypes.quad.includes(roomNumber)) {
          roomType = 'Quad';
          capacity = 4;
        } else if (roomTypes.hexa.includes(roomNumber)) {
          roomType = 'Hexa';
          capacity = 6;
        } else {
          continue; // Skip if room type is not specified
        }

        const availableBeds = Array.from({ length: capacity }, (_, index) => String.fromCharCode(65 + index));

        roomsToCreate.push({
          roomNumber: roomName,
          capacity,
          sex,
          building: buildingName,
          roomType,
          availableBeds,
          occupiedBeds: [],
        });
      }
    };

    // Create male rooms in Plaza de Corazon (PDC)
    createBuildingRooms('Room', 'PDC', 301, 306, 'Male', 'Plaza de Corazon', {
      single: [],
      double: [304, 305, 306],
      quad: [301, 302, 303],
      hexa: []
    });

    createBuildingRooms('Room', 'PDC', 401, 406, 'Male', 'Plaza de Corazon', {
      single: [],
      double: [],
      quad: [402, 404, 405, 406],
      hexa: [401, 403]
    });

    // Create female rooms in St. Martha (SMH)
    createBuildingRooms('Room', 'SMH', 201, 208, 'Female', 'St. Martha', {
      single: [],
      double: [],
      quad: [201, 202, 203, 204, 205, 206, 207, 208],
      hexa: []
    });

    createBuildingRooms('Room', 'SMH', 301, 314, 'Female', 'St. Martha', {
      single: [],
      double: [],
      quad: [301, 302, 303, 304, 305, 306, 307, 308, 309, 311, 312, 313],
      hexa: [310, 314]
    });

    // Save rooms to the database
    await Room.insertMany(roomsToCreate);

    return { message: 'Rooms created successfully!' };
  } catch (error) {
    console.error('Error creating rooms:', error);
    throw new Error('Error creating rooms');
  }
};



const getUnassignedStudents = async() => {
    try {
        return await CurrentStudent.find({ roomAssigned: null });
    } catch (error) {
        console.error('Error fetching unassigned students:', error);
        throw new Error('Error fetching unassigned students');
    }
};

const getAvailableRoomsandBedsByGender = async (sex) => {
    try{
        return await Room.find({
            sex,
            availableBeds: { $exists: true, $not: { $size: 0 }},
        }).select('roomNumber building availableBeds roomType');
    } catch (error){
        console.error('Error fetching available rooms and beds:', error);
        throw new Error('Error fetching available rooms and beds');
    }
};

const assignRoomToStudent = async (studentNo, roomNumber, bedLetter) => {
    try {
        const student = await CurrentStudent.findOne({ studentNo });
        if(!student){
            throw new Error('Student not found');
        }

        const room = await Room.findOne({ roomNumber });
        if(!room || !room.availableBeds.includes(bedLetter)){
            throw new Error ('Room or bed not available');
        }

        if (!room.availableBeds.includes(bedLetter)) {
          throw new Error('Room or bed not available');
      }

        room.occupiedBeds.push({
            bedLetter,
            student: {
              studentNo: student.studentNo,
              name: student.name,
              contactNo: student.personalInfo.telNo,
              course: student.personalInfo.course,
              yearLevel: student.personalInfo.yearLevel
            },
        });

        room.availableBeds = room.availableBeds.filter((bed) => bed !== bedLetter);
        await room.save();

        student.roomAssigned = {
            roomNumber: room.roomNumber,
            building: room.building,
            bedLetter,
            roomType: room.roomType,
        };
        await student.save();

        return student;


    } catch (error) {
        console.error('Error assigning room:', error);
        throw new Error(error.message);
    }
};

const getStudentsWithRooms = async (page, limit) => {
  try {
    const skip = (page - 1) * limit;
    console.log(`Fetching students: page=${page}, limit=${limit}, skip=${skip}`);

    const students = await CurrentStudent.find({ 'roomAssigned.roomNumber': { $ne: null }})
      .populate('roomAssigned.roomNumber') 
      .select('name roomAssigned')
      .skip(skip) 
      .limit(limit);

    const totalStudents = await CurrentStudent.countDocuments({ 'roomAssigned.roomNumber': { $ne: null } });

    return { students, totalStudents };
  } catch (error) {
    console.error('Error fetching students with assigned rooms:', error);
    throw new Error('Error fetching students with assigned rooms');
  }
};

const removeRoom = async (_id) => {
  try {
    const student = await CurrentStudent.findById(_id);

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.roomAssigned) {
      const { roomNumber, bedLetter } = student.roomAssigned;

      const room = await Room.findOne({ roomNumber });

      if (!room) {
        throw new Error('Room not found');
      }

      const occupiedBedIndex = room.occupiedBeds.findIndex(
        bed => bed.bedLetter === bedLetter && bed.student.studentNo === student.studentNo
      );

      if (occupiedBedIndex !== -1) {
        room.occupiedBeds.splice(occupiedBedIndex, 1);

        room.availableBeds.push(bedLetter);

        await room.save();
        console.log(`Bed letter ${bedLetter} is now available for room ${roomNumber}`);
      } else {
        console.log(`Bed letter ${bedLetter} not found in occupiedBeds.`);
      }

      student.roomAssigned = null;
      await student.save();
    } else {
      console.log('No room assigned to this student.');
    }

    return student;
  } catch (error) {
    console.error('Error in removeRoom:', error);
    throw new Error('Failed to remove room assignment');
  }
}


const fetchOccupiedRoomsByGender = async (sex, building) => {
  try {
    if (!sex || !building) {
      throw new Error('Sex and building parameters are required');
    }

    // Fetch all rooms for the building and gender
    const rooms = await Room.find({ sex, building });

    // Filter rooms that have occupied beds
    const occupiedRooms = rooms.filter(room => room.occupiedBeds.length > 0);

    // Format the result to return the required details
    const roomDetails = occupiedRooms.map(room => ({
      roomNumber: room.roomNumber,
      building: room.building,
      occupiedBeds: room.occupiedBeds.map(bed => ({
        bedLetter: bed.bedLetter,
        studentName: bed.student.name,
        studentNo: bed.student.studentNo,
        studentContact: bed.student.contactNo, 
        studentCourse: bed.student.course,
        studentYearLevel: bed.student.yearLevel, // Assuming email as contact for now
      })),
    }));

    return roomDetails;
  } catch (error) {
    console.error('Error fetching occupied rooms:', error);
    throw new Error(error.message);
  }
};

const getAvailableRoomCounts = async () => {
  try {
      const rooms = await Room.find(); 

      let maleAvailableRooms = 0;
      let femaleAvailableRooms = 0;

      rooms.forEach(room => {
          if (room.availableBeds.length > 0) {
              if (room.sex === 'Male') {
                  maleAvailableRooms += 1;
              } else if (room.sex === 'Female') {
                  femaleAvailableRooms += 1;
              }
          }
      });

      return { 
          totalAvailableRooms: maleAvailableRooms + femaleAvailableRooms 
      };
  } catch (error) {
      console.error('Error fetching available room counts:', error);
      throw new Error('Error fetching available room counts');
  }
};



module.exports = { createRooms, getUnassignedStudents, getAvailableRoomsandBedsByGender, assignRoomToStudent, getStudentsWithRooms, removeRoom, fetchOccupiedRoomsByGender, getAvailableRoomCounts };