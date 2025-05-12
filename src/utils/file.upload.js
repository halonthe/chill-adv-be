import path from "path";

/**
 * This is function to upload file
 * @param {*} file the name of file request
 * @param {*} uploadFolder destination uploaded file
 * @param {*} res response
 * @returns
 */
export const uploadFile = async (file, uploadFolder, res) => {
  // define
  const ext = path.extname(file.name);
  const fileSize = file.data.length;
  const allowedFormat = [".png", ".jpg", ".jpeg"];

  //   check extension
  if (!allowedFormat.includes(ext.toLowerCase()))
    return res
      .status(422)
      .json({ code: 422, message: "only picture format supported" });
  if (fileSize > 5000000)
    return res
      .status(422)
      .json({ code: 422, message: "file-size must be less than 5MB" });

  //   save file
  await file.mv(uploadFolder, async (error) => {
    if (error)
      return res.status(500).json({ code: 500, message: error.message });
  });
};
