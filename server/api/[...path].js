const app = require('../app');
const initializeServer = require('../bootstrap');

module.exports = async (req, res) => {
  await initializeServer();
  return app(req, res);
};
