const CurrentStudent = require('../../models/CurrentStudent');

const getApprovedStudents = async () => {
    try{
        return await CurrentStudent.find({ status: 'Approved'});
    } catch (error){
        console.error('Error fetching approved students: ', error);
        throw error;
    }
}

const getStudentsforTable = async (gender = null) => {
    try {
        const query = { status: 'Approved' };
        if (gender) {
            query['personalInfo.sex'] = gender; // Add gender filter if provided
        }

        return await CurrentStudent.find(query)
            .sort({ approvedAt: 1 }) // Ensure sorting is applied
            .select('name studentNo personalInfo.sex roomAssigned.building roomAssigned.roomNumber roomAssigned.bedLetter approvedAt');
    } catch (error) {
        console.error('Error fetching approved students for table:', error);
        throw error;
    }
}

const getById = async (_id) => {
    try{
        return await CurrentStudent.findById(_id);
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        throw error;
    }
}

const removeStudent = async (_id) => {
    try {
     return await CurrentStudent.findByIdAndDelete(_id);
    } catch (error) {
      console.error('Error removing student:', error);
      throw error;
    }
}

const updateStudent = async (_id, updatedDetails) => {
    try {
        return await CurrentStudent.findByIdAndUpdate(_id, updatedDetails, { new: true });
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
};

module.exports = { getApprovedStudents, getStudentsforTable, getById, removeStudent, updateStudent };