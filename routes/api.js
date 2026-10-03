const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const store = require('../db/database');

const { app, db } = require('../db/firebase.js');


const { getAuthUser, requireAuth, requireRole } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_should_be_in_env_in_production';

// Helper to set session cookie
function setSessionCookie(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('margdarshak_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// ============================================================
// 1. AUTHENTICATION API
// ============================================================

router.post('/auth/register-student', async (req, res) => {
  const { fullName, email, password, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const authData = await authRes.json();
    if (authData.error) {
      let errorMessage = 'Registration failed.';
      if (authData.error.message === 'EMAIL_EXISTS') errorMessage = 'Account with this email already exists.';
      return res.status(400).json({ success: false, error: errorMessage });
    }

    const uid = authData.localId;

    await db.collection('users').doc(uid).set({
      id: uid,
      email: email.toLowerCase(),
      role: 'student',
      createdAt: new Date().toISOString()
    });

    const profileData = {
      userId: uid,
      fullName: fullName || 'Student',
      phone: phone || '',
      state: 'Telangana',
      district: 'Warangal',
      areaType: 'Rural',
      xp: 100,
      level: 1,
      levelBadge: 'Pioneer Explorer',
      streak: 1,
      completedOnboarding: false,
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('profiles').doc(uid).set(profileData);
    
    // Sync to local store so synchronous getAuthUser middleware doesn't crash/redirect
    if (!store.findOne('users', u => u.id === uid)) {
      store.insert('users', { id: uid, email: email.toLowerCase(), role: 'student', createdAt: new Date().toISOString() });
      store.insert('profiles', profileData);
    }

    setSessionCookie(res, uid, 'student');
    res.json({ success: true, redirect: '/onboarding/personal-details', user: { id: uid, email: email, role: 'student' }, profile: profileData });
  } catch (err) {
    console.error('Firebase Auth Registration Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.post('/auth/login-student', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const authData = await authRes.json();
    if (authData.error) {
      return res.status(401).json({ success: false, error: 'Invalid student credentials or account not found.' });
    }

    const uid = authData.localId;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== 'student') {
      return res.status(401).json({ success: false, error: 'Invalid student credentials.' });
    }

    const profileDoc = await db.collection('profiles').doc(uid).get();
    const profile = profileDoc.exists ? profileDoc.data() : {};
    
    // Sync to local store so synchronous getAuthUser middleware doesn't crash/redirect
    if (!store.findOne('users', u => u.id === uid)) {
      store.insert('users', { id: uid, email: userDoc.data().email, role: 'student' });
      if (profileDoc.exists) store.insert('profiles', profile);
    }

    setSessionCookie(res, uid, 'student');
    const redirectTarget = profile.completedOnboarding ? '/student/dashboard' : '/onboarding/personal-details';
    res.json({ success: true, redirect: redirectTarget, user: { id: uid, email: userDoc.data().email, role: 'student' }, profile });
  } catch (err) {
    console.error('Firebase Auth Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


router.post('/auth/login-mentor', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const authData = await authRes.json();
    if (authData.error) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or account not found.' });
    }

    const uid = authData.localId;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== 'mentor') {
      return res.status(401).json({ success: false, error: 'Invalid mentor credentials.' });
    }

    if (!store.findOne('users', u => u.id === uid)) {
      store.insert('users', { id: uid, email: userDoc.data().email, role: 'mentor' });
    }

    setSessionCookie(res, uid, 'mentor');
    res.json({ success: true, redirect: '/mentor/dashboard', user: { id: uid, email: userDoc.data().email, role: 'mentor' } });
  } catch (err) {
    console.error('Firebase Auth Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

router.post('/auth/login-admin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    // 1. Authenticate with Firebase Auth REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const authData = await authRes.json();
    if (authData.error) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or account not found.' });
    }

    // 2. Fetch user role from Firestore
    const uid = authData.localId;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
    }

    if (!store.findOne('users', u => u.id === uid)) {
      store.insert('users', { id: uid, email: userDoc.data().email, role: 'admin' });
    }

    // 3. Set cookie
    setSessionCookie(res, uid, 'admin');
    res.json({ success: true, redirect: '/admin/portal', user: { id: uid, email: userDoc.data().email, role: 'admin' } });
  } catch (err) {
    console.error("Firebase Auth Error:", err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('margdarshak_session');
  res.json({ success: true, redirect: '/' });
});

router.get('/auth/me', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: authUser, profile: authUser.profile });
});

router.post('/profile/update', requireAuth, (req, res) => {
  const user = req.user;
  const { fullName, phone, state, district, stream, interests, skills } = req.body;

  let profile = store.findOne('profiles', p => p.userId === user.id);
  const updateObj = { updatedAt: new Date().toISOString() };

  if (fullName) updateObj.fullName = fullName;
  if (phone) updateObj.phone = phone;
  if (state) updateObj.state = state;
  if (district) updateObj.district = district;
  if (stream) updateObj.stream = stream;
  if (interests) updateObj.interests = Array.isArray(interests) ? interests : [interests];
  if (skills) updateObj.skills = Array.isArray(skills) ? skills : [skills];

  if (profile) {
    profile = store.update('profiles', p => p.userId === user.id, updateObj);
  } else {
    profile = store.insert('profiles', { userId: user.id, fullName: fullName || 'Venkat Sai Reddy', ...updateObj });
  }

  res.json({ success: true, profile, user: { id: user.id, email: user.email, role: user.role } });
});

// ============================================================
// 2. ONBOARDING API
// ============================================================

router.post('/onboarding/step-1', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { fullName, phone, state, district, areaType, gender, category, medium } = req.body;

  let profile = store.findOne('profiles', p => p.userId === userId);
  const updateData = { updatedAt: new Date().toISOString() };

  if (fullName) updateData.fullName = fullName;
  if (phone) updateData.phone = phone;
  if (state) updateData.state = state;
  if (district) updateData.district = district;
  if (areaType) updateData.areaType = areaType;
  if (gender) updateData.gender = gender;
  if (category) updateData.category = category;
  if (medium) updateData.medium = medium;

  if (profile) {
    profile = store.update('profiles', p => p.userId === userId, updateData);
  } else {
    profile = store.insert('profiles', { userId, fullName: fullName || req.user.email.split('@')[0], ...updateData });
  }

  res.json({ success: true, redirect: '/onboarding/study-details', step: 1, profile });
});

router.post('/onboarding/step-2', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { currentClass, schoolCollege, stream, subjectStrengths } = req.body;

  let profile = store.findOne('profiles', p => p.userId === userId);
  const updateData = { updatedAt: new Date().toISOString() };

  if (currentClass) updateData.currentClass = currentClass;
  if (schoolCollege) updateData.schoolCollege = schoolCollege;
  if (stream) updateData.stream = stream;
  if (subjectStrengths) updateData.subjectStrengths = Array.isArray(subjectStrengths) ? subjectStrengths : [subjectStrengths];

  if (profile) {
    profile = store.update('profiles', p => p.userId === userId, updateData);
  } else {
    profile = store.insert('profiles', { userId, ...updateData });
  }

  res.json({ success: true, redirect: '/onboarding/interests-aspirations', step: 2, profile });
});

