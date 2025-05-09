import { Router } from "express";
import {
  addUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/verify.token.js";
import { verifyAccount } from "../middleware/verify.account.js";
import { verifyRole } from "../middleware/verify.role.js";

const usersRoute = Router();

// get all users
usersRoute.get("/", verifyToken, verifyAccount, verifyRole, getUsers);
// get user by id
usersRoute.get("/:id", verifyToken, verifyAccount, getUserById);
// add user (features: admin bisa add user tanpa verifikasi email )
usersRoute.post("/", verifyToken, verifyAccount, verifyRole, addUser);
// update user
usersRoute.patch("/:id", verifyToken, verifyAccount, updateUser);
// delete user
usersRoute.delete("/:id", verifyToken, verifyAccount, verifyRole, deleteUser);

export default usersRoute;
