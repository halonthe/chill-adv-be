import { Sequelize } from "sequelize";
import db from "../config/database.js";
import usersModel from "./users.model.js";

const { DataTypes } = Sequelize;

const userVerificationsModel = db.define(
  "user_verifications",
  {
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

usersModel.hasOne(userVerificationsModel, { foreignKey: "user_uuid" });
userVerificationsModel.belongsTo(usersModel, {
  foreignKey: "user_uuid",
});

export default userVerificationsModel;
