import { Router } from "express";
import {
  activateAccount,
  getToken,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";

const authRoute = Router();

// register
authRoute.post("/register", register);
// verify account
authRoute.post("/verify-account", activateAccount);
// login
authRoute.post("/login", login);
// logout
authRoute.delete("/logout", logout);
// get token
authRoute.get("/get-token", getToken);

export default authRoute;
