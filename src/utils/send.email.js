import transporter from "../config/email.js";

/**
 * function to send email
 * @param {object} mailOptions email options => from,to,subject,text,html
 */

export const sendEmail = async (mailOptions) => {
  await transporter.sendMail(mailOptions);
};
