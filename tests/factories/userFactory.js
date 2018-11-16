const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = {
  new: () =>
    new User({}).save(),
  delete: _id =>
    User.find({ _id }).remove(),
};