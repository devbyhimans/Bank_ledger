const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

async function createTransporter() {
    const accessToken = await oauth2Client.getAccessToken();


     
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken.token,
        },
    });
}

async function sendEmail(to, subject, text, html) {
    try {

        
        const transporter = await createTransporter();

        console.log("Sending email to:", to);
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Message sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

async function sendRegistrationEmail(userEmail, name) {
    const subject = "Welcome to Banking Ledger!";
    const text = `Hello ${name},

Thank you for registering at Banking Ledger. We're excited to have you on board!

Best regards,
The Banking Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Thank you for registering at <strong>Banking Ledger</strong>. We're excited to have you on board!</p>
        <p>Best regards,<br>The Banking Ledger Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Successful!";

    const text = `Hello ${name},

Your transaction of $${amount} to account ${toAccount} was successful.

Best regards,
The Banking Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Your transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> was successful.</p>
        <p>Best regards,<br>The Banking Ledger Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Failed";

    const text = `Hello ${name},

We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed.

Please try again later.

Best regards,
The Banking Ledger Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>We regret to inform you that your transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p>
        <p>Please try again later.</p>
        <p>Best regards,<br>The Banking Ledger Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
};