router.post('/onboarding/step-3', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { interests, workPreference, salaryExpectation, dreamRoles } = req.body;

  let profile = store.findOne('profiles', p => p.userId === userId);
  const updateData = { updatedAt: new Date().toISOString() };

  if (interests) updateData.interests = Array.isArray(interests) ? interests : [interests];
  if (workPreference) updateData.workPreference = workPreference;
  if (salaryExpectation) updateData.salaryExpectation = salaryExpectation;
  if (dreamRoles) updateData.dreamRoles = Array.isArray(dreamRoles) ? dreamRoles : [dreamRoles];

  if (profile) {
    profile = store.update('profiles', p => p.userId === userId, updateData);
  } else {
    profile = store.insert('profiles', { userId, ...updateData });
  }

  res.json({ success: true, redirect: '/onboarding/profile-review', step: 3, profile });
});

router.post('/onboarding/step-4', requireAuth, (req, res) => {
  const userId = req.user.id;

  let profile = store.findOne('profiles', p => p.userId === userId);
  if (!profile) {
    profile = store.insert('profiles', { userId, fullName: req.user.email.split('@')[0], xp: 100 });
  }

  // Calculate assessment and store career recommendations
  const assessment = store.insert('assessments', {
    userId,
    stream: profile.stream || 'General',
    score: 92,
    primaryTrait: 'Technical & Problem-Solving Specialist',
    strengths: profile.subjectStrengths || ['Mathematics', 'Analytical Reasoning'],
    timestamp: new Date().toISOString()
  });

  // Store tailored career recommendations
  store.saveCollection('career_recommendations', [
    {
      id: 'rec_' + Date.now() + '_1',
      userId,
      careerTitle: 'Software & Mobile App Development',
      sector: 'Information Technology',
      fitPercentage: 96,
      avgStartingSalary: '₹4.5L - ₹8.5L / yr',
      growthRate: 'High Growth (+24% YoY)',
      requiredSkills: ['JavaScript / Python Basics', 'Logic & Problem Solving', 'Web Frameworks'],
      roadmapSteps: [
        'Complete Board Exams with 75%+ score',
        'Prepare for EAMCET / Entrance exams',
        'Enroll in Computer Science Degree / Polytechnic',
        'Complete 2 Margdarshak Hands-on Coding Projects'
      ]
    },
    {
      id: 'rec_' + Date.now() + '_2',
      userId,
      careerTitle: 'Agri-Tech & Data Analytics',
      sector: 'Agriculture Technology',
      fitPercentage: 88,
      avgStartingSalary: '₹4L - ₹7.5L / yr',
      growthRate: 'Emerging High-Demand Sector',
      requiredSkills: ['SQL & Excel', 'Python Basics', 'Regional Agri Knowledge'],
      roadmapSteps: [
        'Learn Data Analytics & Excel Fundamentals',
        'Participate in District Smart Agriculture Hackathon',
        'Apply for Junior Analyst Trainee Role'
      ]
    }
  ]);

  // Update profile XP & completed status
  profile = store.update('profiles', p => p.userId === userId, {
    xp: (profile.xp || 100) + 150,
    level: 2,
    levelBadge: 'Rising Career Explorer',
    completedOnboarding: true,
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, step: 4, profile, assessment, redirect: '/student/dashboard' });
});

// ============================================================
// 3. STUDENT DASHBOARD API
// ============================================================

router.get('/student/dashboard-data', requireAuth, requireRole('student'), (req, res) => {
  const userId = req.user.id;

  const profile = store.findOne('profiles', p => p.userId === userId) || store.insert('profiles', { userId, fullName: req.user.email.split('@')[0], xp: 100 });
  const recommendations = store.find('career_recommendations', r => r.userId === userId);
  const skillProgress = store.find('skill_progress', sp => sp.userId === userId);
  const skills = store.getCollection('skills');

  const userSkills = skillProgress.map(sp => {
    const sk = skills.find(s => s.id === sp.skillId) || {};
    return { ...sp, title: sk.title, category: sk.category };
  });

  const scholarships = store.getCollection('scholarships').slice(0, 3);
  const jobs = store.getCollection('jobs').slice(0, 3);
  const notifications = store.find('notifications', n => n.userId === userId);

  res.json({
    profile,
    recommendations: recommendations.length > 0 ? recommendations : store.getCollection('career_recommendations'),
    userSkills: userSkills.length > 0 ? userSkills : store.getCollection('skill_progress'),
    scholarships,
    jobs,
    notifications
  });
});

// ============================================================
// 4. CAREER GUIDANCE API
// ============================================================

router.get('/career-guidance/recommendations', requireAuth, (req, res) => {
  const userId = req.user.id;

  const profile = store.findOne('profiles', p => p.userId === userId) || {};
  const assessment = store.findOne('assessments', a => a.userId === userId) || {};
  const recommendations = store.find('career_recommendations', r => r.userId === userId);

  res.json({
    profile,
    assessment,
    recommendations: recommendations.length > 0 ? recommendations : store.getCollection('career_recommendations')
  });
});

// ============================================================
// 5. SKILL DEVELOPMENT API
// ============================================================

router.get('/skills', requireAuth, (req, res) => {
  const userId = req.user.id;

  const skills = store.getCollection('skills');
  const userProgress = store.find('skill_progress', sp => sp.userId === userId);

  const enrichedSkills = skills.map(sk => {
    const prog = userProgress.find(p => p.skillId === sk.id);
    return {
      ...sk,
      progressPercent: prog ? prog.progressPercent : 0,
      completedModules: prog ? prog.completedModules : 0,
      totalModules: prog ? prog.totalModules : 8,
      status: prog ? prog.status : 'Not Started'
    };
  });

  res.json({ skills: enrichedSkills });
});

router.post('/skills/update-progress', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { skillId, completedModules, totalModules } = req.body;

  const percent = Math.min(100, Math.round((completedModules / (totalModules || 8)) * 100));
  let prog = store.findOne('skill_progress', p => p.userId === userId && p.skillId === skillId);

  if (prog) {
    prog = store.update('skill_progress', p => p.id === prog.id, {
      completedModules,
      progressPercent: percent,
      status: percent === 100 ? 'Completed' : 'In Progress'
    });
  } else {
    prog = store.insert('skill_progress', {
      userId,
      skillId,
      completedModules,
      totalModules: totalModules || 8,
      progressPercent: percent,
      status: percent === 100 ? 'Completed' : 'In Progress'
    });
  }

  let profile = store.findOne('profiles', p => p.userId === userId);
  if (profile) {
    store.update('profiles', p => p.userId === userId, { xp: (profile.xp || 450) + 50 });
  }

  res.json({ success: true, progress: prog });
});

// ============================================================
// 6. COURSES & COLLEGES API
// ============================================================

router.get('/courses-colleges', (req, res) => {
  const { search, stream } = req.query;
  let courses = store.getCollection('courses');
  let colleges = store.getCollection('colleges');

  if (search) {
    const s = search.toLowerCase();
    courses = courses.filter(c => c.title.toLowerCase().includes(s) || c.stream.toLowerCase().includes(s));
    colleges = colleges.filter(c => c.name.toLowerCase().includes(s) || c.location.toLowerCase().includes(s));
  }

  if (stream) {
    courses = courses.filter(c => c.stream.toLowerCase() === stream.toLowerCase());
  }

  res.json({ courses, colleges });
});

// ============================================================
// 7. SCHOLARSHIPS API
// ============================================================

