import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

// define(model,atribut,opsi)
const usersModel = db.define(
  "users",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      unique: true,
      validate: { notEmpty: true },
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [3, 100] }, // len: [min-char, max-char]
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, len: [5, 100] }, // len: [min-char, max-char]
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      validate: { notEmpty: true },
    },
    avatar_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      validate: { notEmpty: true },
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    // set paranoid & timestamps ke true untuk aktifkan soft delete row.
    // kalau mau hard delete tinggal set force -> true di user controller:
    // usersModel.destroy({ where: {uuid: xxxxx },{force: true} })
    timestamps: true,
    paranoid: true,
  }
);

export default usersModel;
