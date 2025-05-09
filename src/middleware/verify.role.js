import usersModel from "../models/users.model.js";

/**
 * This is middleware to check if user has `admin` role
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const verifyRole = async (req, res, next) => {
  // get token from cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken)
    return res.status(401).json({ code: 401, message: "unauthorized" });

  //   find user by token
  const user = await usersModel.findAll({
    where: { refresh_token: refreshToken },
  });

  // validate token
  if (!user[0])
    return res.status(403).json({ code: 403, message: "invalid token" });

  //  validate role
  if (user[0].is_admin !== true)
    return res
      .status(403)
      .json({ code: 403, message: "required `admin` role" });

  next();
};
