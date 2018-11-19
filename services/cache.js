const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const redisClient = redis.createClient(keys.redisUrl);

const exec = mongoose.Query.prototype.exec;
redisClient.hget = util.promisify(redisClient.hget);

mongoose.Query.prototype.cache = function({ key } = {}) {
  this.redis_useCache = true;
  this.redis_hashKey = JSON.stringify(key || '');


  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.redis_useCache) {
    return exec.apply(this, arguments);
  }
  this.useRedisCache = false;

  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name,
  }));

  let cacheValue = await redisClient.hget(this.redis_hashKey, key);
  if (cacheValue) {
    cacheValue = JSON.parse(cacheValue);
    return Array.isArray(cacheValue)
      ? cacheValue.map(d => new this.model(d))
      : new this.model(cacheValue);
  }

  const queryResult = await exec.apply(this, arguments);
  redisClient.hset(this.redis_hashKey, key, JSON.stringify(queryResult), 'EX', 10);

  return queryResult;
};

module.exports = {
  clearHash(redis_hashKey) {
    redisClient.del(JSON.stringify(redis_hashKey));
  }
};