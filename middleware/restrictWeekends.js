const restrictWeekends = (req, res, next) => {
  const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  // if (day === 0 || day === 6) {
  if (day === 0) {
    return res.status(403).send("No access on weekends!");
  }
  next();
};

module.exports = restrictWeekends;
