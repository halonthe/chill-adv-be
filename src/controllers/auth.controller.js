import jwt from "jsonwebtoken";
import usersModel from "../models/users.model.js";
import * as argon2 from "argon2";
import { generateUserVerificationCode } from "../utils/generate.verification.code.js";
import userVerificationsModel from "../models/user.verifications.model.js";
import { sendEmail } from "../utils/send.email.js";

// register controller
export const register = async (req, res) => {
  const { fullname, username, email, password, confPassword } = req.body;

  // validasi input
  if (!fullname || !username || !email || !password)
    return res
      .status(400)
      .json({ code: 400, message: "all fields are required" });

  // validasi email
  const findUser = await usersModel.findOne({ where: { email: email } });
  if (findUser && email === findUser.email)
    return res.status(400).json({ message: "email already exists" });

  // validasi password
  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "password and confirm password doesn't match" });

  // hash password
  const hashPassword = await argon2.hash(password);

  // generate verification code
  const userVerifyToken = generateUserVerificationCode();
  const userVerifyTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  try {
    // create user
    const user = await usersModel.create({
      fullname: fullname,
      username: username,
      email: email,
      password: hashPassword,
    });

    // create verification
    await userVerificationsModel.create({
      userId: user.uuid,
      verification_token: userVerifyToken,
      token_expired: userVerifyTokenExpire,
    });

    // send verification email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Verify Account",
      text: `Your code: ${userVerifyToken}. this code valid until: ${Date(
        userVerifyTokenExpire
      )}`,
    };
    sendEmail(mailOptions);

    return res.status(200).json({
      code: 200,
      message: "register successfully, check email to verify account",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

// activate account controller
export const activateAccount = async (req, res) => {
  try {
    // find all matching activation code
    const code = req.body.verification_code;
    const match = await userVerificationsModel.findAll({
      where: { verification_token: code },
    });

    // validate duplicate
    if (match.length > 1) {
      // resend code
      const randomCode = generateUserVerificationCode();
      const expiredCode = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Verify Account",
        text: `Your code: ${randomCode}. this code valid until: ${Date(
          expiredCode
        )}`,
      };
      sendEmail(mailOptions);

      return res.status(409).json({
        code: 409,
        message:
          "conflict detected, we have resend code, please check your email",
      });
    }

    // validate code
    const user = await usersModel.findOne({ where: { uuid: match[0].userId } });

    if (user.verified) {
      await userVerificationsModel.destroy({ where: { userId: user.uuid } });
      return res
        .status(406)
        .json({ code: 406, message: "user already active" });
    }

    if (match[0].verification_token != code)
      return res.status(406).json({ code: 406, message: "invalid code" });

    // update user
    await usersModel.update({ verified: true }, { where: { uuid: user.uuid } });

    // delete code
    await userVerificationsModel.destroy({ where: { userId: user.uuid } });

    return res
      .status(200)
      .json({ code: 200, message: "account has been activate" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

// login controller
export const login = async (req, res) => {
  try {
    // find user by email
    const user = await usersModel.findOne({
      where: { email: req.body.email },
    });

    //   validasi user
    if (!user)
      return res.status(200).json({ code: 200, message: "user not found" });

    //   validasi password
    const match = await argon2.verify(user.password, req.body.password);
    if (!match)
      return res.status(400).json({ code: 400, message: "wrong password" });

    // generate token
    const payload = {
      uuid: user.uuid,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_path: user.avatar_path,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30s",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    // update refresh token
    await usersModel.update(
      { refresh_token: refreshToken },
      { where: { uuid: user.uuid } }
    );

    // save token to `http only cookie`
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // set expired in 1 day
      // secure: true
    });

    // send access token to client
    return res
      .status(200)
      .json({ code: 200, message: "logged in", data: accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

// get token controller
export const getToken = async (req, res) => {
  try {
    // get token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return res.status(401).json({ code: 401, message: "unauthorized" });

    // validate token
    const user = await usersModel.findAll({
      where: { refresh_token: refreshToken },
    });

    if (!user[0])
      return res.status(403).json({ code: 403, message: "invalid token" });

    // generate new token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (error, decoded) => {
        if (error)
          return res.status(403).json({ code: 403, message: error.message });

        const payload = {
          uuid: user.uuid,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar_path: user.avatar_path,
        };

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "30s",
        });

        return res.status(200).json({
          code: 200,
          message: "refresh token success",
          data: accessToken,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

// logout controller
export const logout = async (req, res) => {
  // get token from cookie
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204); // code 204 tdk ada body msg

  // validate token
  const user = await usersModel.findAll({
    where: { refresh_token: refreshToken },
  });

  if (!user[0]) return res.sendStatus(204); // code 204 tdk ada body msg

  //  update database
  await usersModel.update(
    { refresh_token: "" },
    {
      where: { uuid: user[0].uuid },
    }
  );

  // clear cookie
  res.clearCookie("refreshToken");
  return res.status(200).json({ code: 200, message: "logged out" });
};
