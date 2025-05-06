import { Router } from "express";
import {
  addUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/verify.token.js";

const usersRoute = Router();

// get all users
usersRoute.get("/", verifyToken, getUsers);
// get user by id
usersRoute.get("/:id", verifyToken, getUserById);
// add user
usersRoute.post("/", addUser);
// update user
usersRoute.patch("/:id", verifyToken, updateUser);
// delete user
usersRoute.delete("/:id", verifyToken, deleteUser);

export default usersRoute;
