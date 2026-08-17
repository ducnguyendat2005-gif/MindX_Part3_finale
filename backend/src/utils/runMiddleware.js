export const runMiddleware = (req, res, middleware) =>
  new Promise((resolve, reject) => {
    middleware(req, res, (err) => (err ? reject(err) : resolve()));
  });