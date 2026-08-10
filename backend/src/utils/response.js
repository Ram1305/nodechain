function ok(res, data = null, message = 'Success') {
  return res.json({ status: true, message, data });
}

function fail(res, message = 'Failed', data = null, statusCode = 200) {
  return res.status(statusCode).json({ status: false, message, data });
}

/** Agora token response uses root `token` */
function okToken(res, token, message = 'Success') {
  return res.json({ status: true, message, token });
}

module.exports = { ok, fail, okToken };
