const studentFormService = require('./services/studentFormService');
const { sendEmail } = require('./services/emailService.js');


const triggerAutoDeleteExpiredForms = async (req, res) => {
    try {
        const { expiredForms, expiredRenewals } = await studentFormService.checkExpiredForms();

        if (expiredForms.length === 0 && expiredRenewals.length === 0) {
            console.log("No expired forms or renewals found.");
            return res.status(200).json({ message: 'No expired forms or renewals found.' });
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        // Delete expired student screening forms
        for (const form of expiredForms) {
            if (form) await req.redis.del(`form:${form.studentNo}`);

            await req.redis.set(`cooldown:${form.studentNo}`, 'true', 'EX', 43200);

            await sendEmail(
                form.email,
                "Form Deleted Due to Incomplete Screening",
                "cancelEmail",
                { name: form.name, studentNo: form.studentNo, formattedDate }
            );

            await studentFormService.toDeleteExpiredForms(form._id);

            console.log(`Deleted screening form for studentNo: ${form.studentNo}`);
        }

        // Delete expired renewal forms
        for (const form of expiredRenewals) {
            await req.redis.set(`cooldown:${form.studentNo}`, 'true', 'EX', 43200);

            await sendEmail(
                form.email,
                "Expired Renewal - Your form has been deleted",
                "cancelEmail",
                { name: form.name, studentNo: form.studentNo, formattedDate }
            );

            await studentFormService.toDeleteExpiredRenewals(form._id);

            console.log(`Deleted renewal form for studentNo: ${form.studentNo}`);
        }

        res.status(200).json({ message: 'Expired forms and renewals checked and deleted if incomplete.' });
    } catch (error) {
        console.error("Error running auto-delete process:", error);
        res.status(500).json({ message: 'Error running auto-delete process.' });
    }
};

module.exports = { triggerAutoDeleteExpiredForms };