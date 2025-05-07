/**
 * function to generate random number
 * @returns 4 digit number.
 */
export const generateUserVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
