import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

import usersModel from "../models/users.model.js";
import userVerificationsModel from "../models/user.verifications.model.js";
import { registerEmailTemplate, sendEmail } from "../utils/send.email.js";
import { uploadFile } from "../utils/file.upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This is register controller
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const register = async (req, res) => {
  const { fullname, username, email, password, confPassword } = req.body;

  // validasi field
  if (!fullname || !username || !email || !password)
    return res
      .status(400)
      .json({ code: 400, message: "all fields are required" });

  // validasi email
  const userExist = await usersModel.findOne({ where: { email: email } });
  if (userExist)
    return res.status(400).json({ message: "email already exists" });

  // validasi password
  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "password and confirm password doesn't match" });

  // hash password
  const hashPassword = await argon2.hash(password);

  // file upload
  let avatarPath = `${req.protocol}://${req.get(
    "host"
  )}/images/users/default.png`;

  if (req.files) {
    const file = req.files.avatar_path;
    const ext = path.extname(file.name);
    const fileName = new Date().getTime() + file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/users/${fileName}`;
    const uploadFolder = path.join(
      __dirname,
      `../public/images/users/${fileName}`
    );

    uploadFile(file, uploadFolder, res);
    avatarPath = url;
  }

  // generate verification code
  const userVerifyCode = Math.floor(1000 + Math.random() * 9000).toString();
  const userVerifyCodeExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  try {
    // create user
    const user = await usersModel.create({
      fullname: fullname,
      username: username,
      email: email,
      password: hashPassword,
      avatar_path: req.body.avatar_path || avatarPath,
    });

    // create verification
    await userVerificationsModel.create({
      user_uuid: user.uuid,
      verification_code: userVerifyCode,
      expired_at: userVerifyCodeExpire,
    });

    // send verification email
    sendEmail(
      "Verify Account",
      user.email,
      registerEmailTemplate(
        user.fullname,
        userVerifyCode,
        Date(userVerifyCodeExpire)
      )
    );

    return res.status(200).json({
      code: 200,
      message: "register successfully, check email to verify account",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is activateAccount controller. After register, users should activate
 * their account to get full access some content
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const activateAccount = async (req, res) => {
  try {
    // find all matching activation code
    const code = req.body.verification_code;
    const match = await userVerificationsModel.findAll({
      where: { verification_code: code },
    });

    if (!match[0] || match[0].verification_code != code)
      return res.status(406).json({ code: 406, message: "invalid code" });

    // search user
    const user = await usersModel.findOne({
      where: { uuid: match[0].user_uuid },
    });

    // check user
    if (user.verified) {
      await userVerificationsModel.destroy({ where: { user_uuid: user.uuid } });
      return res
        .status(406)
        .json({ code: 406, message: "user already active" });
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiredCode = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // check duplicate
    if (match[0].length > 1) {
      // resend email verify code
      sendEmail(
        "Verify Account",
        user.email,
        registerEmailTemplate(user.fullname, randomCode, Date(expiredCode))
      );
      return res.status(409).json({
        code: 409,
        message: "conflict! we have resend code, please check your email",
      });
    }

    // check expired
    const date = new Date().getTime();
    const codeExpiredAt = match[0].expired_at;
    if (date >= codeExpiredAt) {
      // resend email verify code
      sendEmail(
        "Verify Account",
        user.email,
        registerEmailTemplate(user.fullname, randomCode, Date(expiredCode))
      );

      return res.status(409).json({
        code: 409,
        message: "code expired! we have resend code, please check your email",
      });
    }

    // update user
    await usersModel.update({ verified: true }, { where: { uuid: user.uuid } });

    // delete code
    await userVerificationsModel.destroy({ where: { user_uuid: user.uuid } });

    return res
      .status(200)
      .json({ code: 200, message: "account has been activate" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is login controller. client send request, then server generate access
 * token and refresh token. client get access_token that needed to access some content
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const login = async (req, res) => {
  try {
    // find user by email
    const user = await usersModel.findOne({
      where: { email: req.body.email },
    });

    //   validasi user
    if (!user)
      return res
        .status(400)
        .json({ code: 400, message: `email not registered` });

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
      is_admin: user.is_admin,
      avatar_path: user.avatar_path,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1m",
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

/**
 * This is getToken controller. use to get access_token without re-login
 * as long as client have refresh_token in their browser cookies
 * @param {*} req
 * @param {*} res
 * @returns
 */
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
          is_admin: user.is_admin,
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

/**
 * This is logout controller. delete token both server and browser cookie
 * @param {*} req
 * @param {*} res
 * @returns
 */
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