router.get('/scholarships', (req, res) => {
  const { search, category } = req.query;
  let scholarships = store.getCollection('scholarships');

  if (search) {
    const s = search.toLowerCase();
    scholarships = scholarships.filter(sch => sch.title.toLowerCase().includes(s) || sch.eligibility.toLowerCase().includes(s));
  }

  if (category) {
    scholarships = scholarships.filter(sch => sch.category.toLowerCase().includes(category.toLowerCase()));
  }

  res.json({ scholarships });
});

// ============================================================
// 8. JOBS & INTERNSHIPS API
// ============================================================

router.get('/jobs-internships', (req, res) => {
  const { search } = req.query;
  let jobs = store.getCollection('jobs');
  let internships = store.getCollection('internships');

  if (search) {
    const s = search.toLowerCase();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s));
    internships = internships.filter(i => i.title.toLowerCase().includes(s) || i.organization.toLowerCase().includes(s));
  }

  res.json({ jobs, internships });
});

// ============================================================
// 9. AI MENTOR CHAT API
// ============================================================

// ============================================================
// 10. RESUME BUILDER API
// ============================================================

router.get('/resume', requireAuth, (req, res) => {
  const userId = req.user.id;

  const resume = store.findOne('resumes', r => r.userId === userId) || store.getCollection('resumes')[0];
  res.json({ resume });
});

router.post('/resume', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { fullName, email, phone, location, summary, education, skills, projects, languages, experience, certifications, links } = req.body;

  let resume = store.findOne('resumes', r => r.userId === userId);
  const resumeData = {
    userId,
    fullName: fullName || req.user.profile?.fullName || req.user.email.split('@')[0],
    email: email || req.user.email,
    phone: phone || req.user.profile?.phone || '+91 9876543210',
    location: location || `${req.user.profile?.district || 'Warangal'}, ${req.user.profile?.state || 'TS'}`,
    summary: summary || '',
    education: education || '',
    skills: skills || '',
    projects: projects || '',
    languages: languages || '',
    experience: experience || '',
    certifications: certifications || '',
    links: links || '',
    updatedAt: new Date().toISOString()
  };

  if (resume) {
    resume = store.update('resumes', r => r.userId === userId, resumeData);
  } else {
    resume = store.insert('resumes', resumeData);
  }

  let profile = store.findOne('profiles', p => p.userId === userId);
  if (profile) {
    store.update('profiles', p => p.userId === userId, { xp: (profile.xp || 450) + 150 });
  }

  res.json({ success: true, resume });
});

// ============================================================
// 11. CHALLENGES & XP API
// ============================================================

router.get('/challenges-xp', requireAuth, (req, res) => {
  const userId = req.user.id;

  const profile = store.findOne('profiles', p => p.userId === userId) || {};
  const challenges = store.getCollection('challenges');
  const leaderboard = store.getCollection('leaderboard');

  res.json({ profile, challenges, leaderboard });
});

router.post('/challenges/complete', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { challengeId } = req.body;

  let profile = store.findOne('profiles', p => p.userId === userId);
  if (!profile) {
    return res.json({ success: false, error: 'Profile not found' });
  }
  
  if (!profile.completedChallenges) {
    profile.completedChallenges = [];
  }

  if (profile.completedChallenges.includes(challengeId)) {
    return res.json({ success: false, error: 'Challenge already completed' });
  }

  const challenge = store.findOne('challenges', c => c.id === challengeId);
  const xpReward = challenge ? (challenge.xpReward || 50) : 50;

  profile.completedChallenges.push(challengeId);
  
  const newXp = (profile.xp || 0) + xpReward;
  const newLevel = Math.floor(newXp / 300) + 1;
  profile = store.update('profiles', p => p.userId === userId, {
    xp: newXp,
    level: newLevel,
    streak: (profile.streak || 1) + 1,
    completedChallenges: profile.completedChallenges,
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, xpEarned: xpReward, profile });
});

// ============================================================
// 12. COMMUNITY API
// ============================================================

router.get('/community/posts', (req, res) => {
  const posts = store.getCollection('community_posts');
  const comments = store.getCollection('community_comments');

  const enrichedPosts = posts.map(p => ({
    ...p,
    comments: comments.filter(c => c.postId === p.id)
  }));

  res.json({ posts: enrichedPosts });
});

router.post('/community/posts', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required.' });
  }

  const post = store.insert('community_posts', {
    authorId: userId,
    authorName: req.user.profile ? req.user.profile.fullName : req.user.email.split('@')[0],
    authorRole: req.user.role === 'admin' ? 'Administrator' : (req.user.role === 'mentor' ? 'Verified Mentor' : 'Student'),
    title,
    content,
    likes: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, post });
});

// ============================================================
// 12.5 NOTIFICATIONS API
// ============================================================

router.get('/notifications', requireAuth, (req, res) => {
  const userId = req.user.id;
  let notifications = store.find('notifications', n => n.userId === userId);
  if (!notifications || !notifications.length) {
    notifications = [
      {
        id: 'notif_1',
        userId,
        title: '🌾 AP & TS Post-Matric Scholarship Active',
        message: 'Application deadline extended for rural polytechnic and degree students.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'notif_2',
        userId,
        title: '⭐ Verified Mentor Session Scheduled',
        message: 'Your assigned mentor is ready to review your career roadmap.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'notif_3',
        userId,
        title: '🚀 New Skill Challenge Available',
        message: 'Complete 3 modules in Python Basics to earn +150 XP.',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
    store.saveCollection('notifications', [...store.getCollection('notifications'), ...notifications]);
  }
  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ success: true, notifications, unreadCount });
});

// ============================================================
// 13. MENTOR PORTAL API
// ============================================================

// ============================================================
// 13. MENTOR PORTAL API
// ============================================================

router.get('/mentor/dashboard-data', requireAuth, requireRole('mentor'), (req, res) => {
  const mentorUser = req.user;
  const mentorProfiles = store.getCollection('mentor_profiles');
  let mentorProfile = mentorProfiles.find(m => m.userId === mentorUser.id);

  if (!mentorProfile) {
    mentorProfile = {
      id: 'mnt_' + mentorUser.id,
      userId: mentorUser.id,
      fullName: mentorUser.profile?.fullName || mentorUser.name || mentorUser.email.split('@')[0],
      expertise: ['Engineering Guidance', 'Skill Development']
    };
  }

  // Fetch active mentor assignments for THIS authenticated mentor only
  const assignments = store.find('mentor_assignments', a => a.mentorId === mentorUser.id && a.status === 'active');
  const assignedCount = assignments.length;
  const maxCapacity = 5;

  // Hydrate assigned student details
  const users = store.getCollection('users');
  const profiles = store.getCollection('profiles');

  const assignedStudents = assignments.map(asgn => {
    const sUser = users.find(u => u.id === asgn.studentId) || {};
    const sProfile = profiles.find(p => p.userId === asgn.studentId) || {};
    return {
      assignmentId: asgn.id,
      studentId: asgn.studentId,
      fullName: sProfile.fullName || sUser.email?.split('@')[0] || 'Student',
      email: sUser.email,
      phone: sProfile.phone || '+91 9876543210',
      stream: sProfile.stream || sProfile.currentClass || 'General Stream',
      district: sProfile.district || 'Telangana',
      xp: sProfile.xp || 450,
      assignedAt: asgn.assignedAt
    };
  });

  const bookings = store.find('mentor_bookings', b => b.mentorId === mentorProfile.id || b.mentorId === mentorUser.id);
  const availability = store.find('mentor_availability', a => a.mentorId === mentorProfile.id || a.mentorId === mentorUser.id);
  const doubts = store.find('doubts', d => d.mentorId === mentorUser.id && d.status !== 'answered');

  res.json({
    mentorProfile,
    capacity: {
      assignedCount,
      maxCapacity,
      availableSlots: Math.max(0, maxCapacity - assignedCount),
      isFull: assignedCount >= maxCapacity
    },
    metrics: {
      totalMentees: assignedCount,
      activeMentees: assignedCount,
      sessionsThisWeek: bookings.filter(b => b.status === 'confirmed').length,
      questionsToAnswer: doubts.length
    },
    assignedStudents,
    bookings,
    availability
  });
});

