const nodemailer = require("nodemailer");

let transporter;

const isEmailServiceConfigured = () => {
  const emailUser = String(process.env.EMAIL_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || "").trim();

  if (!emailUser || !emailPass) {
    return false;
  }
  if (
    emailUser.toLowerCase().includes("your_email") ||
    emailPass.toLowerCase().includes("your_email_password")
  ) {
    return false;
  }

  return true;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === "true";

  if (smtpHost) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendPasswordResetOtpEmail = async ({ to, otp }) => {
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mail = {
    from: `MentorLink <${fromAddress}>`,
    to,
    subject: "MentorLink Password Reset OTP",
    text: `Your MentorLink password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin:0 0 12px; color:#1E3A8A;">MentorLink Password Reset</h2>
        <p style="margin:0 0 10px;">Use this OTP to reset your password:</p>
        <p style="margin:0 0 14px; font-size:24px; font-weight:700; letter-spacing:2px;">${otp}</p>
        <p style="margin:0 0 8px;">This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="margin:0; color:#6B7280; font-size:13px;">If you did not request this, you can ignore this email safely.</p>
      </div>
    `,
  };

  const activeTransporter = getTransporter();
  return activeTransporter.sendMail(mail);
};

module.exports = {
  isEmailServiceConfigured,
  sendPasswordResetOtpEmail,
};
