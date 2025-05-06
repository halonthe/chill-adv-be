import { Router } from "express";
import { getToken, login, logout } from "../controllers/auth.controller.js";

const authRoute = Router();

// login
authRoute.post("/", login);
// logout
authRoute.delete("/", logout);
// get token
authRoute.get("/token", getToken);

export default authRoute;