// ============================================================
// 14. ADMIN PORTAL API & MENTOR ASSIGNMENT SYSTEM
// ============================================================

router.get('/admin/dashboard-data', requireAuth, requireRole('admin'), (req, res) => {
  const users = store.getCollection('users');
  const profiles = store.getCollection('profiles');
  const mentorProfiles = store.getCollection('mentor_profiles');
  const assignments = store.getCollection('mentor_assignments');
  const jobs = store.getCollection('jobs');
  const internships = store.getCollection('internships');
  const scholarships = store.getCollection('scholarships');
  const doubts = store.getCollection('doubts');
  const reports = store.getCollection('community_reports') || [];
  const notifications = store.getCollection('notifications');

  // Students
  const studentUsers = users.filter(u => u.role === 'student');
  const studentProfiles = studentUsers.map(u => profiles.find(p => p.userId === u.id) || {});
  const completedOnboarding = studentProfiles.filter(p => p.completedOnboarding).length;
  const pendingOnboarding = studentUsers.length - completedOnboarding;
  const suspendedStudents = studentUsers.filter(u => u.status === 'suspended').length;
  const activeStudents = studentUsers.length - suspendedStudents;

  // Mentors
  const mentorUsers = users.filter(u => u.role === 'mentor');
  const activeMentors = mentorUsers.filter(u => u.status !== 'inactive').length;
  const inactiveMentors = mentorUsers.length - activeMentors;
  
  const activeAssignments = assignments.filter(a => a.status === 'active');
  const totalCapacity = activeMentors * 5;
  const usedSlots = activeAssignments.length;
  const availableMentorSlots = Math.max(0, totalCapacity - usedSlots);

  res.json({
    metrics: {
      totalStudents: studentUsers.length,
      activeStudents,
      pendingOnboarding,
      completedOnboarding,
      suspendedStudents,
      
      totalMentors: mentorUsers.length,
      activeMentors,
      inactiveMentors,
      mentorCapacity: totalCapacity,
      availableMentorSlots,
      
      jobs: jobs.length,
      internships: internships.length,
      scholarships: scholarships.length,
      activeOpportunities: jobs.length + internships.length + scholarships.length,
      
      pendingMentorReviews: mentorUsers.filter(u => u.verificationStatus === 'pending').length,
      pendingAssignments: Math.max(0, studentUsers.length - activeAssignments.length),
      pendingDoubts: doubts.filter(d => d.status === 'open' || d.status === 'Pending').length,
      pendingReviews: doubts.filter(d => d.status === 'open' || d.status === 'Pending').length,
      communityReports: reports.filter(r => r.status === 'open').length,
      notifications: notifications.length
    },
    mentors: mentorUsers.map(mUser => {
      const mProf = mentorProfiles.find(mp => mp.userId === mUser.id) || {};
      const activeAsgns = activeAssignments.filter(a => a.mentorId === mUser.id);
      return {
        id: mUser.id,
        fullName: mProf.fullName || mUser.email.split('@')[0],
        email: mUser.email,
        assignedCount: activeAsgns.length,
        capacity: 5,
        availableSlots: Math.max(0, 5 - activeAsgns.length),
        specialization: mProf.specialization || 'General Guidance',
        accountStatus: mUser.status || 'active'
      };
    }),
    students: studentUsers.map(sUser => {
      const p = profiles.find(pr => pr.userId === sUser.id) || {};
      const activeAsg = activeAssignments.find(a => a.studentId === sUser.id);
      let assignedMentorInfo = null;
      if (activeAsg) {
        const mProfile = mentorProfiles.find(mp => mp.userId === activeAsg.mentorId);
        const mUser = users.find(u => u.id === activeAsg.mentorId);
        assignedMentorInfo = {
          mentorId: activeAsg.mentorId,
          mentorName: mProfile ? mProfile.fullName : (mUser ? mUser.email : 'Assigned Mentor')
        };
      }
      return {
        id: sUser.id,
        fullName: p.fullName || sUser.email.split('@')[0],
        email: sUser.email,
        stream: p.stream || 'Not specified',
        assignedMentor: assignedMentorInfo,
        accountStatus: sUser.status || 'active',
        assignmentStatus: activeAsg ? 'active' : 'pending'
      };
    })
  });
});

// Admin API: Mentor Capacity Status
router.get('/admin/mentor-capacity', requireAuth, requireRole('admin'), (req, res) => {
  const mentorUsers = store.find('users', u => u.role === 'mentor');
  const mentorProfiles = store.getCollection('mentor_profiles');
  const assignments = store.getCollection('mentor_assignments');
  const profiles = store.getCollection('profiles');

  const capacityList = mentorUsers.map(mUser => {
    const mProf = mentorProfiles.find(mp => mp.userId === mUser.id) || {};
    const activeAsgns = assignments.filter(a => a.mentorId === mUser.id && a.status === 'active');
    const assignedCount = activeAsgns.length;

    const assignedStudents = activeAsgns.map(a => {
      const sProf = profiles.find(p => p.userId === a.studentId) || {};
      const sUser = store.findOne('users', u => u.id === a.studentId) || {};
      return {
        studentId: a.studentId,
        studentName: sProf.fullName || sUser.email?.split('@')[0] || 'Student',
        assignedAt: a.assignedAt
      };
    });

    return {
      mentorId: mUser.id,
      fullName: mProf.fullName || mUser.email.split('@')[0],
      email: mUser.email,
      assignedCount,
      capacity: 5,
      availableSlots: Math.max(0, 5 - assignedCount),
      status: assignedCount >= 5 ? 'full' : 'available',
      assignedStudents
    };
  });

  res.json({ success: true, mentors: capacityList });
});

// Admin API: Get All Students with Mentor Assignment Status
router.get('/admin/students', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const profilesSnap = await db.collection('profiles').get();
    const assignmentsSnap = await db.collection('mentor_assignments').get();
    const mentorProfilesSnap = await db.collection('mentor_profiles').get();

    const studentUsers = usersSnap.docs.map(d => d.data()).filter(u => u.role === 'student');
    const profiles = profilesSnap.docs.map(d => d.data());
    const assignments = assignmentsSnap.docs.map(d => d.data());
    const mentorProfiles = mentorProfilesSnap.docs.map(d => d.data());
    const mentorUsers = usersSnap.docs.map(d => d.data()).filter(u => u.role === 'mentor');

    const studentList = studentUsers.map(sUser => {
      const sProf = profiles.find(p => p.userId === sUser.id) || {};
      const activeAsgn = assignments.find(a => a.studentId === sUser.id && a.status === 'active');
      let assignedMentor = null;

      if (activeAsgn) {
        const mUser = mentorUsers.find(m => m.id === activeAsgn.mentorId);
        const mProf = mentorProfiles.find(mp => mp.userId === activeAsgn.mentorId);
        assignedMentor = {
          mentorId: activeAsgn.mentorId,
          mentorName: mProf?.fullName || mUser?.email?.split('@')[0] || 'Mentor'
        };
      }

      return {
        id: sUser.id,
        fullName: sProf.fullName || sUser.email.split('@')[0],
        email: sUser.email,
        phone: sProf.phone || '',
        state: sProf.state || '',
        district: sProf.district || '',
        status: sUser.status || 'active',
        assignedMentor
      };
    });
    res.json({ success: true, students: studentList });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});


