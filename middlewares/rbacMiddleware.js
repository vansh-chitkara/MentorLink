const User = require("../models/User");

const authorizeRoles = (...roles) => async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authorizeRoles;
