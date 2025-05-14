import { Sequelize } from "sequelize";
import db from "../config/database.js";
import genresModel from "./genres.model.js";

const { DataTypes } = Sequelize;

const moviesModel = db.define(
  "movies",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    overview: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    rating: {
      type: DataTypes.DECIMAL(10, 1),
      allowNull: false,
      validate: { notEmpty: true },
    },
    age_rating: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "genres",
        key: "id", //foreign key
      },
      onDelete: "NO ACTION",
      onUpdate: "SET DEFAULT",
      validate: {
        notEmpty: true,
        notExist(id) {
          return genresModel.findByPk(id).then((genre) => {
            if (!genre) {
              throw new Error("genre not found");
            }
          });
        },
      },
    },
    release_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { notEmpty: true },
    },
    runtime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true },
    },
    casters: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    director: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    writer: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    poster_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    trailer_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    video_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { freezeTableName: true, timestamps: true, paranoid: true }
);

export default moviesModel;
