import * as argon2 from "argon2";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import usersModel from "../models/users.model.js";

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
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const offset = limit * page;

    // fetch users
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
      where: {
        [Op.or]: [
          {
            fullname: { [Op.like]: "%" + search + "%" },
          },
          {
            username: { [Op.like]: "%" + search + "%" },
          },
          {
            email: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
      offset: offset,
      limit: limit,
      order: [["fullname", "ASC"]],
    });

    if (!result[0]) return res.sendStatus(204);

    // total rows
    const rows = await usersModel.count({
      where: {
        [Op.or]: [
          {
            fullname: { [Op.like]: "%" + search + "%" },
          },
          {
            username: { [Op.like]: "%" + search + "%" },
          },
          {
            email: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
    });

    // total pages
    const pages = Math.ceil(rows / limit);

    // return
    return res.status(200).json({
      code: 200,
      message: "success fetching users",
      data: result,
      page: page,
      limit: limit,
      totalRows: rows,
      totalPages: pages,
    });
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
  const { fullname, username, email, password, confPassword } = req.body;

  // check field
  if (!fullname || !username || !email || !password)
    return res
      .status(400)
      .json({ code: 400, message: "all fields are required" });

  // validasi email
  const emailExist = await usersModel.findOne({ where: { email: email } });
  if (emailExist)
    return res.status(400).json({ message: "email already exists" });

  // validasi username
  const regexUsername = /^[a-zA-Z0-9]{3,}$/g;
  const usernameProvide = regexUsername.test(username);

  if (!usernameProvide)
    return res.status(400).json({
      message:
        "ensure username have at least 3 char, no whitespace, and no special character",
    });

  const usernameExist = await usersModel.findOne({
    where: { username: username },
  });
  if (usernameExist)
    return res.status(400).json({ message: "username already taken" });

  // validasi password
  const regexPassword =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!-\/:-@[-`{-~]).{8,}$/g;
  const passwordStrong = regexPassword.test(password);

  if (!passwordStrong)
    return res.status(400).json({
      message:
        "password must have at least 8 char, at least one uppercase letter, one lowercase letter, one number and one special character",
    });

  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "password and confirm password doesn't match" });

  const hashPassword = await argon2.hash(password);

  try {
    // avatar upload
    const url = `${req.protocol}://${req.get("host")}`;
    let avatarPath = `${url}/images/users/default.png`;

    if (req.files) {
      const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
      const file = req.files.avatar_path;
      const ext = path.extname(file.name);
      const fileName = uniqueSuffix + file.md5 + ext;

      //   save file
      const uploadPath = path.join(
        __dirname,
        `../public/images/users/${fileName}`
      );
      file.mv(uploadPath, async (error) => {
        if (error)
          return res.status(500).json({ code: 500, message: error.message });
      });

      // save url path
      avatarPath = `${url}/images/users/${fileName}`;
    }

    // push to database
    const result = await usersModel.create({
      fullname: fullname,
      username: username,
      email: email,
      password: hashPassword,
      verified: true,
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

  // check file
  let avatarPath = user.avatar_path;
  const fileArr = avatarPath.split("/");
  const oldFile = fileArr[fileArr.length - 1];
  if (req.files) {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    const file = req.files.avatar_path;
    const ext = path.extname(file.name);
    const fileName = uniqueSuffix + file.md5 + ext;

    // delete old picture
    if (oldFile != fileName && oldFile != "default.png") {
      fs.unlinkSync(path.join(__dirname, `../public/images/users/${oldFile}`));
      // upload new picture
      const uploadFolder = path.join(
        __dirname,
        `../public/images/users/${fileName}`
      );
      file.mv(uploadFolder, async (error) => {
        if (error)
          return res.status(500).json({ code: 500, message: error.message });
      });

      avatarPath = `${req.protocol}://${req.get(
        "host"
      )}/images/users/${fileName}`;
    }
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
    if (fileName != "default.png") {
      fs.unlinkSync(path.join(__dirname, `../public/images/users/${fileName}`));
    }

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
