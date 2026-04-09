const app = require('../server/app');
const initializeServer = require('../server/bootstrap');

module.exports = async (req, res) => {
  await initializeServer();
  return app(req, res);
};
