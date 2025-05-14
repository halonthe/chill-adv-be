import { Router } from "express";
import { verifyToken } from "../middleware/verify.token.js";
import { verifyAccount } from "../middleware/verify.account.js";
import { verifyRole } from "../middleware/verify.role.js";
import { verifyFile } from "../middleware/verify.file.js";
import {
  addMovie,
  deleteMovie,
  getMovieBySlug,
  getMovies,
  updateMovie,
} from "../controllers/movies.controller.js";

const moviesRoute = Router();

// get all movies
moviesRoute.get(
  "/",
  // verifyToken, verifyAccount,
  getMovies
);

// get movie by title
moviesRoute.get("/:slug", verifyToken, verifyAccount, getMovieBySlug);

// add movie
moviesRoute.post(
  "/",
  verifyToken,
  verifyAccount,
  verifyRole,
  verifyFile,
  addMovie
);

// update movie
moviesRoute.patch(
  "/:slug",
  verifyToken,
  verifyAccount,
  verifyRole,
  verifyFile,
  updateMovie
);

// delete movie
moviesRoute.delete(
  "/:slug",
  verifyToken,
  verifyAccount,
  verifyRole,
  deleteMovie
);

export default moviesRoute;
