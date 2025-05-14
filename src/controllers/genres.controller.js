import { Op } from "sequelize";
import genresModel from "../models/genres.model.js";

/**
 * This is controller to get all genre
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getGenres = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const offset = limit * page;

    // fetch genres
    const genres = await genresModel.findAll({
      where: {
        [Op.or]: [
          {
            name: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
      offset: offset,
      limit: limit,
      order: [["id", "ASC"]],
    });

    if (!genres[0]) return res.sendStatus(204);

    // total rows
    const rows = await genresModel.count({
      where: {
        [Op.or]: [
          {
            name: { [Op.like]: "%" + search + "%" },
          },
        ],
      },
    });

    // total pages
    const pages = Math.ceil(rows / limit);

    // return
    return res.status(200).json({
      code: 200,
      message: "success fetching genres",
      data: genres,
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
 * This is controller to get specific genre
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const getGenreById = async (req, res) => {
  try {
    const genre = await genresModel.findOne({ where: { id: req.params.id } });

    if (!genre)
      return res.status(200).json({ code: 200, message: "genre not found" });

    res.status(200).json({ code: 200, message: "genre found", data: genre });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to add genre
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const addGenre = async (req, res) => {
  try {
    // check field
    if (!req.body || !req.body.name)
      return res
        .status(400)
        .json({ code: 400, message: "all field are required" });

    // prevent duplicate
    const duplicate = await genresModel.findOne({
      where: { name: req.body.name },
    });
    if (duplicate)
      return res
        .status(400)
        .json({ code: 400, message: "genre already exist" });

    // push to db
    const result = await genresModel.create(req.body);
    return res
      .status(201)
      .json({ code: 201, message: "genres added", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to update genre
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const updateGenre = async (req, res) => {
  try {
    // find genre
    const genre = await genresModel.findOne({ where: { id: req.params.id } });
    if (!genre)
      return res.status(200).json({ code: 200, message: "genre not found" });

    // update genre
    const result = await genresModel.update(req.body, {
      where: { id: req.params.id },
    });
    res.status(200).json({ code: 200, message: "genre updated", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * This is controller to delete genre
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const deleteGenre = async (req, res) => {
  try {
    // find genre
    const genre = await genresModel.findOne({ where: { id: req.params.id } });
    if (!genre)
      return res.status(200).json({ code: 200, message: "genre not found" });

    // delete
    await genresModel.destroy({ where: { id: genre.id } });
    return res.status(200).json({ code: 200, message: "genre deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: error.message });
  }
};
