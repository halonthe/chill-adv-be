import {} from "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import usersRoute from "./routes/users.route.js";
import authRoute from "./routes/auth.route.js";
import moviesRoute from "./routes/movies.route.js";
import genresRoute from "./routes/genres.route.js";
import { syncDb } from "./utils/sync.databse.js";

const PORT = process.env.SERVER_PORT || 5000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// middleware
app.use(cors({ credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "./public")));

// sync database
syncDb();

// route
app.use("/users", usersRoute);
app.use("/auth", authRoute);
app.use("/movies", moviesRoute);
app.use("/genres", genresRoute);

// listen
app.listen(PORT, () => {
  console.log(
    `server is listening on port: http://${process.env.SERVER_IP}:${PORT}`
  );
});
