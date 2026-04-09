const normalizeUrl = (value) => value.replace(/\/$/, '');

const getAppUrl = (req) => {
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    if (host) {
      return `${protocol}://${host}`;
    }
  }

  if (process.env.APP_URL) {
    return normalizeUrl(process.env.APP_URL);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${normalizeUrl(process.env.VERCEL_URL)}`;
  }

  return 'http://localhost:5000';
};

module.exports = getAppUrl;
