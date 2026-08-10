const { apiKey } = require('../config/env');

function requireApiKey(req, res, next) {
  const key = req.headers.apikey || req.headers['api-key'] || req.query.apikey;
  if (!key || key !== apiKey) {
    return res.status(401).json({
      status: false,
      message: 'Invalid or missing apikey',
      data: null,
    });
  }
  return next();
}

module.exports = { requireApiKey };
