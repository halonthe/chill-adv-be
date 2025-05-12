import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import moviesModel from "../models/movies.model.js";
import { uploadFile } from "../utils/file.upload.js";
import { Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * This is controller to get all movies data
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getMovies = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const offset = limit * page;

    // fetch movie
    const movies = await moviesModel.findAll({
      where: {
        [Op.or]: [
          {
            title: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
      offset: offset,
      limit: limit,
      order: [["title", "ASC"]],
    });

    // total rows
    const rows = await moviesModel.count({
      where: {
        [Op.or]: [
          {
            title: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
    });

    // total pages
    const pages = Math.ceil(rows / limit);

    // return
    return res.status(200).json({
      code: 200,
      message: "success fetching movies",
      data: movies,
      page: page,
      limit: limit,
      totalRows: rows,
      totalPages: pages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to get specifiec movie
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getMovieById = async (req, res) => {
  try {
    const movies = await moviesModel.findOne({ where: { id: req.params.id } });

    if (!movies)
      return res.status(200).json({ code: 200, message: "movie not found" });

    return res
      .status(200)
      .json({ code: 200, message: "success fetching movies", data: movies });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to add movie
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const addMovie = async (req, res) => {
  try {
    const {
      title,
      overview,
      rating,
      age_rating,
      genre_id,
      release_date,
      runtime,
      casters,
      director,
      writer,
      is_premium,
      trailer_path,
      video_path,
    } = req.body;

    // check field
    if (
      !title ||
      !overview ||
      !rating ||
      !age_rating ||
      !genre_id ||
      !release_date ||
      !runtime ||
      !casters ||
      !director ||
      !writer ||
      !is_premium ||
      !trailer_path ||
      !video_path
    )
      return res
        .status(400)
        .json({ code: 400, message: "all fields are required" });

    // prevent duplicate
    const duplicate = await moviesModel.findOne({
      where: { title: title },
    });

    if (duplicate)
      return res
        .status(400)
        .json({ code: 400, message: "movie already exist" });

    // poster upload
    let posterPath = `${req.protocol}://${req.get(
      "host"
    )}/images/posters/default.png`;

    if (req.files) {
      const file = req.files.poster_path;
      const ext = path.extname(file.name);
      const fileName = new Date().getTime() + file.md5 + ext;

      //   image validation
      const allowedFormat = [".png", ".jpg", ".jpeg"];
      if (!allowedFormat.includes(ext.toLowerCase()))
        return res
          .status(422)
          .json({ code: 422, message: "only picture format supported" });

      const fileSize = file.data.length;
      if (fileSize > 5000000)
        return res
          .status(422)
          .json({ code: 422, message: "file-size must be less than 5MB" });

      //   save file
      const uploadFolder = path.join(
        __dirname,
        `../public/images/posters/${fileName}`
      );
      await file.mv(uploadFolder, async (error) => {
        if (error)
          return res.status(500).json({ code: 500, message: error.message });
      });

      // save path
      const url = `${req.protocol}://${req.get(
        "host"
      )}/images/posters/${fileName}`;
      posterPath = url;
    }

    // push to  database
    const result = await moviesModel.create({
      title: title,
      overview: overview,
      rating: rating,
      age_rating: age_rating,
      genre_id: genre_id,
      release_date: release_date,
      runtime: runtime,
      casters: casters,
      director: director,
      writer: writer,
      is_premium: is_premium,
      poster_path: req.body.poster_path || posterPath,
      trailer_path: trailer_path,
      video_path: video_path,
    });
    return res
      .status(201)
      .json({ code: 201, message: "movies added", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to update movie data
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const updateMovie = async (req, res) => {
  const {
    title,
    overview,
    rating,
    age_rating,
    genre_id,
    release_date,
    runtime,
    casters,
    director,
    writer,
    is_premium,
    trailer_path,
    video_path,
  } = req.body;

  try {
    //   find movies
    const movies = await moviesModel.findOne({ where: { id: req.params.id } });
    if (!movies)
      return res.status(200).json({ status: 200, message: "movie not found" });

    // check file
    let posterPath = movies.poster_path;
    if (req.files) {
      const fileArr = posterPath.split("/");
      const oldFile = fileArr[fileArr.length - 1];
      const file = req.files.poster_path;
      const ext = path.extname(file.name);
      const fileName = new Date().getTime() + file.md5 + ext;

      // delete old picture
      if (oldFile != fileName || oldFile != "default.png") {
        const filePath = path.join(
          __dirname,
          `../public/images/posters/${oldFile}`
        );
        fs.unlinkSync(filePath);
      }

      // upload new picture
      const url = `${req.protocol}://${req.get(
        "host"
      )}/images/posters/${fileName}`;
      const uploadFolder = path.join(
        __dirname,
        `../public/images/posters/${fileName}`
      );

      uploadFile(file, uploadFolder, res);
      posterPath = url;
    }

    //   update database
    await moviesModel.update(
      {
        title: title,
        overview: overview,
        rating: rating,
        age_rating: age_rating,
        genre_id: genre_id,
        release_date: release_date,
        runtime: runtime,
        casters: casters,
        director: director,
        writer: writer,
        is_premium: is_premium,
        poster_path: posterPath,
        trailer_path: trailer_path,
        video_path: video_path,
      },
      { where: { id: req.params.id } }
    );
    return res.status(200).json({ code: 200, message: "movie updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to delete movie
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const deleteMovie = async (req, res) => {
  try {
    // find movie
    const movie = await moviesModel.findOne({
      where: { id: req.params.id },
    });

    if (!movie)
      return res.status(200).json({ code: 200, message: "movie not found" });

    // delete poster file
    const fileUrl = movie.poster_path;
    const fileArr = fileUrl.split("/");
    const fileName = fileArr[fileArr.length - 1];
    if (fileName != "default.png") {
      const filePath = path.join(
        __dirname,
        `../public/images/posters/${fileName}`
      );

      fs.unlinkSync(filePath);
    }

    // delete from database
    await moviesModel.destroy({
      where: { id: req.params.id },
    });
    return res.status(200).json({ code: 200, message: "movie deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};
