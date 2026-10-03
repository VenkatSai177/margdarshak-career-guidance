require('dotenv').config({ override: true });
console.log("[Gemini] API key configured:", Boolean(process.env.GEMINI_API_KEY));
const express = require('express');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/api');
const { requireAuth, requireRole, getAuthUser, getDashboardRoute } = require('./middleware/auth');

const app = express();

app.get("/api/system/runtime-info", (req, res) => {
  res.json({
    project: "Margdarshak",
    runtime: "current",
    serverStartedAt: new Date().toISOString(),
    projectRoot: __dirname,
    clientAppVersion: Date.now(),
    serverVersion: "1.0.0"
  });
});

const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// Mount Backend REST API
app.use('/api', apiRoutes);

// Mapping of application routes to Stitch export directories
const routeMap = {
  '/': 'margdarshak_landing_page',
  '/onboarding/personal-details': 'margdarshak_student_personal_details_onboarding',
  '/onboarding/study-details': 'margdarshak_study_details_onboarding',
  '/onboarding/interests-aspirations': 'margdarshak_interests_aspirations_step_3_of_4',
  '/onboarding/profile-review': 'margdarshak_profile_review_complete_step_4_of_4',
  '/student/dashboard': 'margdarshak_student_dashboard',
  '/career-guidance': 'margdarshak_career_guidance',
  '/career-guidance-shell': 'margdarshak_career_guidance_shell_locked',
  '/skill-development': 'margdarshak_skill_development_restored_app_shell',
  '/courses-colleges': 'margdarshak_courses_colleges',
  '/scholarships': 'margdarshak_scholarships',
  '/jobs-internships': 'margdarshak_jobs_internships',
  '/ai-mentor': 'margdarshak_ai_mentor',
  '/community': 'margdarshak_community',
  '/challenges-xp': 'margdarshak_challenges_xp',
  '/resume-builder': 'margdarshak_resume_builder_shell_locked',
  '/resources': 'margdarshak_resources_shell_locked',
  '/login': 'margdarshak_premium_authentication_system',
  '/auth/student': 'margdarshak_premium_authentication_system',
  '/auth/mentor-login': 'margdarshak_mentor_login',
  '/mentor/dashboard': 'margdarshak_mentor_dashboard',
  '/auth/admin-login': 'margdarshak_admin_login',
  '/admin/portal': 'margdarshak_admin_portal',

  // ── Admin Sub-routes ──
  '/admin/students': 'margdarshak_admin_portal',
  '/admin/mentors': 'margdarshak_admin_portal',
  '/admin/content': 'margdarshak_admin_portal',
  '/admin/scholarships': 'margdarshak_admin_portal',
  '/admin/jobs': 'margdarshak_admin_portal',
  '/admin/community': 'margdarshak_admin_portal',
  '/admin/reports': 'margdarshak_admin_portal',
  '/admin/notifications': 'margdarshak_admin_portal',
  '/admin/settings': 'margdarshak_admin_portal',

  // ── Mentor Sub-routes ──
  '/mentor/students': 'margdarshak_mentor_dashboard',
  '/mentor/mentorship': 'margdarshak_mentor_dashboard',
  '/mentor/appointments': 'margdarshak_mentor_dashboard',
  '/mentor/resources': 'margdarshak_mentor_dashboard',
  '/mentor/progress': 'margdarshak_mentor_dashboard',
  '/mentor/community': 'margdarshak_mentor_dashboard',
  '/mentor/messages': 'margdarshak_mentor_dashboard',
  '/mentor/profile': 'margdarshak_mentor_dashboard'
};

// Convenient route aliases
const aliasMap = {
      '/personal-details': '/onboarding/personal-details',
  '/study-details': '/onboarding/study-details',
  '/interests-aspirations': '/onboarding/interests-aspirations',
  '/profile-review': '/onboarding/profile-review',
  '/login': '/auth/student',
  '/mentor': '/mentor/dashboard',
  '/admin': '/admin/portal'
};

// Protected routes configuration for students
const studentProtected = [
  '/student/dashboard',
  '/career-guidance',
  '/career-guidance-shell',
  '/skill-development',
  '/courses-colleges',
  '/scholarships',
  '/jobs-internships',
  '/ai-mentor',
  '/community',
  '/challenges-xp',
  '/resume-builder',
  '/resources'
];

