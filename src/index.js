import {} from "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import db from "./config/database.js";
import usersRoute from "./routes/users.route.js";
import authRoute from "./routes/auth.route.js";

const PORT = process.env.SERVER_PORT || 3000;
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

// otomatis create table jika tabel belum tersedia di database
(async () => {
  await db.sync();
})();

// route
app.get("/", (req, res) => {
  console.log("ajshjakhsjkashjka");
  res.send("<h1>OK!</h1>");
});

app.use("/users", usersRoute);
app.use("/auth", authRoute);

// listen
app.listen(PORT, () => {
  console.log(
    `server is listening on port: http://${process.env.SERVER_IP}:${PORT}`
  );
});
