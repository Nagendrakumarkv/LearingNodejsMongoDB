const logRequest = (req, res, next) => {
  const { method, path } = req;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path}`);
  next(); // Pass control to the next middleware or route
};

module.exports = logRequest;
