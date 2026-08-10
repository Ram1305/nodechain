function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: false,
    message: err.message || 'Internal server error',
    data: null,
  });
}

module.exports = { errorHandler };
