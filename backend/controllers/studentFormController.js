const studentFormService = require('./services/studentFormService');
const analyticService = require('./services/analyticsService');
const { sendEmail } = require('./services/emailService.js');
const ActivityLog = require('../models/ActivityLogModel.js');
const {  MAX_QUEUE_CAPACITY_MALE, MAX_QUEUE_CAPACITY_FEMALE, MAX_APPROVED_CAPACITY_MALE, MAX_APPROVED_CAPACITY_FEMALE } = require('../db/constants.js');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client }= require('../db/awsConfig.js')


// For Public
const getAvailableSlots = async (req, res) => {
    try{
        // Pass only the sex value as a string, not as an object
        const maleCount = await studentFormService.getApprovedCountBySex("Male");
        const femaleCount = await studentFormService.getApprovedCountBySex("Female");

        const maleAvailableSlots = MAX_APPROVED_CAPACITY_MALE - maleCount;
        const femaleAvailableSlots = MAX_APPROVED_CAPACITY_FEMALE - femaleCount;

        let lockStatus = await studentFormService.checkSubmissionStatus();
        let lockedGenders = lockStatus.lockedGenders || [];

        // Auto-lock when slots reach zero
        if (maleAvailableSlots === 0 && !lockedGenders.includes("Male")) {
            lockedGenders.push("Male");
        }
        if (femaleAvailableSlots === 0 && !lockedGenders.includes("Female")) {
            lockedGenders.push("Female");
        }

        // If both are locked (either auto or manually), submission is fully locked
        const isFullyLocked = lockedGenders.length === 2;
        await studentFormService.updateSubmissionLock(isFullyLocked);

        // Save updated lock status
        lockStatus.lockedGenders = lockedGenders;
        await lockStatus.save();

        // Public display logic (manual lock should also show "Full")
        let publicStatus = {
            male: lockedGenders.includes("Male") ? "Full" : maleAvailableSlots,
            female: lockedGenders.includes("Female") ? "Full" : femaleAvailableSlots,
            message: "Booking is open"
        };

        if (lockedGenders.length === 2) {
            publicStatus.message = "Booking is currently closed";
        } else if (lockedGenders.includes("Male")) {
            publicStatus.message = "Booking is open for Female";
        } else if (lockedGenders.includes("Female")) {
            publicStatus.message = "Booking is open for Male";
        }

        res.status(200).json({
            maleAvailableSlots: publicStatus.male,
            femaleAvailableSlots: publicStatus.female,
            message: publicStatus.message,
            maxMaleApproved: MAX_APPROVED_CAPACITY_MALE,
            maxFemaleApproved: MAX_APPROVED_CAPACITY_FEMALE
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching available slots.' });
    }
}

const getFormSubmissionLockStatus = async (req, res) => {
    try{
        const check = await studentFormService.checkSubmissionStatus();
        if (!check) {
            return res.status(404).json({ message: 'Config not found' });
        }

        return res.status(200).json({ lockedGenders: check.lockedGenders });

    } catch (error){
        console.error(error);
        return res.status(500).json({ message: 'Error retrieving config' });
    }
}

const toggleFormSubmissionLock = async (req, res) => {
    try{
        const { gender, action } = req.body;

        if (!["Male", "Female"].includes(gender)) {
            return res.status(400).json({ message: "Invalid gender value." });
        }

        const config = await studentFormService.checkSubmissionStatus();
        if (!config) {
            return res.status(404).json({ message: 'Config not found' });
        }

        if (action === "lock") {
            if (!config.lockedGenders.includes(gender)) {
                config.lockedGenders.push(gender);
            }
        } else if (action === "unlock") {
            config.lockedGenders = config.lockedGenders.filter(g => g !== gender);
        }

        await config.save();

        // check.formSubmissionLocked = !check.formSubmissionLocked; 
        // await check.save();

        const status = action === "lock" ? "Locked" : "Unlocked";
        const adminName = req.admin.name; 
        const activity = new ActivityLog({
            action: `Form Submission ${status} for ${gender}`,
            admin: adminName,
            details: `Form submissions ${status.toLowerCase()} for ${gender} students.`
        });

        await activity.save();

        return res.status(200).json({ 
            message: `Form submission ${status} for ${gender}`,
            lockedGenders: config.lockedGenders
        });
    } catch(error){
        console.error(error);
        return res.status(500).json({ message: 'Error updating config' });
    }
}

const checkCooldown = async (req, res) => {
    try{
        const studentNo = req.user.Student_no;

        if (!studentNo) {
            return res.status(400).json({ message: 'Student number is required' });
        }

        const cooldownExpiration = await req.redis.ttl(`cooldown:${studentNo}`);
        if (cooldownExpiration > 0) {
          const hoursRemaining = Math.ceil(cooldownExpiration / 3600);
          return res.status(200).json({
            cooldown: true,
            hoursRemaining,
          });
        }

        res.status(200).json({ cooldown: false });

    } catch (error){
        console.error(error);
        res.status(500).json({ message: 'An error occured while checking cooldown status.' })
    }
}


const submitForm = async (req, res) => {
    try {
        // Check if req.user is available
        if (!req.user) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        // Start the Gender lock checker
        const sex = req.user.sex;


        // Lock Check
        const lockStatus = await studentFormService.checkSubmissionStatus();
        if (lockStatus && lockStatus.lockedGenders.includes(sex)) {
            return res.status(400).json({ message: `Form submission is locked for ${sex} students.` });
        }

        // const check = await studentFormService.checkSubmissionStatus();
        // if (!check || check.formSubmissionLocked) {
        //     return res.status(400).json({ message: 'Form submission is currently locked. Please try again later.' });
        // }


        const formData = JSON.parse(req.body.formData);
        
        const { course, yearLevel, dateOfBirth, placeOfBirth, age, religion, nationality, civilStatus,
            homeAddress, facebookAcct, telNo, fatherDetails, motherDetails, parentStatus, numberOfSiblings,
            weight, height, glasses, illnesses, comments, hobbies, talentsSkills, leisureTime } = formData;
        
        const studentNo = req.user.Student_no;
        const firstName = req.user.firstName;
        const middleName = req.user.middleName;
        const lastName = req.user.lastName;
        const email = req.user.email;
        const name = req.user.name;

        // Log req.user to check if it's correctly populated
        // console.log("Redis Key: ", `form:${studentNo}`);

        // check cooldown on cache
        const coolddownExpiration = await req.redis.ttl(`cooldown:${studentNo}`);
        if(coolddownExpiration > 0){
            const hoursRemaining = Math.ceil(coolddownExpiration / 3600);
            return res.status(400).json({
                message: `You can only submit a new form after ${hoursRemaining} hour/s.`,
                cooldown: true,
                hoursRemaining
            });
        }

        // Check if already under renewal
        const renewalStudent = await studentFormService.checkIfUnderRenewal(studentNo);
        if (renewalStudent) {
            return res.status(400).json({ message: 'Student under renewal' });
        }

        // Check if already approved
        const approvedStudent = await studentFormService.checkIfAlreadyApproved(studentNo);
        if (approvedStudent) {
            return res.status(400).json({ message: 'Student already approved' });
        }

        // Check Redis Cache
        const cachedForm = await req.redis.get(`form:${studentNo}`);
        // console.log("Redis GET command result: ", cachedForm);
        if (cachedForm) {
            return res.status(400).json({ message: 'You have already submitted a form' });
        }

        // Check Database if Not in Cache
        const existingForm = await studentFormService.checkIfFormExists(studentNo);
        if (existingForm) {
            return res.status(400).json({ message: 'You have already submitted a form' });
        }
        
        const queueType = sex === "Male" ? "MaleQueue" : "FemaleQueue";

        // Gender Validation
        if (!sex || (sex !== "Male" && sex !== "Female")) {
            return res.status(400).json({ message: "Invalid or missing 'sex' field in personalInfo." });
        }

        // Count available slots for each
        // Get current counts for the approved students and the queue
        const currentQueueCount = await studentFormService.getQueueCount(queueType);

        // Count the number of approved students based on sex input (male or female)
        const currentApprovedCount = await studentFormService.getApprovedCountBySex(sex);

        // Check if queue is full
        if (currentQueueCount >= (sex === "Male" ? MAX_QUEUE_CAPACITY_MALE : MAX_QUEUE_CAPACITY_FEMALE)) {
            return res.status(400).json({ message: `The ${queueType} has reached its limit of ${sex === "Male" ? MAX_QUEUE_CAPACITY_MALE : MAX_QUEUE_CAPACITY_FEMALE} submissions.` });
        }

        // Check if approved students limit is reached
        if (currentApprovedCount >= (sex === "Male" ? MAX_APPROVED_CAPACITY_MALE : MAX_APPROVED_CAPACITY_FEMALE)) {
            return res.status(400).json({ message: `The approved ${sex} slots have reached their limit.` });
        }

        let profilePictureUrl = null;
        if (req.file) {
            profilePictureUrl = req.file.location ? req.file.location : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;
        }

        if (!profilePictureUrl) {
            return res.status(400).json({ message: "Profile picture upload failed. Please try again." });
        }

        const newFormData  = {
            studentNo: studentNo,
            email: email,
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            name: name,
            personalInfo: {
                profilePicture: profilePictureUrl,
                course,
                yearLevel,
                sex: sex,
                dateOfBirth,
                placeOfBirth,
                age,
                religion,
                nationality,
                civilStatus,
                homeAddress,
                facebookAcct,
                telNo,
            },
            familyBackground: {
                fatherDetails,
                motherDetails,
                parentStatus: {
                    ...parentStatus,
                    guardianDetails: parentStatus.guardianDetails, 
                },
                numberOfSiblings, // Array of sibling objects
            },
            healthCondition: {
                weight,
                height,
                glasses,
                illnesses, // Array of illness objects
                comments,
            },
            hobbies,
            talentsSkills,
            leisureTime,
            queueType
        };

        const newForm = await studentFormService.submitForm(newFormData);

        if (newForm) {
            await req.redis.set(`form:${studentNo}`, JSON.stringify(newForm), 'EX', 3600);

            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

            await sendEmail(
                email,
                "Form Queued Successfully",
                "queueEmail",
                { formattedDate, name, email, studentNo, queueType}
            );

        }

        const address = await studentFormService.checker(studentNo);
        const province = address.personalInfo.homeAddress.province.toLowerCase();;



        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Trigger the analytics
        await analyticService.generateMonthlyAnalytics();
        await analyticService.updateGenderBasedAnalytics(currentYear, currentMonth, sex, 'submission');
        await analyticService.updateProvinceAnalytics(currentMonth, currentYear, province)

        res.status(201).json({
            message: 'Form submitted successfully',
            _id: newForm._id,
            queueType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while submitting the form.' });
    }
};

const checkStatus = async(req, res) => {
    try{
        const studentNo = req.user.Student_no;

        const cachedForm = await req.redis.get(`form:${studentNo}`);
        if (cachedForm) {
            return res.json({ submitted: true });
        }
    
        const existingForm = await studentFormService.checkIfFormExists(studentNo);
        if (existingForm) {
            return res.json({ submitted: true });
        }
    
        res.json({ submitted: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking your status.' });
    }
    
}

const checkApprovalStatus = async (req, res) => {
    try{
        const studentNo = req.user.Student_no;

        const existingApprovedStudent = await studentFormService.checkIfAlreadyApproved(studentNo);
        const underRenewalData = await studentFormService.checkIfUnderRenewal(studentNo);
        if (existingApprovedStudent || underRenewalData) {
            return res.json({ isApproved: true });
        }

        return res.json({ isApproved: false });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking your approval status.' });
    }
}

const getStudentInfo = async (req, res) => {
    try {
        const studentNo = req.user.Student_no;

        const studentInfo = await studentFormService.getStudentInfo(studentNo);

        if (!studentInfo) {
            return res.status(404).json({ message: 'Student information not found.' });
        }

        res.json(studentInfo);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching your information. '});
    }
}

const cancelForm = async (req, res) => {
    try{
        const studentNo = req.user.Student_no;
        const email = req.user.email;
        const name = req.user.name;

        const cachedForm = await req.redis.get(`form:${studentNo}`);
        const formToDelete = cachedForm ? JSON.parse(cachedForm) : await studentFormService.checkFormInfo(studentNo);

        if (!formToDelete) {
            return res.status(404).json({ message: 'No form found to cancel.' });
        }

        if (formToDelete.personalInfo?.profilePicture) {
            const profilePictureUrl = formToDelete.personalInfo.profilePicture;
            const s3Key = profilePictureUrl.split('.amazonaws.com/')[1]; 

            if (s3Key) {
                const deleteParams = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: s3Key,
                };

                try {
                    await s3Client.send(new DeleteObjectCommand(deleteParams));
                    console.log("Successful Deletion")
                } catch (s3Error) {
                    console.error('❌ Error deleting profile picture from S3:', s3Error.message);
                }
            }
        }

        const deletedForm = await studentFormService.cancelStudForm(formToDelete._id);
        if (!deletedForm) {
            return res.status(404).json({ message: 'Failed to cancel the form. Form not found.'});
        }

        // Delete in redis
        if (cachedForm) {
            await req.redis.del(`form:${studentNo}`);
        }

        await req.redis.set(`cooldown:${studentNo}`, 'true', 'EX', 43200);
        
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        await sendEmail(
            email, 
            "Form Cancellation Confirmation", 
            "cancelEmail", 
            { name, studentNo, formattedDate, email });

        res.status(200).json({ message: 'Form submission cancelled successfully.'});
    } catch (error) {
        console.error('Error cancelling form:', error.message);
        res.status(500).json({ message: 'An error occurred while cancelling the form.'});
    }
}

// for admin
const getStudentQueue = async (req, res) => {
    try{
        const { queueType } = req.query;
        const page = parseInt(req.query.page) || 1;

        const result = await studentFormService.getStudentQueue(queueType, page);

        res.json(result);

    } catch (error) {
        console.error(error);
        if (error.message === 'Invalid queue type') {
            return res.status(400).json({ message: error.message });
        } 
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getStudentFormById = async (req, res) => {
    try {
        const { _id } = req.params;

        const formDetails = await studentFormService.getStudentFormById(_id);

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

        const form = await studentFormService.getStudentFormById(_id);
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

        // Delegate scheduling to the service
        const updatedStudent = await studentFormService.scheduleInterview(_id, scheduledDateTime, deadlineDateTime);

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

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
}

const rejectStudentForm = async (req, res) => {
    try {
        const {_id} = req.params;
        const studentForm = await studentFormService.getStudentFormById(_id);

        if(!studentForm){
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


        const cachedForm = await req.redis.get(`form:${studentForm.studentNo}`);
        if (cachedForm) {
            await req.redis.del(`form:${studentForm.studentNo}`);
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
            action: 'Rejected Student',
            admin: adminName,
            targetStudent: studentForm.studentNo,
            details: `Rejected student ${studentForm.name} for dormitory.`
        });

        await activity.save();

        await studentFormService.deleteStudentForm(_id);

        // Trigger Analytics
        const rejectionTimestamp = new Date();
        const year = rejectionTimestamp.getFullYear();
        const month = rejectionTimestamp.getMonth() + 1;
        const gender = studentForm.personalInfo.sex;

        await analyticService.incrementRejectedCount(year, month);
        await analyticService.updateGenderBasedAnalytics(year, month, gender, 'rejected');


        res.status(200).json({ message: 'Student form rejected, cooldown set, and email sent successfully.' });


    } catch (error) {
        console.error('Error rejecting student form:', error);
        res.status(500).json({ message: 'Error rejecting student form' });
    }
}

const approveStudent = async (req, res) => {
    try {
        const { studentNo } = req.params;

        // check to avoid conflicts
        const cachedForm = await req.redis.get(`form:${studentNo}`);
        if (cachedForm) {
            await req.redis.del(`form:${studentNo}`);
        }

        const currentStudent = await studentFormService.checker(studentNo);
        const gender = currentStudent.personalInfo.sex;

        const approvedCount = await studentFormService.getApprovedCountBySex(gender);
        const maxCapacity = gender === "Male" ? MAX_APPROVED_CAPACITY_MALE : MAX_APPROVED_CAPACITY_FEMALE;

        // Check if there's still space for approval
        if (approvedCount >= maxCapacity) {
            return res.status(400).json({ message: `No more available slots for ${gender} students.` });
        }

        // Trigger Analytics
        const approvalTimestamp = new Date();
        const year = approvalTimestamp.getFullYear();
        const month = approvalTimestamp.getMonth() + 1;



        await analyticService.updateGenderBasedAnalytics(year, month, gender, 'approve');
        await analyticService.incrementApprovedCount(year, month);

        const result = await studentFormService.approveStudent(studentNo);

        if (result) {
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

            const email = currentStudent.email;
            const name = currentStudent.name;

            await sendEmail(
                email,
                "You Have Been Approved!",
                "approvedEmail",
                { formattedDate, name}
            );

        }


        // Activity Logs
        const adminName = req.admin.name;
        const activity = new ActivityLog({
            action: 'Approved Student',
            admin: adminName,
            targetStudent: currentStudent.studentNo,
            details: `Approved student ${currentStudent.name} for dormitory.`
        });

        await activity.save();

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving student.' });
    }
}

const checkIfAlreadyApproved = async (req, res) => {
    try{
        const { studentNo } = req.params;

        const existingApprovedStudent = await studentFormService.checkIfAlreadyApproved(studentNo);
        if (existingApprovedStudent) {
            return res.status(200).json({ message: 'Student is already approved.' });
        }

        return res.status(200).json({ message: 'Student is not yet approved.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking student status.' });
    }
}






const admissionForm = async (req, res) => {
    try {
        // Ensure required fields are provided
        const { studentNo, firstName, middleName, lastName, email, course, yearLevel, sex, dateOfBirth, placeOfBirth, age, religion, nationality, civilStatus,
            homeAddress, facebookAcct, telNo, fatherDetails, motherDetails, parentStatus, numberOfSiblings,
            weight, height, glasses, illnesses, comments, hobbies, talentsSkills, leisureTime } = req.body;
        
        // Validate required inputs
        if (!studentNo || !firstName || !lastName || !email) {
            return res.status(400).json({ message: "StudentNo, First Name, Last Name, and Email are required." });
        }

        // Construct full name
        const name = [firstName, middleName, lastName].filter(Boolean).join(' ');

        // Check cooldown in Redis
        const cooldownExpiration = await req.redis.ttl(`cooldown:${studentNo}`);
        if (cooldownExpiration > 0) {
            const hoursRemaining = Math.ceil(cooldownExpiration / 3600);
            return res.status(400).json({
                message: `You can only submit a new form after ${hoursRemaining} hour/s.`,
                cooldown: true,
                hoursRemaining
            });
        }

        // Check if already under renewal
        const renewalStudent = await studentFormService.checkIfUnderRenewal(studentNo);
        if (renewalStudent) {
            return res.status(400).json({ message: 'Student is under renewal.' });
        }

        // Check if already approved
        const approvedStudent = await studentFormService.checkIfAlreadyApproved(studentNo);
        if (approvedStudent) {
            return res.status(400).json({ message: 'Student is already approved.' });
        }

        // Check Redis cache
        const cachedForm = await req.redis.get(`form:${studentNo}`);
        if (cachedForm) {
            return res.status(400).json({ message: 'This student has already submitted a form.' });
        }

        // Check Database if Not in Cache
        const existingForm = await studentFormService.checkIfFormExists(studentNo);
        if (existingForm) {
            return res.status(400).json({ message: 'This student has already submitted a form.' });
        }

        // Validate gender and determine queue type
        if (!sex || (sex !== "Male" && sex !== "Female")) {
            return res.status(400).json({ message: "Invalid or missing 'sex' field." });
        }
        const queueType = sex === "Male" ? "MaleQueue" : "FemaleQueue";

        // Count available slots
        const currentQueueCount = await studentFormService.getQueueCount(queueType);
        const currentApprovedCount = await studentFormService.getApprovedCountBySex(sex);

        // Validate queue capacity
        if (currentQueueCount >= (sex === "Male" ? MAX_QUEUE_CAPACITY_MALE : MAX_QUEUE_CAPACITY_FEMALE)) {
            return res.status(400).json({ message: `The ${queueType} is full.` });
        }

        // Validate approved slots capacity
        if (currentApprovedCount >= (sex === "Male" ? MAX_APPROVED_CAPACITY_MALE : MAX_APPROVED_CAPACITY_FEMALE)) {
            return res.status(400).json({ message: `The approved ${sex} slots are full.` });
        }

        // Prepare form data
        const formData = {
            studentNo,
            email,
            firstName,
            middleName,
            lastName,
            name,
            personalInfo: {
                course,
                yearLevel,
                sex,
                dateOfBirth,
                placeOfBirth,
                age,
                religion,
                nationality,
                civilStatus,
                homeAddress,
                facebookAcct,
                telNo,
            },
            familyBackground: {
                fatherDetails,
                motherDetails,
                parentStatus: {
                    ...parentStatus,
                    guardianDetails: parentStatus.guardianDetails,
                },
                numberOfSiblings,
            },
            healthCondition: {
                weight,
                height,
                glasses,
                illnesses,
                comments,
            },
            hobbies,
            talentsSkills,
            leisureTime,
            queueType
        };

        // Submit form
        const newForm = await studentFormService.submitForm(formData);

        // Cache form data in Redis
        if (newForm) {
            await req.redis.set(`form:${studentNo}`, JSON.stringify(newForm), 'EX', 3600);

            // Send confirmation email
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

            await sendEmail(
                email,
                "Form Queued Successfully",
                "queueEmail",
                { formattedDate, name, email, studentNo, queueType }
            );
        }

        const address = await studentFormService.checker(studentNo);
        const province = address.personalInfo.homeAddress.province.toLowerCase();

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        await analyticService.generateMonthlyAnalytics();
        await analyticService.updateGenderBasedAnalytics(currentYear, currentMonth, sex, 'submission');
        await analyticService.updateProvinceAnalytics(currentMonth, currentYear, province);

        const adminName = req.admin.name; 
        const activity = new ActivityLog({
            action: 'Admission Form Submitted',
            admin: adminName,
            targetStudent: studentNo,
            details: `submitted an admission form for student ${studentNo}. Assigned to ${queueType}.`
        });

        await activity.save();


        res.status(201).json({
            message: 'Form submitted successfully',
            _id: newForm._id,
            queueType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while submitting the form.' });
    }
};

const contactForm = async (req, res) => {
    try{
        const{ name, contactnumber, email, message } = req.body;
        
        if(!name || !contactnumber || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const custodianEmail = "custodian@example.com";

        await sendEmail(
            custodianEmail,
            `New Contact Form Submission ${name}`,
            'contactEmail',
            { name, contactnumber, email, message } 
            
        )

        return res.status(200).json({ message: 'Message sent successfully' });

    } catch (error) {
        res.status(500).json({ message: 'An error occurred while performing the contact' });
    }
}

const countPendings = async (req, res) => {
    try{
        const totalPending = await studentFormService.getAllQueueCount();
        return res.status(200).json({ totalPending });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching pending queue count" });
    }
}




module.exports ={ getAvailableSlots, countPendings, toggleFormSubmissionLock, getFormSubmissionLockStatus, submitForm, checkCooldown, checkStatus, checkApprovalStatus, cancelForm, getStudentQueue, getStudentFormById, updateChecklistItem, setScreeningSchedule, rejectStudentForm, approveStudent, checkIfAlreadyApproved, admissionForm, contactForm, getStudentInfo };