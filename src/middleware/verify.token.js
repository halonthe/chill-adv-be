import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token === null)
    return res.status(401).json({ code: 401, message: "unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error)
      return res.status(403).json({ code: 403, message: "invalid token" });
    req.email = decoded.email;
    console.log(req.email);
    next();
  });
};
