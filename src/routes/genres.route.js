import { Router } from "express";
import {
  addGenre,
  deleteGenre,
  getGenreById,
  getGenres,
  updateGenre,
} from "../controllers/genres.controller.js";

const genresRoute = Router();

// get all genres
genresRoute.get("/", getGenres);
// get genre by id
genresRoute.get("/:id", getGenreById);
// add genres
genresRoute.post("/", addGenre);
// update genres
genresRoute.patch("/:id", updateGenre);
// delete genres
genresRoute.delete("/:id", deleteGenre);

export default genresRoute;
