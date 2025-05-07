import { Sequelize } from "sequelize";
import db from "../config/database.js";
import usersModel from "./users.model.js";

const { DataTypes } = Sequelize;

const userVerificationsModel = db.define(
  "user_verifications",
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token_expired: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

usersModel.hasOne(userVerificationsModel);
userVerificationsModel.belongsTo(usersModel, { foreignKey: "userId" });

export default userVerificationsModel;
