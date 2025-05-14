import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const userVerificationsModel = db.define(
  "user_verifications",
  {
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "uuid",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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

export default userVerificationsModel;
