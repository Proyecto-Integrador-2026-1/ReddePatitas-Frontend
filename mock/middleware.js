module.exports = (req, res, next) => {
  // Simple logger and example of blocking deletes without X-ADMIN
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  // Example: block DELETE without header
  if (req.method === 'DELETE' && !req.headers['x-admin']) {
    res.status(403).jsonp({ error: 'Forbidden: missing X-ADMIN header' });
    return;
  }
  next();
};
