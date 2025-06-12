import nodemailer from "nodemailer"

// Create a transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent: ", info.messageId)
    return info
  } catch (error) {
    console.error("Error sending email: ", error)
    throw error
  }
}

export { sendEmail }
