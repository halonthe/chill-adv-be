import { Op } from "sequelize";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import moviesModel from "../models/movies.model.js";
import genresModel from "../models/genres.model.js";

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
    const { search, genre, sort } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const offset = limit * page;

    const where = {};
    const genreWhere = {};
    const order = [];

    // search by title
    if (search) {
      where.title = { [Op.like]: "%" + search + "%" };
    }

    // filter by single or multiple genre (ex: genre=drama,action)
    if (genre) {
      const genreArr = genre.split(",");
      genreWhere.name = { [Op.in]: genreArr };
    }

    // sort: sortBy, sortOrder (ex: sort=release_date,asc)
    if (sort) {
      const [sortBy, sortOrder] = sort.split(",");
      if (sortBy && sortOrder) order.push([sortBy, sortOrder.toUpperCase()]);
    }

    // fetch movies
    const movies = await moviesModel.findAll({
      where,
      include: [
        {
          model: genresModel,
          where: genreWhere, // filter genre by name
          attributes: ["name"],
        },
      ],
      order,
      offset: offset,
      limit: limit,
    });

    if (!movies[0]) return res.sendStatus(204);

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
export const getMovieBySlug = async (req, res) => {
  try {
    const slug = req.params.slug.split("-").join(" ");
    const movies = await moviesModel.findOne({ where: { title: slug } });

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
    const url = `${req.protocol}://${req.get("host")}`;
    let posterPath = `${url}/images/posters/default.png`;

    if (req.files) {
      const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
      const file = req.files.poster_path;
      const ext = path.extname(file.name);
      const fileName = uniqueSuffix + file.md5 + ext;

      //   save file
      const uploadPath = path.join(
        __dirname,
        `../public/images/posters/${fileName}`
      );
      file.mv(uploadPath, async (error) => {
        if (error)
          return res.status(500).json({ code: 500, message: error.message });
      });

      // save url path
      posterPath = `${url}/images/posters/${fileName}`;
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
      poster_path: posterPath,
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
    const slug = req.params.slug.split("-").join(" ");
    const movies = await moviesModel.findOne({ where: { title: slug } });
    if (!movies)
      return res.status(200).json({ status: 200, message: "movie not found" });

    // check file
    let posterPath = movies.poster_path;
    const fileArr = posterPath.split("/");
    const oldFile = fileArr[fileArr.length - 1];

    if (req.files) {
      const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
      const file = req.files.poster_path;
      const ext = path.extname(file.name);
      const fileName = uniqueSuffix + file.md5 + ext;

      // delete old picture
      if (oldFile != fileName && oldFile != "default.png") {
        fs.unlinkSync(
          path.join(__dirname, `../public/images/posters/${oldFile}`)
        );
        // upload new picture
        const uploadFolder = path.join(
          __dirname,
          `../public/images/posters/${fileName}`
        );
        file.mv(uploadFolder, async (error) => {
          if (error)
            return res.status(500).json({ code: 500, message: error.message });
        });

        posterPath = `${req.protocol}://${req.get(
          "host"
        )}/images/posters/${fileName}`;
      }
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
      { where: { id: movies.id } }
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
    const slug = req.params.slug.split("-").join(" ");
    const movie = await moviesModel.findOne({
      where: { title: slug },
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
      where: { id: movie.id },
    });
    return res.status(200).json({ code: 200, message: "movie deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};
