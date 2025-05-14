import path from "path";

/**
 * This is middleware to validate file upload
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const verifyFile = async (req, res, next) => {
  if (req.files) {
    const file = req.files.avatar_path || req.files.poster_path;
    const ext = path.extname(file.name);
    const fileSize = file.data.length;
    const allowedFormat = [".webp", ".png", ".jpg", ".jpeg"];

    if (!allowedFormat.includes(ext.toLowerCase()))
      return res
        .status(422)
        .json({ code: 422, message: "only picture format supported" });

    if (fileSize > 5000000)
      return res
        .status(422)
        .json({ code: 422, message: "file-size must be less than 5MB" });

    next();
  } else {
    next();
  }
};
