import db from "../config/database.js";
import genresModel from "../models/genres.model.js";
import moviesModel from "../models/movies.model.js";
import userVerificationsModel from "../models/user.verifications.model.js";
import usersModel from "../models/users.model.js";

export const syncDb = async () => {
  // relasi
  usersModel.hasOne(userVerificationsModel, { foreignKey: "user_uuid" });
  userVerificationsModel.belongsTo(usersModel, {
    foreignKey: "user_uuid",
  });

  moviesModel.belongsTo(genresModel, { foreignKey: "genre_id" });
  genresModel.hasMany(moviesModel, { foreignKey: "genre_id" });

  // sync db: otomatis `create table` jika tabel tidak ada
  await db.sync();
};
