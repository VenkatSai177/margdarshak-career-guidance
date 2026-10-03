const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'store.json');

// Initial seed data for platform
const initialData = {
  users: [
    {
      id: 'usr_student_1',
      email: 'student@margdarshak.org',
      passwordHash: hashPassword('student123'),
      role: 'student',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_mentor_1',
      email: 'mentor@margdarshak.org',
      passwordHash: hashPassword('mentor123'),
      role: 'mentor',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_mentor_2',
      email: 'rajesh.mentor@margdarshak.org',
      passwordHash: hashPassword('mentor123'),
      role: 'mentor',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_mentor_3',
      email: 'priya.mentor@margdarshak.org',
      passwordHash: hashPassword('mentor123'),
      role: 'mentor',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_admin_1',
      email: 'admin@margdarshak.org',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  profiles: [
    {
      userId: 'usr_student_1',
      fullName: 'Ramesh Kumar',
      phone: '+91 9876543210',
      state: 'Telangana',
      district: 'Warangal',
      areaType: 'Rural',
      gender: 'Male',
      category: 'OBC',
      medium: 'Telugu / English',
      currentClass: 'Class 12 (MPC)',
      schoolCollege: 'Government Junior College, Hanamkonda',
      stream: 'MPC (Maths, Physics, Chemistry)',
      subjectStrengths: ['Mathematics', 'Physics', 'Problem Solving'],
      interests: ['Software Engineering', 'Data Science', 'Agricultural Technology'],
      workPreference: 'Technology & Engineering',
      salaryExpectation: '₹4,00,000 - ₹8,00,000 / year',
      dreamRoles: ['Full Stack Developer', 'Data Analyst', 'Agri-Tech Specialist'],
      xp: 450,
      level: 3,
      levelBadge: 'Rising Scholar',
      streak: 5,
      completedOnboarding: true,
      updatedAt: new Date().toISOString()
    }
  ],
  mentor_profiles: [
    {
      id: 'mnt_1',
      userId: 'usr_mentor_1',
      fullName: 'Dr. Anita Rao',
      designation: 'Senior Career Counselor & AI Engineer',
      organization: 'National Skill Development Mission',
      expertise: ['Engineering', 'Computer Science', 'Higher Education', 'Govt Scholarships'],
      experienceYears: 12,
      languages: ['English', 'Telugu', 'Hindi'],
      bio: 'Dedicated to empowering rural students through structured career planning and STEM mentorship.',
      rating: 4.9,
      totalSessions: 142
    },
    {
      id: 'mnt_2',
      userId: 'usr_mentor_2',
      fullName: 'Dr. Rajesh Sharma',
      designation: 'Professor of Computer Science & Rural Outreach Chair',
      organization: 'JNTU Hyderabad',
      expertise: ['Computer Science', 'Robotics', 'Polytechnic Guidance'],
      experienceYears: 15,
      languages: ['English', 'Telugu'],
      bio: 'Helping polytechnic and rural engineering aspirants achieve career excellence.',
      rating: 4.8,
      totalSessions: 98
    },
    {
      id: 'mnt_3',
      userId: 'usr_mentor_3',
      fullName: 'Dr. Priya Sundaram',
      designation: 'Scholarship & Higher Education Consultant',
      organization: 'Andhra Higher Education Council',
      expertise: ['Scholarships', 'Overseas Admissions', 'Civil Services'],
      experienceYears: 10,
      languages: ['English', 'Telugu', 'Tamil'],
      bio: 'Guiding bright students from underserved districts to top national & international scholarships.',
      rating: 4.95,
      totalSessions: 115
    }
  ],
  mentor_assignments: [
    {
      id: 'asgn_1',
      studentId: 'usr_student_1',
      mentorId: 'usr_mentor_1',
      assignedBy: 'usr_admin_1',
      status: 'active',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  mentor_availability: [
    { id: 'av_1', mentorId: 'mnt_1', day: 'Monday', timeSlot: '10:00 AM - 11:00 AM', status: 'available' },
    { id: 'av_2', mentorId: 'mnt_1', day: 'Wednesday', timeSlot: '03:00 PM - 04:00 PM', status: 'available' },
    { id: 'av_3', mentorId: 'mnt_1', day: 'Friday', timeSlot: '05:00 PM - 06:00 PM', status: 'available' }
  ],
  mentor_bookings: [
    {
      id: 'bk_1',
      studentId: 'usr_student_1',
      studentName: 'Ramesh Kumar',
      mentorId: 'mnt_1',
      mentorName: 'Dr. Anita Rao',
      date: '2026-10-10',
      timeSlot: '10:00 AM - 11:00 AM',
      topic: 'B.Tech Entrance Preparation & Scholarship Guidance',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
  ],
  assessments: [
    {
      id: 'asm_1',
      userId: 'usr_student_1',
      stream: 'MPC',
      score: 88,
      primaryTrait: 'Analytical & Logical Problem Solver',
      strengths: ['Quantitative Reasoning', 'Technical Aptitude', 'Adaptability'],
      weaknesses: ['Advanced Technical English Communication'],
      timestamp: new Date().toISOString()
    }
  ],
  career_recommendations: [
    {
      id: 'rec_1',
      userId: 'usr_student_1',
      careerTitle: 'Software & Web Development',
      sector: 'Information Technology',
      fitPercentage: 94,
      avgStartingSalary: '₹4.5L - ₹8L / yr',
      growthRate: 'High Growth (+22% YoY)',
      requiredSkills: ['JavaScript / Python', 'Data Structures', 'Problem Solving'],
      roadmapSteps: [
        'Complete Class 12 MPC with 75%+ marks',
        'Enroll in B.Tech Computer Science / BCA',
        'Build 3 hands-on practical projects',
        'Apply for rural tech internships'
      ]
    },
    {
      id: 'rec_2',
      userId: 'usr_student_1',
      careerTitle: 'Data Analyst & Agri-Analytics',
      sector: 'Data & Agriculture Technology',
      fitPercentage: 87,
      avgStartingSalary: '₹4L - ₹7L / yr',
      growthRate: 'Emerging High-Demand',
      requiredSkills: ['SQL & Excel', 'Python Basics', 'Domain Knowledge'],
      roadmapSteps: [
        'Learn SQL & Data Visualization basics',
        'Participate in Margdarshak Data Skill Challenge',
        'Apply for Junior Analyst certification'
      ]
    }
  ],
  skills: [
    { id: 'skl_1', title: 'Python Programming Basics', category: 'Technical', duration: '6 Weeks', level: 'Beginner' },
    { id: 'skl_2', title: 'Data Analysis & Excel Mastery', category: 'Technical', duration: '4 Weeks', level: 'Beginner' },
    { id: 'skl_3', title: 'English Communication for Interviews', category: 'Soft Skills', duration: '3 Weeks', level: 'Intermediate' },
    { id: 'skl_4', title: 'Web Development (HTML/CSS/JS)', category: 'Technical', duration: '8 Weeks', level: 'Beginner' }
  ],
  skill_progress: [
    { id: 'sp_1', userId: 'usr_student_1', skillId: 'skl_1', progressPercent: 75, completedModules: 6, totalModules: 8, status: 'In Progress' },
    { id: 'sp_2', userId: 'usr_student_1', skillId: 'skl_3', progressPercent: 40, completedModules: 2, totalModules: 5, status: 'In Progress' }
  ],
  courses: [
    {
      id: 'crs_1',
      title: 'B.Tech in Computer Science & Engineering',
      duration: '4 Years',
      eligibility: 'Class 12 Pass (MPC / Science)',
      stream: 'Engineering',
      avgFee: '₹45,000 - ₹1,20,000 / yr',
      topColleges: ['JNTU Hyderabad', 'Kakatiya University Warangal', 'Osmania University'],
      careerProspects: 'Software Engineer, Systems Analyst, Cloud Developer'
    },
    {
      id: 'crs_2',
      title: 'B.Sc in Agriculture & Smart Farming',
      duration: '4 Years',
      eligibility: 'Class 12 Pass (BiPC / MPC)',
      stream: 'Agriculture',
      avgFee: '₹25,000 - ₹60,000 / yr',
      topColleges: ['Professor Jayashankar Telangana State Agricultural University', 'ANGRAU'],
      careerProspects: 'Agricultural Officer, Agri-Tech Specialist, Research Analyst'
    }
  ],
  colleges: [
    {
      id: 'clg_1',
      name: 'Kakatiya University College of Engineering',
      location: 'Warangal, Telangana',
      type: 'Government Public University',
      accreditation: 'NAAC A+ Grade',
      coursesOffered: ['B.Tech CSE', 'B.Tech ECE', 'B.Tech Civil'],
      hostelAvailable: true,
      ruralScholarshipAccepted: true,
      website: 'https://kuwarangal.ac.in'
    },
    {
      id: 'clg_2',
      name: 'Government Degree & P.G. College for Rural Development',
      location: 'Hanamkonda, Telangana',
      type: 'Government Autonomous',
      accreditation: 'NAAC A Grade',
      coursesOffered: ['B.Sc Computer Science', 'B.Com Computer Applications', 'B.A Economics'],
      hostelAvailable: true,
      ruralScholarshipAccepted: true,
      website: 'https://gdcts.cgg.gov.in'
    }
  ],
  scholarships: [
    {
      id: 'sch_1',
      title: 'National Means-cum-Merit Scholarship (NMMS)',
      provider: 'Ministry of Education, Govt of India',
      amount: '₹12,000 / year',
      eligibility: 'Class 9-12 students with family income < ₹3.5 Lakhs/yr',
      deadline: '2026-11-15',
      category: 'Merit-cum-Means',
      applyUrl: 'https://scholarships.gov.in'
    },
    {
      id: 'sch_2',
      title: 'Telangana EPASS Post-Matric Scholarship',
      provider: 'Government of Telangana',
      amount: 'Full Tuition Fee Reimbursement + Maintenance Allowance',
      eligibility: 'SC/ST/OBC/EBC rural students pursuing Higher Education',
      deadline: '2026-12-31',
      category: 'State Govt Scheme',
      applyUrl: 'https://telanganaepass.cgg.gov.in'
    },
    {
      id: 'sch_3',
      title: 'Pragathi Scholarship Scheme for Female STEM Students',
      provider: 'AICTE Govt of India',
      amount: '₹50,000 / year',
      eligibility: 'Female candidates admitted to Technical Degree/Diploma courses',
      deadline: '2026-10-30',
      category: 'Women Empowerment',
      applyUrl: 'https://www.aicte-india.org'
    }
  ],
  jobs: [
    {
      id: 'job_1',
      title: 'Junior Web Developer Trainee',
      company: 'RuralTech Innovations India',
      location: 'Warangal / Remote',
      type: 'Full-time',
      salary: '₹3,50,000 - ₹5,00,000 / yr',
      skillsRequired: ['HTML/CSS', 'JavaScript Basics', 'Eagerness to Learn'],
      postedDate: '2026-09-28',
      applyUrl: '#'
    },
    {
      id: 'job_2',
      title: 'Field Data Collector & Agri-Analyst',
      company: 'Smart Agro Solutions',
      location: 'Karimnagar / Hyderabad',
      type: 'Full-time',
      salary: '₹3,00,000 - ₹4,20,000 / yr',
      skillsRequired: ['Basic Data Entry', 'Excel', 'Regional Language Fluency'],
      postedDate: '2026-09-30',
      applyUrl: '#'
    }
  ],
  internships: [
    {
      id: 'int_1',
      title: 'Digital Literacy & Skill Development Intern',
      organization: 'Margdarshak Foundation',
      location: 'Remote / District Centers',
      stipend: '₹8,00,000 / 3 months (₹8,000/mo)',
      duration: '3 Months',
      skillsRequired: ['Communication', 'Basic Computer Knowledge'],
      applyUrl: '#'
    }
  ],
  ai_conversations: [
    {
      userId: 'usr_student_1',
      messages: [
        {
          id: 'msg_1',
          sender: 'ai',
          text: 'Namaste Ramesh! I am your Margdarshak AI Mentor. How can I guide your career journey today in Telangana?',
          timestamp: new Date().toISOString()
        }
      ]
    }
  ],
  resumes: [
    {
      userId: 'usr_student_1',
      fullName: 'Ramesh Kumar',
      email: 'ramesh.kumar@gmail.com',
      phone: '+91 9876543210',
      location: 'Warangal, Telangana',
      summary: 'Motivated Class 12 student with strong analytical skills, passion for technology, and eagerness to build a software engineering career.',
      education: 'Government Junior College, Hanamkonda — MPC (2024 - 2026)',
      skills: 'Python, JavaScript Basics, Mathematics, Public Speaking',
      projects: 'Village Digital Survey App — Built a mobile survey form for rural literacy statistics.',
      languages: 'Telugu (Native), English (Proficient), Hindi (Conversational)',
      updatedAt: new Date().toISOString()
    }
  ],
  challenges: [
    {
      id: 'ch_1',
      title: 'Complete Career Assessment',
      xpReward: 100,
      description: 'Finish all 4 steps of your onboarding career assessment profile.',
      category: 'Onboarding',
      completed: true
    },
    {
      id: 'ch_2',
      title: 'Ask AI Mentor 3 Questions',
      xpReward: 50,
      description: 'Consult your Margdarshak AI Mentor regarding your target careers.',
      category: 'AI Guidance',
      completed: false
    },
    {
      id: 'ch_3',
      title: 'Explore 2 Scholarships',
      xpReward: 50,
      description: 'Browse and save eligible government scholarship schemes.',
      category: 'Scholarships',
      completed: false
    },
    {
      id: 'ch_4',
      title: 'Build First Resume Version',
      xpReward: 150,
      description: 'Use the Margdarshak Resume Builder to craft your profile resume.',
      category: 'Career Prep',
      completed: false
    }
  ],
  leaderboard: [
    { rank: 1, name: 'Sravanthi Reddy', district: 'Karimnagar', xp: 1250, badge: 'Master Scholar' },
    { rank: 2, name: 'Praveen Goud', district: 'Nizamabad', xp: 980, badge: 'Tech Pioneer' },
    { rank: 3, name: 'Ramesh Kumar', district: 'Warangal', xp: 450, badge: 'Rising Scholar' },
    { rank: 4, name: 'Kavitha M.', district: 'Khammam', xp: 380, badge: 'Explorer' }
  ],
  community_posts: [
    {
      id: 'post_1',
      authorId: 'usr_student_1',
      authorName: 'Ramesh Kumar',
      authorRole: 'Student',
      title: 'How to prepare for EAMCET / TS EAPCET alongside Class 12 Board exams?',
      content: 'Hello everyone! Can any senior or mentor share a daily study timetable for balancing state board physics/maths and entrance preparation?',
      likes: 14,
      commentsCount: 3,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'post_2',
      authorId: 'usr_mentor_1',
      authorName: 'Dr. Anita Rao',
      authorRole: 'Mentor',
      title: 'Top Govt Scholarships for Telangana & Andhra Rural Students in 2026',
      content: 'I have compiled a list of key state & national scholarships open for rural students this academic year. Feel free to ask any eligibility questions below!',
      likes: 38,
      commentsCount: 7,
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  community_comments: [
    {
      id: 'cmt_1',
      postId: 'post_1',
      authorName: 'Dr. Anita Rao',
      content: 'Focus 2 hours every morning on previous year question papers and solve mock tests every Sunday!',
      createdAt: new Date(Date.now() - 43200000).toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_student_1',
      title: 'Scholarship Alert',
      body: 'Telangana EPASS Post-Matric Scholarship applications are now open!',
      read: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'notif_2',
      userId: 'usr_student_1',
      title: 'Mentorship Confirmed',
      body: 'Your mentorship session with Dr. Anita Rao is scheduled for Oct 10, 10:00 AM.',
      read: true,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  resources: [
    {
      id: 'res_1',
      title: 'Complete Guide to STEM Entrance Exams in India',
      type: 'E-Book / PDF',
      category: 'Exam Prep',
      description: 'Comprehensive guide covering EAMCET, JEE, NEET, and State Entrance syllabi and preparation tips.',
      downloadUrl: '#'
    },
    {
      id: 'res_2',
      title: 'Rural Youth Skill Development Handbook 2026',
      type: 'Handbook',
      category: 'Skill Building',
      description: 'Step-by-step roadmap to building IT, data, and soft skills from home using free resources.',
      downloadUrl: '#'
    }
  ]
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Database Helper Class

class Store {
  constructor() {
    this.data = null;
    this.writeTimeout = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = JSON.parse(JSON.stringify(initialData));
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
      } catch (err) {
        console.warn('ReadOnly FileSystem - running in memory only');
      }
    } else {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(content);
      } catch (err) {
        console.error('Error reading database file, using initial data:', err);
        this.data = JSON.parse(JSON.stringify(initialData));
      }
    }
  }

  read() {
    // Return the in-memory cache directly
    return this.data;
  }

  write(data) {
    // Update in-memory cache immediately
    this.data = data;
    
    // Asynchronous background write with debouncing (500ms)
    // This prevents blocking the Node.js event loop
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    
    this.writeTimeout = setTimeout(() => {
      fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), (err) => {
        if (err) console.error('Error in background database write:', err);
      });
    }, 500);
  }

  getCollection(name) {
    const data = this.read();
    return data[name] || [];
  }

  saveCollection(name, items) {
    const data = this.read();
    data[name] = items;
    this.write(data);
  }

  findOne(collection, filterFn) {
    const items = this.getCollection(collection);
    return items.find(filterFn);
  }

  find(collection, filterFn) {
    const items = this.getCollection(collection);
    return filterFn ? items.filter(filterFn) : items;
  }

  insert(collection, item) {
    const items = this.getCollection(collection);
    if (!item.id) item.id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    items.push(item);
    this.saveCollection(collection, items);
    return item;
  }

  update(collection, filterFn, updateObj) {
    const items = this.getCollection(collection);
    let updated = null;
    const newItems = items.map(item => {
      if (filterFn(item)) {
        updated = { ...item, ...updateObj };
        return updated;
      }
      return item;
    });
    if (updated) this.saveCollection(collection, newItems);
    return updated;
  }

  hashPassword(password) {
    return hashPassword(password);
  }
}

module.exports = new Store();
