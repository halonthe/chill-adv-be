import jwt from "jsonwebtoken";

/**
 * This is middleware to check if user has authorized
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token === null)
    return res
      .status(401)
      .json({ code: 401, message: "unauthorized, token is needed" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error) => {
    if (error)
      return res
        .status(403)
        .json({ code: 403, message: "access denied, token invalid" });

    next();
  });
};