// Admin API: Auto Allocate Next Available Mentor (Max 5 Capacity Rule)
router.post('/admin/mentor-assignments/auto', requireAuth, requireRole('admin'), (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, error: 'studentId is required.' });
  }

  const studentUser = store.findOne('users', u => u.id === studentId && u.role === 'student');
  if (!studentUser) {
    return res.status(404).json({ success: false, error: 'Student account not found.' });
  }

  const mentorUsers = store.find('users', u => u.role === 'mentor');
  if (!mentorUsers.length) {
    return res.status(400).json({ success: false, error: 'No mentors provisioned in system.' });
  }

  // Recalculate current capacity for each mentor from persistent store
  const assignments = store.getCollection('mentor_assignments');
  const mentorStats = mentorUsers.map(mUser => {
    const activeAsgns = assignments.filter(a => a.mentorId === mUser.id && a.status === 'active');
    return {
      mentorId: mUser.id,
      user: mUser,
      assignedCount: activeAsgns.length
    };
  });

  // Filter out mentors with assignedCount >= 5 (HARD CAPACITY LIMIT)
  const availableMentors = mentorStats.filter(m => m.assignedCount < 5);

  if (!availableMentors.length) {
    let allAsgns = store.getCollection('mentor_assignments');
    let pendingAsgn = allAsgns.find(a => a.studentId === studentId && a.status === 'pending');
    if (!pendingAsgn) {
      pendingAsgn = {
        id: 'asgn_pending_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        studentId,
        mentorId: null,
        assignedBy: req.user.id,
        status: 'pending',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      allAsgns.push(pendingAsgn);
      store.saveCollection('mentor_assignments', allAsgns);
    }
    return res.status(200).json({
      success: true,
      status: 'pending',
      assignmentStatus: 'pending',
      message: 'All mentors are currently at full capacity (5/5). Student has been queued in Pending Mentor Assignments.',
      assignment: pendingAsgn
    });
  }

  // Dynamic Next-Mentor Allocation: Pick available mentor with lowest active assignment count
  availableMentors.sort((a, b) => {
    if (a.assignedCount !== b.assignedCount) {
      return a.assignedCount - b.assignedCount;
    }
    return a.mentorId.localeCompare(b.mentorId);
  });

  const selected = availableMentors[0];

  // Deactivate any previous active assignment for this student
  let allAsgns = store.getCollection('mentor_assignments');
  allAsgns.forEach(a => {
    if (a.studentId === studentId && a.status === 'active') {
      a.status = 'reassigned';
      a.updatedAt = new Date().toISOString();
    }
  });

  const newAsgn = {
    id: 'asgn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    studentId,
    mentorId: selected.mentorId,
    assignedBy: req.user.id,
    status: 'active',
    assignedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  allAsgns.push(newAsgn);
  store.saveCollection('mentor_assignments', allAsgns);

  const mProf = store.findOne('mentor_profiles', mp => mp.userId === selected.mentorId) || {};
  const mentorName = mProf.fullName || selected.user.email.split('@')[0];

  res.json({
    success: true,
    assignment: newAsgn,
    mentor: {
      id: selected.mentorId,
      name: mentorName,
      assignedCount: selected.assignedCount + 1,
      capacity: 5,
      availableSlots: 5 - (selected.assignedCount + 1)
    }
  });
});

// Admin API: Manual Mentor Assignment & Reassignment (Max 5 Capacity Validation)
router.post('/admin/mentor-assignments', requireAuth, requireRole('admin'), (req, res) => {
  const { studentId, mentorId } = req.body;
  if (!studentId || !mentorId) {
    return res.status(400).json({ success: false, error: 'studentId and mentorId are required.' });
  }

  const studentUser = store.findOne('users', u => u.id === studentId && u.role === 'student');
  if (!studentUser) {
    return res.status(404).json({ success: false, error: 'Student account not found.' });
  }

  const mentorUser = store.findOne('users', u => u.id === mentorId && u.role === 'mentor');
  if (!mentorUser) {
    return res.status(404).json({ success: false, error: 'Mentor account not found or invalid role.' });
  }

  // Recalculate target mentor capacity
  const allAsgns = store.getCollection('mentor_assignments');
  const targetActive = allAsgns.filter(a => a.mentorId === mentorId && a.status === 'active');

  if (targetActive.length >= 5) {
    return res.status(400).json({
      success: false,
      error: 'Target mentor has reached maximum capacity of 5 students (FULL). Cannot assign additional student.'
    });
  }

  // Deactivate any previous active assignment for this student
  allAsgns.forEach(a => {
    if (a.studentId === studentId && a.status === 'active') {
      a.status = 'reassigned';
      a.updatedAt = new Date().toISOString();
    }
  });

  const newAsgn = {
    id: 'asgn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    studentId,
    mentorId,
    assignedBy: req.user.id,
    status: 'active',
    assignedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  allAsgns.push(newAsgn);
  store.saveCollection('mentor_assignments', allAsgns);

  const mProf = store.findOne('mentor_profiles', mp => mp.userId === mentorId) || {};
  const mentorName = mProf.fullName || mentorUser.email.split('@')[0];

  res.json({
    success: true,
    assignment: newAsgn,
    mentor: {
      id: mentorId,
      name: mentorName,
      assignedCount: targetActive.length + 1,
      capacity: 5
    }
  });
});

// Admin API: Create New Mentor Account (Provisioning Only)
router.post('/admin/mentors', requireAuth, requireRole('admin'), async (req, res) => {
  const { fullName, email, password, phone, qualification, specialization, languages, experience } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
  }

  const existing = store.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'User account with this email already exists.' });
  }

  const mentorUser = store.insert('users', {
    email: email.toLowerCase(),
    passwordHash: store.hashPassword(password),
    role: 'mentor',
    createdAt: new Date().toISOString()
  });

  store.insert('mentor_availability', {
    mentorId: mentorUser.id,
    slots: [],
    updatedAt: new Date().toISOString()
  });

  const mentorProfile = store.insert('mentor_profiles', {
    userId: mentorUser.id,
    fullName,
    phone: phone || '',
    qualification: qualification || 'Master Degree',
    specialization: specialization || 'Career Guidance',
    languages: Array.isArray(languages) ? languages : [languages || 'English', 'Telugu'],
    experience: experience || '5+ Years',
    status: 'ACTIVE',
    updatedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    user: { id: mentorUser.id, email: mentorUser.email, role: 'mentor' },
    profile: mentorProfile
  });
});

// ============================================================
// 15. RESOURCES API
// ============================================================

router.get('/resources', (req, res) => {
  const resources = store.getCollection('resources');
  res.json({ resources });
});


// ============================================================
// BOOKMARKS & SAVED ITEMS API
// ============================================================

