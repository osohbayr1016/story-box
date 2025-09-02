module.exports = () => {
  return (req, res, next) => {
    const key = req.headers.key || req.body.key || req.query.key;

    const expectedKey = process.env?.secretKey || "dev-secret";

    if (key) {
      if (key === expectedKey) {
        next();
      } else {
        return res
          .status(400)
          .json({ status: false, error: "Unpermitted infiltration" });
      }
    } else {
      return res
        .status(400)
        .json({ status: false, error: "Unpermitted infiltration" });
    }
  };
};
