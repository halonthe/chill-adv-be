import * as argon2 from "argon2";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import usersModel from "../models/users.model.js";
import { uploadFile } from "../utils/file.upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This is controller to get all user data, only accessible by admin
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getUsers = async (req, res) => {
  try {
    const result = await usersModel.findAll({
      // make sure data sensitif tidak dikirim ke client
      attributes: [
        "uuid",
        "fullname",
        "username",
        "email",
        "is_admin",
        "verified",
        "avatar_path",
      ],
    });
    return res
      .status(200)
      .json({ code: 200, message: "success fetching user", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to get specifiec user
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getUserById = async (req, res) => {
  try {
    // make sure data sensitif tidak dikirim ke client
    const result = await usersModel.findOne({
      attributes: [
        "uuid",
        "fullname",
        "username",
        "email",
        "is_admin",
        "verified",
        "avatar_path",
      ],
      where: {
        uuid: req.params.id,
      },
    });

    // validasi user data
    if (!result) {
      return res.status(200).json({ status: 200, message: "user not found" });
    }

    return res
      .status(200)
      .json({ code: 200, message: "user found", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is an admin feature to add users that they do not need to send an activation code to verify their account.
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const addUser = async (req, res) => {
  const { fullname, username, email, password, confPassword, is_admin } =
    req.body;

  // validasi email
  const userExist = await usersModel.findOne({ where: { email: email } });
  if (userExist)
    return res.status(400).json({ message: "email already exists" });

  // validasi password
  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "password and confirm password doesn't match" });

  const hashPassword = await argon2.hash(password);

  // file upload
  let avatarPath = `${req.protocol}://${req.get(
    "host"
  )}/images/users/default.png`;

  if (req.files) {
    const file = req.files.file;
    const ext = path.extname(file.name);
    const fileName = file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/users/${fileName}`;
    const uploadFolder = path.join(
      __dirname,
      `../public/images/users/${fileName}`
    );

    uploadFile(req, res, uploadFolder);
    avatarPath = url;
  }

  // push to database
  try {
    const result = await usersModel.create({
      fullname: fullname,
      username: username,
      email: email,
      password: hashPassword,
      is_admin: is_admin,
      avatar_path: avatarPath,
    });
    return res
      .status(201)
      .json({ code: 201, message: "user created", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller for users to update their data
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const updateUser = async (req, res) => {
  const { fullname, username, email, password, confPassword, is_admin } =
    req.body;

  // validasi user
  const user = await usersModel.findOne({ where: { uuid: req.params.id } });
  if (!user) {
    return res.status(200).json({ status: 200, message: "user not found" });
  }

  // validasi password
  let hashPassword;

  if (password === "" || password === null) {
    hashPassword = user.password;
  } else {
    hashPassword = await argon2.hash(password);
  }

  if (password !== confPassword)
    return res.status(400).json({
      code: 400,
      message: "password and confirm password doesn't match",
    });

  // file upload
  let avatarPath = `${req.protocol}://${req.get(
    "host"
  )}/images/users/default.png`;

  if (req.files) {
    const file = req.files.file;
    const ext = path.extname(file.name);
    const fileName = file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/users/${fileName}`;
    const uploadFolder = path.join(
      __dirname,
      `../public/images/users/${fileName}`
    );

    uploadFile(req, res, uploadFolder);
    avatarPath = url;
  }

  // update data
  try {
    const result = await usersModel.update(
      {
        fullname: fullname,
        username: username,
        email: email,
        password: hashPassword,
        is_admin: is_admin,
        avatar_path: avatarPath,
      },
      {
        where: { uuid: user.uuid },
      }
    );
    return res
      .status(200)
      .json({ code: 200, message: "user updated", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to delete user, only accessible by admin
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const deleteUser = async (req, res) => {
  try {
    // find user
    const user = await usersModel.findOne({
      where: { uuid: req.params.id },
    });

    if (!user)
      return res.status(200).json({ status: 200, message: "user not found" });

    // delete user image file
    const fileUrl = user.avatar_path;
    const fileArr = fileUrl.split("/");
    const fileName = fileArr[fileArr.length - 1];
    const filePath = path.join(__dirname, `../public/images/users/${fileName}`);
    fs.unlinkSync(filePath);

    // delete user data
    await usersModel.destroy({
      where: { uuid: req.params.id },
    });
    return res.status(200).json({ code: 200, message: "user deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};