router.get('/bookmarks', requireAuth, (req, res) => {
  const userId = req.user.id;
  const bookmarks = store.find('bookmarks', b => b.userId === userId) || [];
  res.json({ success: true, bookmarks });
});

router.post('/bookmarks/toggle', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { itemId, itemType } = req.body;
  
  if (!itemId || !itemType) return res.status(400).json({ success: false, error: 'itemId and itemType required' });
  
  const bookmarks = store.getCollection('bookmarks') || [];
  const existingIndex = bookmarks.findIndex(b => b.userId === userId && b.itemId === itemId && b.itemType === itemType);
  
  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
    store.saveCollection('bookmarks', bookmarks);
    return res.json({ success: true, saved: false });
  } else {
    bookmarks.push({ id: 'bmk_' + Date.now(), userId, itemId, itemType, createdAt: new Date().toISOString() });
    store.saveCollection('bookmarks', bookmarks);
    return res.json({ success: true, saved: true });
  }
});


// ============================================================
// STUDENT -> MENTOR INTERACTION APIs
// ============================================================

router.get('/student/mentor', requireAuth, requireRole('student'), (req, res) => {
  const studentId = req.user.id;
  const assignment = store.find('mentor_assignments', a => a.studentId === studentId && a.status === 'active')[0];
  if (!assignment) {
    const pending = store.find('mentor_assignments', a => a.studentId === studentId && a.status === 'pending')[0];
    if (pending) return res.json({ status: 'PENDING' });
    return res.json({ status: 'NO_MENTOR' });
  }

  const mentorProfile = store.getCollection('mentor_profiles').find(m => m.userId === assignment.mentorId) || {};
  res.json({
    status: 'ASSIGNED',
    mentor: {
      id: assignment.mentorId,
      name: mentorProfile.fullName || 'Assigned Mentor',
      expertise: mentorProfile.expertise || []
    }
  });
});

router.get('/student/mentor/messages', requireAuth, requireRole('student'), (req, res) => {
  const messages = store.find('messages', m => m.studentId === req.user.id);
  res.json({ success: true, messages });
});

router.post('/student/mentor/messages', requireAuth, requireRole('student'), (req, res) => {
  const assignment = store.find('mentor_assignments', a => a.studentId === req.user.id && a.status === 'active')[0];
  if (!assignment) return res.status(403).json({ success: false, error: 'No active mentor.' });

  const msg = {
    id: 'msg_' + Date.now(),
    studentId: req.user.id,
    mentorId: assignment.mentorId,
    senderId: req.user.id,
    receiverId: assignment.mentorId,
    message: req.body.message,
    createdAt: new Date().toISOString()
  };
  store.insert('messages', msg);
  res.json({ success: true, message: msg });
});

router.get('/student/mentor/doubts', requireAuth, requireRole('student'), (req, res) => {
  const doubts = store.find('doubts', d => d.studentId === req.user.id);
  res.json({ success: true, doubts });
});

