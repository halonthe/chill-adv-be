import * as argon2 from "argon2";
import usersModel from "../models/users.model.js";

// get all users
export const getUsers = async (req, res) => {
  try {
    const result = await usersModel.findAll({
      // make sure data sensitif tidak dikirim ke client
      attributes: [
        "uuid",
        "fullname",
        "username",
        "email",
        "role",
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

// get user by id
export const getUserById = async (req, res) => {
  try {
    // make sure data sensitif tidak dikirim ke client
    const result = await usersModel.findOne({
      attributes: [
        "uuid",
        "fullname",
        "username",
        "email",
        "role",
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

// add user
export const addUser = async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    confPassword,
    role,
    avatar_path,
  } = req.body;

  // validasi email
  const findUser = await usersModel.findOne({ where: { email: email } });
  if (findUser && email === findUser.email)
    return res.status(400).json({ message: "email already exists" });

  // validasi password
  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "password and confirm password doesn't match" });

  const hashPassword = await argon2.hash(password);

  try {
    const result = await usersModel.create({
      fullname: fullname,
      username: username,
      email: email,
      password: hashPassword,
      role: role,
      avatar_path: avatar_path,
    });
    return res
      .status(201)
      .json({ code: 201, message: "user created", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

// update user
export const updateUser = async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    confPassword,
    role,
    avatar_path,
  } = req.body;

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
    return res
      .status(400)
      .json({ message: "password and confirm password not match" });

  try {
    const result = await usersModel.update(
      {
        fullname: fullname,
        username: username,
        email: email,
        password: hashPassword,
        role: role,
        avatar_path: avatar_path,
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

// delete user
export const deleteUser = async (req, res) => {
  try {
    const result = await usersModel.destroy({
      where: { uuid: req.params.id },
    });
    return res
      .status(200)
      .json({ code: 200, message: "user deleted", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};
