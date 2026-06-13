require('dotenv').config();
const emailService = require('./src/services/email.service');

async function testEmail() {
    try {
        console.log("Starting email test...");
        await emailService.sendRegistrationEmail("test@example.com", "Test User");
        console.log("Email test completed successfully.");
    } catch (error) {
        console.error("Email test failed with error:", error);
    }
}

testEmail();
