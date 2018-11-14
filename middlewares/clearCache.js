const { clearHash } = require('../services/cache');

module.exports = async (req, _res, next) => {
  // post-main action
  await next();

  clearHash(req.user.id);
};