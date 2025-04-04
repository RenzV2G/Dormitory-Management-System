const nodemailer = require('nodemailer');
const hbs = require("nodemailer-handlebars");
const path = require("path");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

transporter.use(
    "compile",
    hbs({
        viewEngine: {
            extname: ".hbs", // File extension for the templates
            layoutsDir: path.join(__dirname, "../../templates"), // Path to the templates directory
            defaultLayout: false, // Set to false if you're not using layout files
        },
        viewPath: path.join(__dirname, "../../templates"), // Path to the templates directory
        extName: ".hbs", // File extension for the templates
    })
);

const sendEmail = async (to, subject, template, context) => {
    try {
        const mailOptions = {
            from: `"Dormitroy Management" <${process.env.MAILTRAP_USER}>`,
            to,
            subject,
            template,
            context,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};

module.exports = { sendEmail };