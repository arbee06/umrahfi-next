export default function handler(req, res) {
  console.log('Debug endpoint hit');
  console.log('Cookies:', req.cookies);
  console.log('Headers:', req.headers);
  
  res.status(200).json({
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      authorization: req.headers.authorization,
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
}