// Injected production client bridge script
const clientInjectedScripts = `
<script data-purpose="stitch-link-connector">
  (function() {
    document.addEventListener('DOMContentLoaded', function() {
      // Map explicit landing page anchors & relative paths
      document.querySelectorAll('a').forEach(function(a) {
        var href = a.getAttribute('href') || '';
        
        if (href === '#login') a.setAttribute('href', '/auth/student');
        if (href === '#get-started' || href === '#start-journey') a.setAttribute('href', '/auth/student');
        if (href === '/admin') a.setAttribute('href', '/admin/portal');
        const path = window.location.pathname;
        let dashRoute = '/student/dashboard';
        if (path.startsWith('/mentor')) dashRoute = '/mentor/dashboard';
        if (path.startsWith('/admin')) dashRoute = '/admin/portal';
        
        if (href === '/home') a.setAttribute('href', dashRoute);
        if (href === '/dashboard') a.setAttribute('href', dashRoute);
        if (href === '/personal-details') a.setAttribute('href', '/onboarding/personal-details');
        if (href === '/study-details') a.setAttribute('href', '/onboarding/study-details');
        if (href === '/interests-aspirations') a.setAttribute('href', '/onboarding/interests-aspirations');
      });
    });
  })();
</script>
<script src="/public/js/table-utils.js?v=1"></script><script src="/public/client-app.js?v=${Date.now()}"></script><script src="/public/phase4-engine.js?v=${Date.now()}"></script>
`;

// Middleware to serve alias routes
app.use(function(req, res, next) {
  if (aliasMap[req.path]) {
    return res.redirect(aliasMap[req.path]);
  }
  next();
});

// Serve static assets from screen directories if requested directly
Object.keys(routeMap).forEach(function(route) {
  var dirName = routeMap[route];
  app.use('/' + dirName, express.static(path.join(__dirname, dirName)));
});

// Serve application routes with strict role-based protection
Object.keys(routeMap).forEach(function(route) {
  var dirName = routeMap[route];

  app.get(route, function(req, res) {
    const user = getAuthUser(req);

    // 1. Unauthenticated checks for protected routes
    if (!user) {
      if (studentProtected.includes(route) || route.startsWith('/onboarding/')) {
        return res.redirect('/auth/student');
      }
      if (route.startsWith('/mentor/')) {
        return res.redirect('/auth/mentor-login');
      }
      if (route.startsWith('/admin/')) {
        return res.redirect('/auth/admin-login');
      }
    } else {
      // 2. Authenticated user accessing auth pages -> redirect only if visiting their own role login page
      if (route.startsWith('/auth/')) {
        if (
          (user.role === 'student' && route === '/auth/student') ||
          (user.role === 'mentor' && route === '/auth/mentor-login') ||
          (user.role === 'admin' && route === '/auth/admin-login')
        ) {
          return res.redirect(getDashboardRoute(user.role));
        }
        // Different role login page visited by authenticated user -> allow rendering for role switching
      }

      // 3. Strict cross-role protection for logged-in users
      if (user.role === 'student') {
        if (route.startsWith('/mentor/') || route.startsWith('/admin/')) {
          return res.redirect('/student/dashboard');
        }
      } else if (user.role === 'mentor') {
        if (studentProtected.includes(route) || route.startsWith('/admin/')) {
          return res.redirect('/mentor/dashboard');
        }
      } else if (user.role === 'admin') {
        if (studentProtected.includes(route) || route.startsWith('/mentor/')) {
          return res.redirect('/admin/portal');
        }
      }
    }

    var filePath = path.join(__dirname, dirName, 'code.html');
    if (fs.existsSync(filePath)) {
      var html = fs.readFileSync(filePath, 'utf8');
      
      // Inject production client script right before </body>
      if (html.indexOf('</body>') !== -1) {
        html = html.replace('</body>', clientInjectedScripts + '\n</body>');
      } else {
        html = html + clientInjectedScripts;
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } else {
      res.status(404).send('Screen not found for route: ' + route);
    }
  });
});

if (require.main === module) {
  app.listen(PORT, function() {
    console.log(' Margdarshak Platform running on http://localhost:' + PORT);
    console.log(' Total 22 Google Stitch export screens connected to Production Backend!');
  });
}

module.exports = app;
