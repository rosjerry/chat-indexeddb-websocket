export const errorHandler = (
  err,
  _req,
  res,
  _next
) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
};