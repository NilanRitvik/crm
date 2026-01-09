const nodemailer = require("nodemailer");

// Configure transporter
// FOR PRODUCTION: Use environment variables for sensitive data
const transporter = nodemailer.createTransport({
    service: "gmail", // or your preferred service
    auth: {
        user: process.env.EMAIL_USER, // e.g., 'your-email@gmail.com'
        pass: process.env.EMAIL_PASS  // e.g., 'your-app-password'
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("⚠️ Email credentials not found. Mocking email send.");
        console.log(`📧 To: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        // console.log(`📧 Content: ${htmlContent}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"CRM System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        });
        console.log("✅ Email sent: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = { sendEmail };
