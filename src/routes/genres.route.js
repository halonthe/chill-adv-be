import { Router } from "express";
import { verifyToken } from "../middleware/verify.token.js";
import { verifyAccount } from "../middleware/verify.account.js";
import { verifyRole } from "../middleware/verify.role.js";
import {
  addGenre,
  deleteGenre,
  getGenreById,
  getGenres,
  updateGenre,
} from "../controllers/genres.controller.js";

const genresRoute = Router();

// get all genres
genresRoute.get("/", verifyToken, verifyAccount, getGenres);
// get genre by id
genresRoute.get("/:id", verifyToken, verifyAccount, getGenreById);
// add genres
genresRoute.post("/", verifyToken, verifyAccount, verifyRole, addGenre);
// update genres
genresRoute.patch("/:id", verifyToken, verifyAccount, verifyRole, updateGenre);
// delete genres
genresRoute.delete("/:id", verifyToken, verifyAccount, verifyRole, deleteGenre);

export default genresRoute;
