import { Router } from "express";
import {
  addMovie,
  deleteMovie,
  getMovieById,
  getMovies,
  updateMovie,
} from "../controllers/movies.controller.js";
import { verifyToken } from "../middleware/verify.token.js";
import { verifyAccount } from "../middleware/verify.account.js";

const moviesRoute = Router();

// get all movies
moviesRoute.get("/", getMovies);
// get movie by id
moviesRoute.get("/:id", getMovieById);
// add movie
moviesRoute.post("/", addMovie);
// update movie
moviesRoute.patch("/:id", updateMovie);
// delete movie
moviesRoute.delete("/:id", deleteMovie);

export default moviesRoute;
