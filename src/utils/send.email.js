import transporter from "../config/email.js";

/**
 * This is function to send email
 * @param {object} mailOptions email options => from,to,subject,text,html
 */

export const sendEmail = async (mailOptions) => {
  await transporter.sendMail(mailOptions);
};
