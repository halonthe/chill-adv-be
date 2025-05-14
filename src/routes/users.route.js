import { Router } from "express";
import { verifyToken } from "../middleware/verify.token.js";
import { verifyAccount } from "../middleware/verify.account.js";
import { verifyRole } from "../middleware/verify.role.js";
import {
  addUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/users.controller.js";
import { verifyFile } from "../middleware/verify.file.js";

const usersRoute = Router();

// get all users
usersRoute.get("/", verifyToken, verifyAccount, verifyRole, getUsers);
// get user by id
usersRoute.get("/:id", verifyToken, verifyAccount, getUserById);
// add user
usersRoute.post(
  "/",
  verifyToken,
  verifyAccount,
  verifyRole,
  verifyFile,
  addUser
);
// update user
usersRoute.patch(
  "/:id",
  verifyToken,
  verifyAccount,
  verifyRole,
  verifyFile,
  updateUser
);
// delete user
usersRoute.delete("/:id", verifyToken, verifyAccount, verifyRole, deleteUser);

export default usersRoute;