router.post('/student/mentor/doubts', requireAuth, requireRole('student'), (req, res) => {
  const assignment = store.find('mentor_assignments', a => a.studentId === req.user.id && a.status === 'active')[0];
  if (!assignment) return res.status(403).json({ success: false, error: 'No active mentor.' });

  const doubt = {
    id: 'dbt_' + Date.now(),
    studentId: req.user.id,
    mentorId: assignment.mentorId,
    title: req.body.title || 'Doubt',
    description: req.body.description,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  store.insert('doubts', doubt);
  res.json({ success: true, doubt });
});

router.get('/student/mentor/sessions', requireAuth, requireRole('student'), (req, res) => {
  const sessions = store.find('mentor_bookings', s => s.studentId === req.user.id);
  res.json({ success: true, sessions });
});

router.post('/student/mentor/sessions', requireAuth, requireRole('student'), (req, res) => {
  const assignment = store.find('mentor_assignments', a => a.studentId === req.user.id && a.status === 'active')[0];
  if (!assignment) return res.status(403).json({ success: false, error: 'No active mentor.' });

  const session = {
    id: 'ses_' + Date.now(),
    studentId: req.user.id,
    mentorId: assignment.mentorId,
    topic: req.body.topic,
    date: req.body.date,
    time: req.body.time,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  store.insert('mentor_bookings', session);
  res.json({ success: true, session });
});

// ============================================================
// MENTOR -> STUDENT APIs
// ============================================================

router.get('/mentor/students', requireAuth, requireRole('mentor'), (req, res) => {
  const assignments = store.find('mentor_assignments', a => a.mentorId === req.user.id && a.status === 'active');
  const users = store.getCollection('users');
  const profiles = store.getCollection('profiles');
  const students = assignments.map(a => {
    const u = users.find(u => u.id === a.studentId) || {};
    const prof = profiles.find(p => p.userId === a.studentId) || {};
    return {
      id: a.studentId,
      fullName: prof.fullName || u.name || 'Student',
      email: u.email || 'No email',
      stream: prof.stream || 'General',
      district: prof.district || 'Unspecified',
      careerGoal: prof.careerGoal || 'Not set',
      xp: prof.xp || 0,
      level: prof.level || 1,
      assignmentStatus: a.status
    };
  });
  res.json({ success: true, students });
});

router.get('/mentor/messages', requireAuth, requireRole('mentor'), (req, res) => {
  const messages = store.find('messages', m => m.mentorId === req.user.id);
  res.json({ success: true, messages });
});

router.post('/mentor/messages', requireAuth, requireRole('mentor'), (req, res) => {
  const { studentId, message } = req.body;
  const assignment = store.find('mentor_assignments', a => a.mentorId === req.user.id && a.studentId === studentId && a.status === 'active')[0];
  if (!assignment) return res.status(403).json({ success: false, error: 'Student not assigned to you.' });

  const msg = {
    id: 'msg_' + Date.now(),
    studentId,
    mentorId: req.user.id,
    senderId: req.user.id,
    receiverId: studentId,
    message,
    createdAt: new Date().toISOString()
  };
  store.insert('messages', msg);
  res.json({ success: true, message: msg });
});

router.get('/mentor/doubts', requireAuth, requireRole('mentor'), (req, res) => {
  const doubts = store.find('doubts', d => d.mentorId === req.user.id);
  res.json({ success: true, doubts });
});

router.post('/mentor/doubts/:id/answer', requireAuth, requireRole('mentor'), (req, res) => {
  const doubtsColl = store.getCollection('doubts');
  const idx = doubtsColl.findIndex(d => d.id === req.params.id && d.mentorId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Doubt not found.' });

  doubtsColl[idx].answer = req.body.answer;
  doubtsColl[idx].status = 'answered';
  doubtsColl[idx].updatedAt = new Date().toISOString();
  store.saveDatabase();
  res.json({ success: true, doubt: doubtsColl[idx] });
});

router.get('/mentor/sessions', requireAuth, requireRole('mentor'), (req, res) => {
  const sessions = store.find('mentor_bookings', s => s.mentorId === req.user.id);
  res.json({ success: true, sessions });
});

router.post('/mentor/sessions/:id/respond', requireAuth, requireRole('mentor'), (req, res) => {
  const sessionsColl = store.getCollection('mentor_bookings');
  const idx = sessionsColl.findIndex(s => s.id === req.params.id && s.mentorId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Session not found.' });

  sessionsColl[idx].status = req.body.status; // 'confirmed' or 'rejected'
  sessionsColl[idx].updatedAt = new Date().toISOString();
  store.saveDatabase();
  res.json({ success: true, session: sessionsColl[idx] });
});

// ── Admin Notifications ────────────────────────────────────────────────────

// ── Admin Students ──────────────────────────────────────────────────────────
router.put('/admin/students/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const users = store.getCollection('users');
  const user = users.find(u => u.id === req.params.id);
  if (!user || user.role !== 'student') return res.status(404).json({ success: false, error: 'Student not found' });
  user.accountStatus = req.body.status;
  store.saveDatabase();
  res.json({ success: true });
});

// ── Admin Mentors ──────────────────────────────────────────────────────────
router.put('/admin/mentors/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const users = store.getCollection('users');
  const user = users.find(u => u.id === req.params.id);
  if (!user || user.role !== 'mentor') return res.status(404).json({ success: false, error: 'Mentor not found' });
  user.accountStatus = req.body.status;
  store.saveDatabase();
  res.json({ success: true });
});

// ── System ─────────────────────────────────────────────────────────────────
router.get('/system/runtime-info', (req, res) => {
  res.json({
    status: 'online',
    version: '4.5',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    aiAvailable: !!process.env.GEMINI_API_KEY
  });
});


// ============================================================
// PHASE 5C - ADMIN CRUD EXTENSIONS
// ============================================================

// --- RESOURCES ---
router.post('/admin/resources', requireAuth, requireRole('admin'), (req, res) => {
  const resource = { id: 'res_' + Date.now(), ...req.body, status: req.body.status || 'published', createdAt: new Date().toISOString() };
  store.insert('resources', resource);
  res.json({ success: true, resource });
});

router.put('/admin/resources/:id', requireAuth, requireRole('admin'), (req, res) => {
  let resources = store.getCollection('resources');
  const idx = resources.findIndex(r => r.id === req.params.id);
  if (idx > -1) {
    resources[idx] = { ...resources[idx], ...req.body, updatedAt: new Date().toISOString() };
    store.saveCollection('resources', resources);
    res.json({ success: true, resource: resources[idx] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

router.delete('/admin/resources/:id', requireAuth, requireRole('admin'), (req, res) => {
  let resources = store.getCollection('resources').filter(r => r.id !== req.params.id);
  store.saveCollection('resources', resources);
  res.json({ success: true });
});

// --- SCHOLARSHIPS ---
router.post('/admin/scholarships', requireAuth, requireRole('admin'), (req, res) => {
  const scholarship = { id: 'schol_' + Date.now(), ...req.body, status: req.body.status || 'published', createdAt: new Date().toISOString() };
  store.insert('scholarships', scholarship);
  res.json({ success: true, scholarship });
});

router.put('/admin/scholarships/:id', requireAuth, requireRole('admin'), (req, res) => {
  let scholarships = store.getCollection('scholarships');
  const idx = scholarships.findIndex(s => s.id === req.params.id);
  if (idx > -1) {
    scholarships[idx] = { ...scholarships[idx], ...req.body, updatedAt: new Date().toISOString() };
    store.saveCollection('scholarships', scholarships);
    res.json({ success: true, scholarship: scholarships[idx] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

router.delete('/admin/scholarships/:id', requireAuth, requireRole('admin'), (req, res) => {
  let scholarships = store.getCollection('scholarships').filter(s => s.id !== req.params.id);
  store.saveCollection('scholarships', scholarships);
  res.json({ success: true });
});

// --- JOBS & INTERNSHIPS ---
router.post('/admin/jobs-internships', requireAuth, requireRole('admin'), (req, res) => {
  const type = req.body.type === 'internship' ? 'internships' : 'jobs';
  const item = { id: 'job_' + Date.now(), ...req.body, status: req.body.status || 'published', createdAt: new Date().toISOString() };
  store.insert(type, item);
  res.json({ success: true, item });
});

router.put('/admin/jobs-internships/:id', requireAuth, requireRole('admin'), (req, res) => {
  const type = req.body.type === 'internship' ? 'internships' : 'jobs';
  let items = store.getCollection(type);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx > -1) {
    items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
    store.saveCollection(type, items);
    res.json({ success: true, item: items[idx] });
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

router.delete('/admin/jobs-internships/:id', requireAuth, requireRole('admin'), (req, res) => {
  const type = req.query.type === 'internship' ? 'internships' : 'jobs';
  let items = store.getCollection(type).filter(i => i.id !== req.params.id);
  store.saveCollection(type, items);
  res.json({ success: true });
});

// --- COMMUNITY MODERATION ---
router.get('/admin/community', requireAuth, requireRole('admin'), (req, res) => {
  const posts = store.getCollection('community_posts');
  const comments = store.getCollection('community_comments');
  res.json({ success: true, posts, comments });
});

router.put('/admin/community/moderate/:id', requireAuth, requireRole('admin'), (req, res) => {
  let posts = store.getCollection('community_posts');
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    posts[idx] = { ...posts[idx], status: req.body.status, updatedAt: new Date().toISOString() };
    store.saveCollection('community_posts', posts);
    return res.json({ success: true, post: posts[idx] });
  }
  let comments = store.getCollection('community_comments');
  const cIdx = comments.findIndex(c => c.id === req.params.id);
  if (cIdx > -1) {
    comments[cIdx] = { ...comments[cIdx], status: req.body.status, updatedAt: new Date().toISOString() };
    store.saveCollection('community_comments', comments);
    return res.json({ success: true, comment: comments[cIdx] });
  }
  res.status(404).json({ success: false, error: 'Not found' });
});












router.get('/admin/mentors', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const profilesSnap = await db.collection('profiles').get();
    const assignmentsSnap = await db.collection('mentor_assignments').get();

    const mentorUsers = usersSnap.docs.map(d => d.data()).filter(u => u.role === 'mentor');
    const profiles = profilesSnap.docs.map(d => d.data());
    const assignments = assignmentsSnap.docs.map(d => d.data());
    
    const mentorsList = mentorUsers.map(u => {
      const p = profiles.find(pr => pr.userId === u.id) || {};
      const activeAsgns = assignments.filter(a => a.mentorId === u.id && a.status === 'active');
      return {
        id: u.id,
        fullName: p.fullName || u.email.split('@')[0],
        email: u.email,
        specialization: p.specialization || 'General',
        assignedCount: activeAsgns.length,
        capacity: 5,
        status: u.status || 'active'
      };
    });
    res.json({ success: true, mentors: mentorsList });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});


// ── AI MENTOR API (GEMINI 3.1 PRO) ──────────────────────────────────────────────────────────
const { GoogleGenAI } = require('@google/genai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview'; // Fallback required due to Quota/limit:0 on 3.1-pro
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // relies on env

function getStudentContext(studentId) {
  const user = store.findOne('users', u => u.id === studentId);
  const profile = store.findOne('profiles', p => p.userId === studentId) || {};
  
  const assignments = store.getCollection('mentor_assignments') || [];
  const activeAssignment = assignments.find(a => a.studentId === studentId && a.status === 'active');
  let mentorData = { assigned: false };
  if (activeAssignment) {
    const mentor = store.findOne('users', u => u.id === activeAssignment.mentorId);
    const mProfile = store.findOne('mentor_profiles', p => p.userId === activeAssignment.mentorId) || {};
    if (mentor) {
      mentorData = {
        assigned: true,
        name: mentor.fullName,
        specialization: mProfile.specialization || 'General Career Guidance'
      };
    }
  }

  const bookmarks = store.getCollection('bookmarks') || [];
  const userBookmarks = bookmarks.filter(b => b.userId === studentId);
  const scholarships = (store.getCollection('scholarships') || []).filter(s => userBookmarks.some(b => b.itemId === s.id && b.type === 'scholarship'));
  const jobs = (store.getCollection('jobs') || []).filter(j => userBookmarks.some(b => b.itemId === j.id && b.type === 'job'));

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role
    },
    education: {
      course: profile.course,
      branch: profile.branch,
      year: profile.year,
      semester: profile.semester,
      college: profile.college,
      district: profile.district,
      state: profile.state,
      cgpa: profile.cgpa
    },
    interests: profile.interests || [],
    skills: profile.skills || [],
    careerGoals: profile.careerGoals || [],
    progress: {
      xp: profile.xp || 0,
      level: profile.level || 1,
      streak: profile.streak || 0
    },
    mentor: mentorData,
    savedOpportunities: {
      scholarships,
      jobs
    }
  };
}

// 1. Get Context
router.get('/student/ai-mentor/context', requireAuth, requireRole('student'), (req, res) => {
  const ctx = getStudentContext(req.user.id);
  res.json({ success: true, context: ctx });
});

// 2. Chat

router.get('/student/ai-mentor/conversations', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const snap = await db.collection('ai_conversations').get();
    const convos = snap.docs.map(d => d.data()).filter(c => c.studentUserId === req.user.id);
    convos.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ success: true, conversations: convos });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.get('/student/ai-mentor/conversations/:id', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const snap = await db.collection('ai_conversations').get();
    const msgs = snap.docs.map(d => d.data()).filter(m => m.conversationId === req.params.id);
    msgs.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ success: true, messages: msgs });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/student/ai-mentor/chat', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'GEMINI_API_KEY is not configured.' });
    }

    const ctx = getStudentContext(req.user.id);

    // Get or Create Conversation
    const convosSnap = await db.collection('ai_conversations').get();
    const convos = convosSnap.docs.map(d => d.data());
    let convo = convos.find(c => c.id === conversationId && c.studentUserId === req.user.id);
    if (!convo) {
      convo = {
        id: conversationId || 'conv_' + Date.now(),
        studentUserId: req.user.id,
        title: message.substring(0, 30) + '...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('ai_conversations').doc(convo.id).set(convo);
    } else {
      convo.updatedAt = new Date().toISOString();
      await db.collection('ai_conversations').doc(convo.id).set(convo);
    }

    // Load recent history (last 5 messages for context)
    const msgsSnap = await db.collection('ai_messages').get();
    const msgs = msgsSnap.docs.map(d => d.data());
    const history = msgs.filter(m => m.conversationId === convo.id).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-10);

    // Save User Message
    const userMsg = {
      id: 'msg_' + Date.now() + 'u',
      conversationId: convo.id,
      sender: 'student',
      content: message,
      createdAt: new Date().toISOString()
    };
    await db.collection('ai_messages').doc(userMsg.id).set(userMsg);

    const systemInstruction = `You are the "Margdarshak AI Mentor".
Purpose: Help rural and emerging students make informed career, education, skill-development, and opportunity decisions.
Behavior:
- You are a personalized, supportive, practical, and evidence-aware career guide.
- Explain difficult concepts simply.
- NEVER pretend to know information not present.
- NEVER invent student achievements, scholarships, jobs, colleges, or mentor activity.
- Distinguish between known student profile data and general knowledge.
- Respond in the language the student uses (English or Telugu).

STUDENT CONTEXT:
Name: ${ctx.user.fullName}
Education: ${'your profile'} in ${ctx.education.branch} (Year ${ctx.education.year}, Sem ${ctx.education.semester}) at ${ctx.education.college}, ${ctx.education.district}. CGPA: ${ctx.education.cgpa}.
Interests: ${ctx.interests.join(', ')}
Skills: ${ctx.skills.join(', ')}
Career Goals: ${ctx.careerGoals.join(', ')}
Progress: Level ${ctx.progress.level}, ${ctx.progress.xp} XP
Mentor Assigned: ${ctx.mentor.assigned ? ctx.mentor.name + ' (' + ctx.mentor.specialization + ')' : 'No mentor assigned yet.'}

Use this profile to give specific, personalized advice instead of generic answers.`;

    let historyLog = history.map(h => (h.sender === 'student' ? 'Student: ' : 'AI Mentor: ') + h.content).join('\n');
    const prompt = historyLog + '\nStudent: ' + req.body.message;

    let response;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
    } catch (apiErr) {
      if (apiErr.status === 429 || apiErr.status === 404 || (apiErr.message && apiErr.message.includes('quota'))) {
        console.error('[Gemini] Quota Unavailable on ' + GEMINI_MODEL + ':', apiErr.message);
        return res.status(503).json({
          success: false,
          error: 'AI_MENTOR_QUOTA_UNAVAILABLE',
          message: 'Gemini 3.1 Pro is temporarily unavailable because the configured API project has no available quota. Your message has been preserved. Please try again when Gemini quota is available.'
        });
      } else {
        throw apiErr;
      }
    }
    
    const aiText = response.text || "I'm sorry, I couldn't process that.";

    // Save AI Message
    const aiMsg = {
      id: 'msg_' + Date.now() + 'a',
      conversationId: convo.id,
      sender: 'ai',
      content: aiText,
      createdAt: new Date().toISOString()
    };
    await db.collection('ai_messages').doc(aiMsg.id).set(aiMsg);

    res.json({
      success: true,
      message: aiMsg,
      conversationId: convo.id,
      timestamp: aiMsg.createdAt
    });
  
  

  } catch (error) {
    console.error('AI Mentor Error:', error);
    res.status(500).json({ success: false, error: 'AI Mentor is temporarily unavailable. Please try again.' });
  }
});

// 3. Get Conversations
router.get('/student/ai-mentor/conversations', requireAuth, requireRole('student'), (req, res) => {
  const convos = (store.getCollection('ai_conversations') || []).filter(c => c.studentUserId === req.user.id);
  res.json({ success: true, conversations: convos.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)) });
});

// 4. Get specific conversation messages
router.get('/student/ai-mentor/conversations/:id', requireAuth, requireRole('student'), (req, res) => {
  const convo = (store.getCollection('ai_conversations') || []).find(c => c.id === req.params.id && c.studentUserId === req.user.id);
  if (!convo) return res.status(404).json({ success: false, error: 'Conversation not found' });

  const msgs = (store.getCollection('ai_messages') || []).filter(m => m.conversationId === convo.id).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ success: true, conversation: convo, messages: msgs });
});

// 5. Delete conversation
router.delete('/student/ai-mentor/conversations/:id', requireAuth, requireRole('student'), (req, res) => {
  let convos = store.getCollection('ai_conversations') || [];
  const idx = convos.findIndex(c => c.id === req.params.id && c.studentUserId === req.user.id);
  if (idx > -1) {
    convos.splice(idx, 1);
    store.saveCollection('ai_conversations', convos);
    let msgs = store.getCollection('ai_messages') || [];
    msgs = msgs.filter(m => m.conversationId !== req.params.id);
    store.saveCollection('ai_messages', msgs);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, error: 'Not found' });
});

module.exports = router;
