const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');

const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');

const uuidNamespace = uuidv4();

const s3 = new AWS.S3({
  accessKeyId: keys.awsAccessKeyId,
  secretAccessKey: keys.awsSecretAccessKey,
});

const getFileExtension = filename =>
  `${/(?:\.([^.]+))?$/.exec(filename)[1]}`;

const getFileType = filename =>
  `image/${getFileExtension(filename)}`;

const getFormattedFileKey = (userId, filename) =>
  `${userId}/${uuidv5(filename, uuidNamespace)}.${getFileExtension(filename)}`;

module.exports = app => {
  app.post('/api/upload', requireLogin, (req, res) => {
    const { filename } = req.body;
    const key = getFormattedFileKey(req.user.id, filename);

    s3.getSignedUrl(
      'putObject',
      {
        Bucket: 'blog-dev-stevensuh',
        ContentType: getFileType(filename),
        Key: key,
      },
      (_err, url) => {
        res.send({
          key,
          url,
        });
      },
    );
  });
};