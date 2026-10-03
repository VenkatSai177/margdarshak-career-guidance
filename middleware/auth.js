const store = require('../db/database');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_should_be_in_env_in_production';

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

function getAuthUser(req) {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  let token = cookies.margdarshak_session || cookies.user_id;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return null;

  let userId = null;
  let role = 'student';
  // If it looks like a JWT (has 2 dots), verify it
  if (token.split('.').length === 3) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      role = decoded.role || 'student';
    } catch (e) {
      return null;
    }
  } else {
    // Fallback for existing plaintext cookies
    userId = token;
  }

  if (!userId) return null;

  let user = store.findOne('users', u => u.id === userId);
  if (!user) {
    user = { id: userId, role: role, email: 'user@margdarshak.org' };
  }

  const profile = store.findOne('profiles', p => p.userId === user.id) || {};
  return { ...user, onboardingCompleted: profile.completedOnboarding || false, profile };
}

function getDashboardRoute(role) {
  if (role === 'admin') return '/admin/portal';
  if (role === 'mentor') return '/mentor/dashboard';
  return '/student/dashboard';
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Session required.' });
    }
    return res.redirect('/auth/student');
  }
  req.user = user;
  next();
}

function requireRole(role) {
  return function(req, res, next) {
    const user = getAuthUser(req);
    if (!user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      if (role === 'admin') return res.redirect('/auth/admin-login');
      if (role === 'mentor') return res.redirect('/auth/mentor-login');
      return res.redirect('/auth/student');
    }

    if (user.role !== role) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ success: false, error: 'Forbidden. Access restricted to ' + role + '.' });
      }
      return res.redirect(getDashboardRoute(user.role));
    }

    req.user = user;
    next();
  };
}

module.exports = {
  parseCookies,
  getAuthUser,
  getDashboardRoute,
  requireAuth,
  requireRole
};
