const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Not authorized");
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error("Forbidden: insufficient role permissions");
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = { authorize };