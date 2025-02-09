export default async function handler(req, res) {
  // ✅ Import Nodemailer dynamically for Gatsby functions
  const nodemailer = require("nodemailer");

  // ✅ Load environment variables
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  const { name, email, message } = req.body;

  // ✅ Validate input data
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✅ Configure Gmail SMTP
  // h.khanbeigi@kian.digital
  // Hosein9092@

  // hoseinkhanbeigi@gmail.com
  // 90923032

  // smtp.gmail.com
  // mail.levants.io
  const transporter = nodemailer.createTransport({
    host: "mail.levants.io", // ✅ Use the hostname WITHOUT "https://"
    port: 587, // ✅ Use 465 for SSL or 587 for TLS
    secure: false, // ✅ true if using port 465, false for port 587
    auth: {
      user: "h.khanbeigi@kian.digital", // Your Gmail email
      pass: "Hosein9092@", // Use App Password, NOT your real Gmail password
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    // ✅ Send email
    // web@levants.io
    // a.nikjoo@kian.digital
    await transporter.sendMail({
      from: "h.khanbeigi@kian.digital",
      to: "a.nikjoo@kian.digital", // Replace with recipient's email
      subject: "Here's a Random pic Picture! 🐶",
      html: `
             <p>Enjoy your day! demo-2😊</p>`,
    });

    return res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    return res.status(500).json({ error: "Error sending email" });
  }
}
