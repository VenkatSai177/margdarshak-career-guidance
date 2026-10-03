


(function() {
  console.log('Margdarshak Master Dynamic Client App Engine Active');

  document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;

    // Apply stored theme & language preferences
    applyStoredPreferences();

    // Explicit data-route click handlers
    document.querySelectorAll('[data-route]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        const route = el.getAttribute('data-route');
        if (route) window.location.href = route;
      });
    });

    // Global Header Search & Controls Engine
    initGlobalHeaderControls();

    // Global Top-Right Profile Header & Dropdown Engine
    syncGlobalHeaderUser();

    // Screen-specific initializations
    if (path === '/' || path === '/margdarshak_landing_page') {
      initLandingPage();
    } else if (path.startsWith('/auth/student') || path === '/login') {
      initStudentAuthScreen();
    } else if (path.startsWith('/auth/mentor-login')) {
      initMentorAuthScreen();
    } else if (path.startsWith('/auth/admin-login')) {
      initAdminAuthScreen();
    } else if (path.startsWith('/onboarding/personal-details')) {
      initOnboardingStep1();
    } else if (path.startsWith('/onboarding/study-details')) {
      initOnboardingStep2();
    } else if (path.startsWith('/onboarding/interests-aspirations')) {
      initOnboardingStep3();
    } else if (path.startsWith('/onboarding/profile-review')) {
      initOnboardingStep4();
    } else if (path.startsWith('/student/dashboard') || path === '/home') {
      initStudentDashboard();
    } else if (path.startsWith('/career-guidance')) {
      initCareerGuidance();
    } else if (path.startsWith('/skill-development')) {
      initSkillDevelopment();
    } else if (path.startsWith('/courses-colleges')) {
      initCoursesColleges();
    } else if (path.startsWith('/scholarships')) {
      initScholarships();
    } else if (path.startsWith('/jobs-internships')) {
      initJobsInternships();
    } else if (path.startsWith('/ai-mentor')) {
      initAiMentor();
    } else if (path.startsWith('/resume-builder')) {
      initResumeBuilder();
    } else if (path.startsWith('/challenges-xp')) {
      initChallengesXp();
    } else if (path.startsWith('/community')) {
      initCommunity();
    } else if (path.startsWith('/resources')) {
      initResources();
    } else if (path.startsWith('/mentor')) {
      initMentorDashboard();
    } else if (path.startsWith('/admin')) {
      initAdminPortal();
    }
  });

  // Helper API fetch with error handling
  function apiFetch(url, options) {
    options = options || {};
    options.credentials = 'same-origin';
    options.headers = options.headers || {};
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    return fetch(url, options).then(function(res) {
      if (res.status === 401) {
        if (!window.location.pathname.startsWith('/auth/')) {
          const p = window.location.pathname;
          if (p.startsWith('/mentor')) window.location.href = '/auth/mentor-login';
          else if (p.startsWith('/admin')) window.location.href = '/auth/admin-login';
          else window.location.href = '/auth/student';
        }
      }
      return res.json();
    }).catch(function(err) {
      console.error('API request error for ' + url + ':', err);
      return { success: false, error: err.message };
    });
  }

  // Toast Notification Component
  function showToast(type, message) {
    let toast = document.getElementById('margdarshak-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'margdarshak-global-toast';
      toast.className = 'fixed bottom-5 right-5 z-[99999] px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl transition-all duration-300 transform max-w-sm flex items-center gap-2 select-none border';
      document.body.appendChild(toast);
    }

    toast.classList.remove('bg-emerald-950/90', 'text-emerald-200', 'border-emerald-500/40', 'bg-red-950/90', 'text-red-200', 'border-red-500/40', 'bg-[#1a1d26]', 'text-amber-300', 'border-amber-500/40');

    if (type === 'success') {
      toast.classList.add('bg-emerald-950/90', 'text-emerald-200', 'border-emerald-500/40');
    } else if (type === 'error') {
      toast.classList.add('bg-red-950/90', 'text-red-200', 'border-red-500/40');
    } else {
      toast.classList.add('bg-[#1a1d26]', 'text-amber-300', 'border-amber-500/40');
    }

    toast.textContent = message;
    toast.style.display = 'flex';

    setTimeout(function() {
      if (toast) toast.style.display = 'none';
    }, 3500);
  }

  // Preference Storage Engine
  function applyStoredPreferences() {
    const theme = localStorage.getItem('margdarshak_theme') || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-[#FAF7F0]', 'text-slate-900');
    } else {
      document.documentElement.classList.add('dark');
    }
  }

  // Centralized Role Dashboard Engine
  function getDashboardRoute(role) {
    if (role === 'admin') return '/admin/portal';
    if (role === 'mentor') return '/mentor/dashboard';
    return '/student/dashboard';
  }

  // Global Header User Profile & Interactive Dropdown Sync
  
  window.hydrateUI = function(user, profile) {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const field = el.getAttribute('data-bind');
      let val = null;
      if (field === 'user.name' || field === 'user.fullName') val = profile.fullName || user.email.split('@')[0];
      else if (field === 'user.firstName') val = (profile.fullName || user.email.split('@')[0]).split(' ')[0];
      else if (field === 'user.email') val = user.email;
      else if (field === 'user.xp') val = profile.xp || 0;
      else if (field === 'user.level') val = profile.level || 1;
      else if (field === 'user.streak') val = profile.streak || 0;
      else if (field === 'user.badge') val = profile.levelBadge || 'Explorer';
      else if (field === 'student.id') val = (user.id || '').replace('usr_', 'MGD-2024-');
      
      if (val !== null) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = val;
        else el.textContent = val;
      }
    });
  };

  function syncGlobalHeaderUser() {
    apiFetch('/api/auth/me').then(function(data) {
      
      if (!data || !data.user) {
        const p = window.location.pathname;
        const isPublic = p === '/' || p === '/margdarshak_landing_page' || p.startsWith('/auth') || p.startsWith('/login');
        if (!isPublic) {
          window.location.href = '/login';
        }
        return;
      }

      const user = data.user;
      const profile = user.profile || data.profile || {};

      const fullName = profile.fullName || user.email.split('@')[0];
      const roleLabel = user.role === 'admin' ? 'Administrator' : (user.role === 'mentor' ? 'Verified Mentor' : 'Student');
      const parts = fullName.trim().split(' ');
      const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();
      window.hydrateUI(user, profile);

      const profileContainer = 
        document.querySelector('header .cursor-pointer.pl-1') || 
        document.querySelector('header .cursor-pointer.group') || 
        document.querySelector('header .flex.items-center.gap-3.cursor-pointer') ||
        document.querySelector('header .flex.items-center.space-x-3.pl-4') ||
        document.querySelector('header div.cursor-pointer');

      if (profileContainer) {
        profileContainer.setAttribute('tabindex', '0');
        profileContainer.setAttribute('role', 'button');
        profileContainer.setAttribute('aria-haspopup', 'true');
        profileContainer.setAttribute('aria-expanded', 'false');
        profileContainer.style.cursor = 'pointer';

        const nameNode = profileContainer.querySelector('.text-xs.font-semibold') || 
                         profileContainer.querySelector('span.text-xs') ||
                         profileContainer.querySelector('div.font-semibold');
        const roleNode = profileContainer.querySelector('.text-\\[10px\\]') ||
                         profileContainer.querySelector('span.text-\\[10px\\]');
        const avatarContainer = profileContainer.querySelector('.w-8.h-8') || 
                                profileContainer.querySelector('.w-9.h-9') || 
                                profileContainer.querySelector('div.rounded-full');

        if (nameNode) nameNode.textContent = fullName;
        if (roleNode) roleNode.textContent = roleLabel;

        if (avatarContainer) {
          const img = avatarContainer.querySelector('img');
          if (!img || !user.avatar) {
            const initialsDiv = document.createElement('div');
            initialsDiv.className = 'w-full h-full rounded-full bg-[#181B22] flex items-center justify-center text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/50';
            initialsDiv.textContent = initials;
            avatarContainer.innerHTML = '';
            avatarContainer.appendChild(initialsDiv);
          }
        }

        profileContainer.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleProfileDropdown(profileContainer, user, profile, fullName, roleLabel, initials);
        };
      }
    });
  }

  // Floating Responsive Profile Dropdown Menu Engine
  function toggleProfileDropdown(triggerEl, user, profile, fullName, roleLabel, initials) {
    let menu = document.getElementById('user-profile-dropdown-menu');
    
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'user-profile-dropdown-menu';
      menu.className = 'fixed bg-[#1a1d26] text-gray-200 border border-[#2f3545] rounded-xl shadow-2xl z-[9999] p-2 text-xs select-none w-64 max-w-[calc(100vw-24px)] transition-all duration-150 hidden';
      document.body.appendChild(menu);

      document.addEventListener('click', function(e) {
        const currentMenu = document.getElementById('user-profile-dropdown-menu');
        const trigger = triggerEl || document.querySelector('header div.cursor-pointer');
        if (currentMenu && !currentMenu.classList.contains('hidden')) {
          if (trigger && (trigger === e.target || trigger.contains(e.target))) return;
          if (currentMenu.contains(e.target)) return;
          closeProfileDropdown();
        }
      });
    }

    const isAdmin = user.role === 'admin';

    menu.innerHTML = `
      <div class="px-3 py-2.5 border-b border-[#2d3345] mb-1 bg-[#13151c] rounded-t-lg">
        <div id="dd-user-name" class="font-bold text-sm text-white truncate">${fullName}</div>
        <div id="dd-user-email" class="text-[11px] text-gray-400 truncate">${user.email}</div>
        <div class="mt-1 flex items-center gap-1.5">
          <span id="dd-user-role" class="px-2 py-0.5 text-[9.5px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">${roleLabel}</span>
          <span class="text-[9.5px] text-emerald-400 font-medium">● Active Session</span>
        </div>
      </div>
      <div class="space-y-0.5">
        <button id="dd-btn-profile" type="button" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-[#262c3a] rounded-lg transition-colors font-medium cursor-pointer">
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2"></path></svg>
          <span>View Profile</span>
        </button>
        ${!isAdmin ? `
        <button id="dd-btn-edit" type="button" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-[#262c3a] rounded-lg transition-colors font-medium cursor-pointer">
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="2"></path></svg>
          <span>Edit Account Details</span>
        </button>
        ` : ''}
        <button id="dd-btn-settings" type="button" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-[#262c3a] rounded-lg transition-colors font-medium cursor-pointer">
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-width="2"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-width="2"></path></svg>
          <span>Account Settings</span>
        </button>
      </div>
      <div class="border-t border-[#2d3345] my-1.5"></div>
      <button id="dd-btn-logout" type="button" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-red-400 hover:bg-red-500/15 rounded-lg transition-colors font-semibold cursor-pointer">
        <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-width="2"></path></svg>
        <span>Logout Session</span>
      </button>
    `;

    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      menu.style.top = (rect.bottom + 8) + 'px';
      menu.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
    }

    menu.classList.toggle('hidden');

    const btnProfile = document.getElementById('dd-btn-profile');
    if (btnProfile) {
      btnProfile.onclick = function(e) {
        e.preventDefault();
        closeProfileDropdown();
        showProfileModal(user, profile, fullName, roleLabel);
      };
    }

    const btnEdit = document.getElementById('dd-btn-edit');
    if (btnEdit) {
      btnEdit.onclick = function(e) {
        e.preventDefault();
        closeProfileDropdown();
        showEditProfileModal(user, profile, fullName);
      };
    }

    const btnSettings = document.getElementById('dd-btn-settings');
    if (btnSettings) {
      btnSettings.onclick = function(e) {
        e.preventDefault();
        closeProfileDropdown();
        showSettingsModal(user, roleLabel);
      };
    }

    const btnLogout = document.getElementById('dd-btn-logout');
    if (btnLogout) {
      btnLogout.onclick = function(e) {
        e.preventDefault();
        closeProfileDropdown();
        apiFetch('/api/auth/logout', { method: 'POST' }).then(function() {
          window.location.href = '/';
        });
      };
    }
  }

  function closeProfileDropdown() {
    const menu = document.getElementById('user-profile-dropdown-menu');
    if (menu) menu.classList.add('hidden');
  }

  // Profile Modal
  function showProfileModal(user, profile, fullName, roleLabel) {
    let modal = document.getElementById('profile-view-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profile-view-modal';
      modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }
    const initials = fullName.substring(0, 2).toUpperCase();
    modal.innerHTML = `
      <div class="bg-[#1c202a] text-gray-200 border border-[#303646] rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-none">
        <button id="close-profile-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold">✕</button>
        <div class="flex items-center gap-4 border-b border-[#2d3345] pb-4 mb-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#c99846] to-amber-200 flex items-center justify-center text-black font-bold text-xl shadow-md">
            ${initials}
          </div>
          <div>
            <h3 class="text-lg font-bold text-white leading-tight">${fullName}</h3>
            <p class="text-xs text-gray-400">${user.email}</p>
            <span class="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">${roleLabel}</span>
          </div>
        </div>
        <div class="space-y-3 text-xs">
          <div class="flex justify-between py-1 border-b border-[#292e3d]">
            <span class="text-gray-400">Account Role</span>
            <span class="font-semibold text-amber-200 uppercase">${user.role}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-[#292e3d]">
            <span class="text-gray-400">Phone</span>
            <span class="font-semibold text-white">${profile.phone || '+91 9876543210'}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-[#292e3d]">
            <span class="text-gray-400">State / District</span>
            <span class="font-semibold text-white">${profile.state || 'Telangana'}, ${profile.district || 'Warangal'}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-[#292e3d]">
            <span class="text-gray-400">${user.role === 'mentor' ? 'Expertise Area' : 'Academic Stream'}</span>
            <span class="font-semibold text-white">${profile.stream || profile.expertise || 'Computer Science & AI'}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-[#292e3d]">
            <span class="text-gray-400">XP Points</span>
            <span class="font-bold text-amber-400">${profile.xp || 450} XP</span>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          ${user.role !== 'admin' ? '<button id="modal-edit-trigger" class="px-4 py-2 bg-[#c99846] hover:bg-[#b58434] text-black font-bold text-xs rounded-xl shadow transition">Edit Profile</button>' : ''}
          <button id="modal-close-btn" class="px-4 py-2 bg-[#282d3c] hover:bg-[#343b4e] text-gray-300 font-semibold text-xs rounded-xl transition">Close</button>
        </div>
      </div>
    `;
    document.getElementById('close-profile-modal').onclick = () => modal.remove();
    document.getElementById('modal-close-btn').onclick = () => modal.remove();
    const editTrigger = document.getElementById('modal-edit-trigger');
    if (editTrigger) {
      editTrigger.onclick = () => {
        modal.remove();
        showEditProfileModal(user, profile, fullName);
      };
    }
  }

  // Edit Profile Modal
  function showEditProfileModal(user, profile, fullName) {
    let modal = document.getElementById('profile-edit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profile-edit-modal';
      modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="bg-[#1c202a] text-gray-200 border border-[#303646] rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-none">
        <button id="close-edit-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold">✕</button>
        <h3 class="text-base font-bold text-white mb-4 border-b border-[#2d3345] pb-2 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="2"></path></svg>
          Edit Account Profile
        </h3>
        <form id="edit-profile-form" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-gray-400 mb-1 font-medium">Full Name</label>
            <input type="text" id="edit-name" value="${fullName}" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" required>
          </div>
          <div>
            <label class="block text-gray-400 mb-1 font-medium">Phone Number</label>
            <input type="text" id="edit-phone" value="${profile.phone || '+91 9876543210'}" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1 font-medium">State</label>
              <input type="text" id="edit-state" value="${profile.state || 'Telangana'}" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
            </div>
            <div>
              <label class="block text-gray-400 mb-1 font-medium">District</label>
              <input type="text" id="edit-district" value="${profile.district || 'Warangal'}" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
            </div>
          </div>
          <div>
            <label class="block text-gray-400 mb-1 font-medium">${user.role === 'mentor' ? 'Expertise Subject / Field' : 'Academic Stream / Class'}</label>
            <input type="text" id="edit-stream" value="${profile.stream || profile.expertise || 'Computer Science & Engineering'}" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
          </div>
          <div class="pt-3 flex justify-end gap-2">
            <button type="button" id="cancel-edit-modal" class="px-4 py-2 bg-[#282d3c] hover:bg-[#343b4e] text-gray-300 font-semibold text-xs rounded-xl transition">Cancel</button>
            <button type="submit" id="save-edit-modal" class="px-4 py-2 bg-[#c99846] hover:bg-[#b58434] text-black font-bold text-xs rounded-xl shadow transition">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('close-edit-modal').onclick = () => modal.remove();
    document.getElementById('cancel-edit-modal').onclick = () => modal.remove();

    document.getElementById('edit-profile-form').onsubmit = function(e) {
      e.preventDefault();
      const newName = document.getElementById('edit-name').value.trim();
      const newPhone = document.getElementById('edit-phone').value.trim();
      const newState = document.getElementById('edit-state').value.trim();
      const newDistrict = document.getElementById('edit-district').value.trim();
      const newStream = document.getElementById('edit-stream').value.trim();

      if (!newName) return;

      apiFetch('/api/profile/update', {
        method: 'POST',
        body: {
          fullName: newName,
          phone: newPhone,
          state: newState,
          district: newDistrict,
          stream: newStream,
          expertise: newStream
        }
      }).then(function(res) {
        if (res.success) {
          modal.remove();
          showToast('success', 'Profile updated successfully!');
          syncGlobalHeaderUser();
        } else {
          showToast('error', res.error || 'Failed to update profile.');
        }
      });
    };
  }

  // Account Settings Modal
  function showSettingsModal(user, roleLabel) {
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-modal';
      modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="bg-[#1c202a] text-gray-200 border border-[#303646] rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-none">
        <button id="close-settings-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold">✕</button>
        <h3 class="text-base font-bold text-white mb-4 border-b border-[#2d3345] pb-2 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-width="2"></path></svg>
          Account Settings & Preferences
        </h3>
        <div class="space-y-3.5 text-xs">
          <div class="flex justify-between items-center py-2 border-b border-[#292e3d]">
            <div>
              <div class="font-semibold text-white">Registered Email</div>
              <div class="text-[11px] text-gray-400">${user.email}</div>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verified</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-[#292e3d]">
            <div>
              <div class="font-semibold text-white">Security & Session</div>
              <div class="text-[11px] text-gray-400">HTTP-Only Cookie Authentication</div>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Active</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-[#292e3d]">
            <div>
              <div class="font-semibold text-white">Notifications</div>
              <div class="text-[11px] text-gray-400">Career & Mentor Alerts</div>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Enabled</span>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button id="close-settings-btn" class="px-4 py-2 bg-[#c99846] hover:bg-[#b58434] text-black font-bold text-xs rounded-xl shadow transition">Done</button>
        </div>
      </div>
    `;
    document.getElementById('close-settings-modal').onclick = () => modal.remove();
    document.getElementById('close-settings-btn').onclick = () => modal.remove();
  }

  // Global Header Interactive Controls
  function initGlobalHeaderControls() {
    // 1. Global Search Bar
    const searchInputs = document.querySelectorAll('header input[placeholder*="Search" i]');
    searchInputs.forEach(function(input) {
      if (!input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            const q = input.value.trim();
            if (q) window.location.href = '/ai-mentor?query=' + encodeURIComponent(q);
          }
        });
      }
    });

    // 2. Dynamic Notifications Bell
    const bellBtn = Array.from(document.querySelectorAll('header button')).find(btn => 
      btn.querySelector('svg path[d*="18 8"]') || 
      btn.querySelector('svg path[d*="M15 17h5"]') || 
      btn.nextElementSibling?.classList.contains('bg-red-600') || 
      btn.nextElementSibling?.classList.contains('bg-amber-600')
    );

    if (bellBtn && !bellBtn.dataset.bound) {
      bellBtn.dataset.bound = 'true';
      bellBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNotificationDropdown(bellBtn);
      });
    }

    // 3. Language Switcher (EN / TE)
    const langBtn = Array.from(document.querySelectorAll('header button, header div')).find(el => 
      el.textContent.includes('EN') && el.textContent.includes('తెలుగు')
    );
    if (langBtn && !langBtn.dataset.bound) {
      langBtn.dataset.bound = 'true';
      langBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const activeLang = localStorage.getItem('margdarshak_lang') || 'EN';
        const nextLang = activeLang === 'EN' ? 'TE' : 'EN';
        localStorage.setItem('margdarshak_lang', nextLang);
        showToast('info', nextLang === 'TE' ? 'భాష తెలుగు మార్చబడింది (Language: Telugu)' : 'Language switched to English');
      });
    }

    // 4. Dark / Light Theme Toggle
    const themeBtn = Array.from(document.querySelectorAll('header button')).find(btn => 
      btn.title?.toLowerCase().includes('theme') || btn.querySelector('svg path[d*="M12 3v1"]')
    );
    if (themeBtn && !themeBtn.dataset.bound) {
      themeBtn.dataset.bound = 'true';
      themeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const currentTheme = localStorage.getItem('margdarshak_theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('margdarshak_theme', nextTheme);
        applyStoredPreferences();
        showToast('info', `Theme preference updated: ${nextTheme.toUpperCase()}`);
      });
    }
  }

  // Fetch & Render Live Notifications
  function toggleNotificationDropdown(bellBtn) {
    let panel = document.getElementById('notifications-dropdown-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'notifications-dropdown-panel';
      panel.className = 'fixed bg-[#1a1d26] text-gray-200 border border-[#2f3545] rounded-xl shadow-2xl z-[9999] p-3 text-xs select-none w-80 max-w-[calc(100vw-24px)] transition-all hidden';
      document.body.appendChild(panel);

      document.addEventListener('click', function(e) {
        if (!panel.classList.contains('hidden')) {
          if (bellBtn && (bellBtn === e.target || bellBtn.contains(e.target))) return;
          if (panel.contains(e.target)) return;
          panel.classList.add('hidden');
        }
      });
    }

    apiFetch('/api/notifications').then(function(data) {
      const notifs = data.notifications || [];
      const unreadCount = data.unreadCount || 0;

      panel.innerHTML = `
        <div class="flex items-center justify-between border-b border-[#2d3345] pb-2 mb-2">
          <div class="font-bold text-white text-xs flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke-width="2"></path></svg>
            <span>User Notifications</span>
          </div>
          <span class="px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded font-bold uppercase">${unreadCount} Unread</span>
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
          ${notifs.map(n => `
            <div class="p-2.5 bg-[#13151c] rounded-lg border border-[#292e3d]">
              <div class="font-semibold text-white text-[11px]">${n.title}</div>
              <div class="text-[10px] text-gray-400 mt-0.5 leading-relaxed">${n.message}</div>
            </div>
          `).join('')}
        </div>
      `;

      if (bellBtn) {
        const rect = bellBtn.getBoundingClientRect();
        panel.style.top = (rect.bottom + 8) + 'px';
        panel.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
      }

      panel.classList.toggle('hidden');
    });
  }

  // 1. LANDING PAGE
  function initLandingPage() {
    document.querySelectorAll('a[href="#login"], a[href="#get-started"], a[href="#start-journey"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/auth/student';
      });
    });
  }

  // 2. STUDENT AUTH SCREEN
  function initRoleTabs(currentRole) {
    const roleSelector = document.getElementById('login-role-selector');
    if (roleSelector) {
      roleSelector.addEventListener('click', function(e) {
        const btn = e.target.closest('button[data-role]');
        if (btn) {
          const role = btn.getAttribute('data-role');
          if (role !== currentRole) {
            if (role === 'student') window.location.assign('/auth/student');
            else if (role === 'mentor') window.location.assign('/auth/mentor-login');
            else if (role === 'admin') window.location.assign('/auth/admin-login');
          }
        }
      });
    }
  }

  function initStudentAuthScreen() {
    initRoleTabs('student');
    const loginForm = document.getElementById('form-login') || document.querySelector('form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInp = document.getElementById('login-email') || loginForm.querySelector('input[type="email"]');
        const passInp = document.getElementById('login-password') || loginForm.querySelector('input[type="password"]');
        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please enter email and password.');
          return;
        }
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        
        apiFetch('/api/auth/login-student', {
          method: 'POST',
          body: { email: emailInp.value.trim(), password: passInp.value }
        }).then(function(res) {
          if (res.success && res.user && res.user.role === 'student') {
            apiFetch('/api/auth/me').then(function(meRes) {
              if (submitBtn) submitBtn.disabled = false;
              if (meRes.authenticated && meRes.user && meRes.user.role === 'student') {
                if (meRes.user.onboardingCompleted) {
                  window.location.assign('/student/dashboard');
                } else {
                  window.location.assign('/onboarding/personal-details');
                }
              } else {
                showToast('error', 'Session verification failed.');
              }
            });
          } else {
            if (submitBtn) submitBtn.disabled = false;
            showToast('error', res.error || 'Invalid student credentials.');
          }
        });
      });
    }

    const regForm = document.getElementById('form-register');
    if (regForm) {
      regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const nameInp = document.getElementById('reg-name') || regForm.querySelector('input[name="fullName"]');
        const emailInp = document.getElementById('reg-email') || regForm.querySelector('input[type="email"]');
        const passInp = document.getElementById('reg-password') || regForm.querySelector('input[type="password"]');
        const phoneInp = document.getElementById('reg-phone') || regForm.querySelector('input[name="phone"]');
        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please fill required fields.');
          return;
        }
        const regBtn = regForm.querySelector('button[type="submit"]');
        if (regBtn) regBtn.disabled = true;
        apiFetch('/api/auth/register-student', {
          method: 'POST',
          body: {
            fullName: nameInp ? nameInp.value.trim() : 'Student',
            email: emailInp.value.trim(),
            password: passInp.value,
            phone: phoneInp ? phoneInp.value.trim() : '+91 9876543210'
          }
        }).then(function(res) {
          if (regBtn) regBtn.disabled = false;
          if (res.success) {
            window.location.assign(res.redirect || '/onboarding/personal-details');
          } else {
            showToast('error', res.error || 'Registration failed.');
          }
        });
      });
    }
  }

  function initMentorAuthScreen() {
    initRoleTabs('mentor');
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInp = loginForm.querySelector('input[type="email"]') || document.getElementById('login-email');
        const passInp = loginForm.querySelector('input[type="password"]') || document.getElementById('login-password');
        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please enter mentor email and password.');
          return;
        }
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        apiFetch('/api/auth/login-mentor', {
          method: 'POST',
          body: { email: emailInp.value.trim(), password: passInp.value }
        }).then(function(res) {
          if (res.success && res.user && res.user.role === 'mentor') {
            apiFetch('/api/auth/me').then(function(meRes) {
              if (submitBtn) submitBtn.disabled = false;
              if (meRes.authenticated && meRes.user && meRes.user.role === 'mentor') {
                window.location.assign('/mentor/dashboard');
              } else {
                showToast('error', 'Session role mismatch.');
              }
            });
          } else {
            if (submitBtn) submitBtn.disabled = false;
            showToast('error', res.error || 'Invalid mentor credentials.');
          }
        });
      });
    }
  }

  function initAdminAuthScreen() {
    initRoleTabs('admin');
    const loginForm = document.getElementById('admin-login-form') || document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInp = loginForm.querySelector('input[type="email"]') || document.getElementById('admin-email');
        const passInp = loginForm.querySelector('input[type="password"]') || document.getElementById('admin-password');
        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please enter admin email and password.');
          return;
        }
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        apiFetch('/api/auth/login-admin', {
          method: 'POST',
          body: { email: emailInp.value.trim(), password: passInp.value }
        }).then(function(res) {
          if (res.success && res.user && res.user.role === 'admin') {
            apiFetch('/api/auth/me').then(function(meRes) {
              if (submitBtn) submitBtn.disabled = false;
              if (meRes.authenticated && meRes.user && meRes.user.role === 'admin') {
                window.location.assign('/admin/portal');
              } else {
                showToast('error', 'Session role mismatch.');
              }
            });
          } else {
            if (submitBtn) submitBtn.disabled = false;
            showToast('error', res.error || 'Invalid admin credentials.');
          }
        });
      });
    }
  }

  // 5. ONBOARDING STEP 1
  function initOnboardingStep1() {
    const nextBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('next'));
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const nameInp = document.querySelector('input[name="fullname"]') || document.querySelector('input[name="fullName"]');
        const phoneInp = document.querySelector('input[type="tel"]') || document.querySelector('input[name="phone"]');
        const stateInp = document.querySelector('select[name="state"]') || document.querySelector('input[name="state"]');
        const distInp = document.querySelector('select[name="district"]') || document.querySelector('input[name="district"]');

        apiFetch('/api/onboarding/step-1', {
          method: 'POST',
          body: {
            fullName: nameInp ? nameInp.value.trim() : undefined,
            phone: phoneInp ? phoneInp.value.trim() : undefined,
            state: stateInp ? stateInp.value : undefined,
            district: distInp ? distInp.value : undefined
          }
        }).then(function(res) {
          if (res.success) window.location.href = '/onboarding/study-details';
        });
      });
    }
  }

  // 6. ONBOARDING STEP 2
  function initOnboardingStep2() {
    const nextBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('next'));
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const classInp = document.querySelector('select[name="currentClass"]') || document.querySelector('input[name="currentClass"]');
        const streamInp = document.querySelector('select[name="stream"]') || document.querySelector('input[name="stream"]');

        apiFetch('/api/onboarding/step-2', {
          method: 'POST',
          body: {
            currentClass: classInp ? classInp.value : undefined,
            stream: streamInp ? streamInp.value : undefined
          }
        }).then(function(res) {
          if (res.success) window.location.href = '/onboarding/interests-aspirations';
        });
      });
    }
  }

  // 7. ONBOARDING STEP 3
  function initOnboardingStep3() {
    const nextBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('next') || (b.textContent || '').toLowerCase().includes('proceed'));
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const checkedInterests = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value || cb.nextElementSibling?.textContent?.trim());

        apiFetch('/api/onboarding/step-3', {
          method: 'POST',
          body: { interests: checkedInterests.length > 0 ? checkedInterests : undefined }
        }).then(function(res) {
          if (res.success) window.location.href = '/onboarding/profile-review';
        });
      });
    }
  }

  // 8. ONBOARDING STEP 4
  function initOnboardingStep4() {
    const completeBtn = document.getElementById('complete-profile-btn') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('complete'));
    const modal = document.getElementById('completion-modal');
    const modalCard = document.getElementById('modal-card');

    if (completeBtn) {
      completeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        completeBtn.disabled = true;
        completeBtn.innerHTML = `
          <svg class="w-5 h-5 text-stone-900 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Creating Your Margdarshak Matrix...</span>
        `;

        apiFetch('/api/onboarding/step-4', { method: 'POST', body: {} }).then(function(res) {
          if (res.success) {
            if (modal && modalCard) {
              modal.classList.remove('opacity-0', 'pointer-events-none');
              modalCard.classList.remove('scale-95');
              modalCard.classList.add('scale-100');
            } else {
              window.location.assign('/student/dashboard');
            }
          } else {
            completeBtn.disabled = false;
            completeBtn.innerHTML = `<span>Complete My Profile & Enter Dashboard</span>`;
          }
        }).catch(function() {
          completeBtn.disabled = false;
          completeBtn.innerHTML = `<span>Complete My Profile & Enter Dashboard</span>`;
        });
      });
    }

    if (modal) {
      const modalBtn = modal.querySelector('a[href], button');
      if (modalBtn) {
        modalBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.assign('/student/dashboard');
        });
      }
    }
  }

  // 9. STUDENT DASHBOARD
  function initStudentDashboard() {
    const heroInput = document.querySelector('input[placeholder*="Ask Margdarshak" i]') || document.querySelector('input[placeholder*="anything" i]');
    const heroSearchBtn = heroInput ? heroInput.parentElement.querySelector('button') : null;

    if (heroSearchBtn) {
      heroSearchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const query = heroInput ? heroInput.value.trim() : '';
        window.location.href = query ? '/ai-mentor?query=' + encodeURIComponent(query) : '/ai-mentor';
      });
    }

    apiFetch('/api/student/dashboard-data').then(function(data) {
      if (!data || !data.profile) return;
      const p = data.profile;

      window.hydrateUI({ id: p.userId, email: p.fullName || "" }, p);
      });


    // Fetch Mentor Widget Data
    apiFetch('/api/student/mentor').then(function(res) {
      const widget = document.getElementById('student-mentor-widget');
      if (!widget) return;
      
      if (res.status === 'NO_MENTOR') {
        widget.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-6 bg-[#fbf9f4] border border-[#e3dacf] rounded-2xl">
            <h3 class="text-lg font-bold text-stone-900 mb-2">My Mentor</h3>
            <p class="text-sm text-stone-600 mb-4">You have not been assigned a human mentor yet.</p>
          </div>
        `;
      } else if (res.status === 'PENDING') {
        widget.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-6 bg-[#fbf9f4] border border-[#e3dacf] rounded-2xl">
            <h3 class="text-lg font-bold text-stone-900 mb-2">My Mentor</h3>
            <p class="text-sm text-stone-600 mb-4">Your mentor assignment is pending. We are finding the best match for you.</p>
          </div>
        `;
      } else if (res.status === 'ASSIGNED') {
        widget.innerHTML = `
          <div class="flex flex-col h-full bg-[#fbf9f4] rounded-2xl">
            <div class="flex items-center justify-between pb-3 border-b border-[#ece4d6]">
              <div class="flex items-center gap-2.5">
                <span class="font-bold text-sm text-stone-900">${res.mentor.name} (My Mentor)</span>
              </div>
              <div class="flex items-center gap-2">
                <button id="btn-request-session" class="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-bold transition">Session</button>
                <button id="btn-ask-doubt" class="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded font-bold transition">Doubt</button>
                <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">ONLINE</span>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto mt-3 space-y-2 text-xs" id="mentor-chat-messages">
              <div class="bg-[#f0e7d5] p-3 rounded-xl rounded-tl-sm text-stone-800 border border-[#ded2bd] shadow-xs">
                Hi! I am ${res.mentor.name}, your assigned mentor. Feel free to ask me any doubts about your career or education!
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <input type="text" id="mentor-chat-input" class="flex-1 border border-[#e3dacf] rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none" placeholder="Message ${res.mentor.name}...">
              <button id="mentor-chat-send" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition">Send</button>
            </div>
          </div>
        `;
        
        // Chat Logic
        const sendBtn = document.getElementById('mentor-chat-send');
        const chatInp = document.getElementById('mentor-chat-input');
        const msgs = document.getElementById('mentor-chat-messages');
        
        function fetchMsgs() {
          apiFetch('/api/student/mentor/messages').then(mRes => {
            if (mRes.success && mRes.messages.length > 0) {
              const html = mRes.messages.map(m => {
                if (m.senderId === res.mentor.id) {
                  return `<div class="bg-[#f0e7d5] p-3 rounded-xl rounded-tl-sm text-stone-800 border border-[#ded2bd] shadow-xs mb-2">${m.message}</div>`;
                } else {
                  return `<div class="bg-[#2c3e50] text-white p-3 rounded-xl rounded-tr-sm shadow-xs mb-2 text-right">${m.message}</div>`;
                }
              }).join('');
              msgs.innerHTML = `<div class="bg-[#f0e7d5] p-3 rounded-xl rounded-tl-sm text-stone-800 border border-[#ded2bd] shadow-xs mb-2">Hi! I am ${res.mentor.name}, your assigned mentor. Feel free to ask me any doubts about your career or education!</div>` + html;
              msgs.scrollTop = msgs.scrollHeight;
            }
          });
        }
        
        fetchMsgs();
        setInterval(fetchMsgs, 5000);
        
        sendBtn.onclick = () => {
          if (!chatInp.value.trim()) return;
          const msg = chatInp.value.trim();
          chatInp.value = '';
          apiFetch('/api/student/mentor/messages', { method: 'POST', body: { message: msg } }).then(() => fetchMsgs());
        };

        const btnSession = document.getElementById('btn-request-session');
        if (btnSession) {
          btnSession.onclick = () => {
            btnSession.textContent = 'Requesting...';
            btnSession.disabled = true;
            apiFetch('/api/student/mentor/sessions', { method: 'POST', body: { topic: 'Career Guidance Session', date: new Date().toISOString().split('T')[0], time: '10:00 AM' } })
              .then(sRes => {
                btnSession.textContent = 'Requested';
                if (window.showToast) showToast('success', 'Session requested successfully!');
              });
          };
        }

        const btnDoubt = document.getElementById('btn-ask-doubt');
        if (btnDoubt) {
          btnDoubt.onclick = () => {
            const question = prompt('What is your doubt?');
            if (!question) return;
            btnDoubt.textContent = 'Submitting...';
            btnDoubt.disabled = true;
            apiFetch('/api/student/mentor/doubts', { method: 'POST', body: { title: 'Doubt', description: question, category: 'General' } })
              .then(dRes => {
                btnDoubt.textContent = 'Doubt Sent';
                if (window.showToast) showToast('success', 'Doubt submitted successfully!');
              });
          };
        }
      }
    });

  }

  // 10. CAREER GUIDANCE
  function initCareerGuidance() {
    apiFetch('/api/career-guidance/recommendations').then(function(data) {
      if (!data || !data.recommendations) return;
      console.log('Career Guidance Recommendations Loaded:', data.recommendations.length);
    });
  }

  // 11. SKILL DEVELOPMENT
  function initSkillDevelopment() {
    apiFetch('/api/skills').then(function(data) {
      if (!data || !data.skills) return;
      console.log('Skills Loaded:', data.skills.length);
    });
  }

  // 12. COURSES & COLLEGES
  function initCoursesColleges() {
    apiFetch('/api/courses-colleges').then(function(data) {
      if (!data) return;
      console.log('Courses & Colleges Loaded:', data.courses?.length, data.colleges?.length);
    });
  }

  // 13. SCHOLARSHIPS
  function initScholarships() {
    apiFetch('/api/scholarships').then(function(data) {
      if (!data || !data.scholarships) return;
      console.log('Scholarships Loaded:', data.scholarships.length);
    });
  }

  // 14. JOBS & INTERNSHIPS
  function initJobsInternships() {
    apiFetch('/api/jobs-internships').then(function(data) {
      if (!data) return;
      console.log('Jobs & Internships Loaded:', data.jobs?.length, data.internships?.length);
    });
  }

  // 15. AI MENTOR CHAT
    function initAiMentor() {
    const chatInput = document.querySelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]');
    const sendBtn = document.querySelector('button[title*="Voice input"]') ? document.querySelector('button[title*="Voice input"]').nextElementSibling : null;
    const messageContainer = document.getElementById('ai-chat-container') || document.querySelector('.space-y-4');
    let currentConversationId = null;

    if (!messageContainer) return;

    // Load initial context and conversations
    messageContainer.innerHTML = '<div class="flex justify-center py-20"><div class="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div></div>';
    
    // Load student context for the sidebar
    apiFetch('/api/student/ai-mentor/context').then(res => {
      if (res.success && res.context) {
        const ctx = res.context;
        const eName = document.getElementById('ai-student-name');
        const eCourse = document.getElementById('ai-student-course');
        const eCollege = document.getElementById('ai-student-college');
        const eMarks = document.getElementById('ai-student-marks');
        const eGoal = document.getElementById('ai-student-goal');
        const eSkills = document.getElementById('ai-student-skills');
        const eBannerName = document.getElementById('ai-banner-name');
        const eBannerLevel = document.getElementById('ai-banner-level');
        
        if (eName) eName.textContent = ctx.user.fullName || 'Student';
        if (eBannerName) eBannerName.textContent = ctx.user.fullName || 'Student';
        if (eBannerLevel) eBannerLevel.textContent = ctx.progress.level || '1';
        if (eCourse) eCourse.textContent = (ctx.education.course && ctx.education.branch) ? (ctx.education.course + ' ' + ctx.education.branch) : 'Not provided';
        if (eCollege) eCollege.textContent = ctx.education.college || 'Not provided';
        if (eMarks) eMarks.textContent = ctx.education.cgpa ? ctx.education.cgpa : 'Not provided';
        if (eGoal) eGoal.textContent = ctx.careerGoals.length ? ctx.careerGoals[0] : 'Not provided';
        if (eSkills) eSkills.textContent = ctx.skills.length ? ctx.skills.slice(0, 3).join(', ') : 'Not provided';
      }
    });

    // Load conversation history
    apiFetch('/api/student/ai-mentor/conversations').then(res => {
      messageContainer.innerHTML = '';
      if (res.success && res.conversations && res.conversations.length > 0) {
        currentConversationId = res.conversations[0].id;
        apiFetch('/api/student/ai-mentor/conversations/' + currentConversationId).then(cRes => {
          if (cRes.success && cRes.messages) {
            if (cRes.messages.length === 0) {
               appendChatMessage('ai', 'Namaskaram! I am your Margdarshak AI Mentor. How can I guide your career today?');
            } else {
               cRes.messages.forEach(m => appendChatMessage(m.sender, m.content));
            }
          }
        });
      } else {
        appendChatMessage('ai', 'Namaskaram! I am your Margdarshak AI Mentor. How can I guide your career today?');
      }
    }).catch(err => {
       messageContainer.innerHTML = '';
       appendChatMessage('ai', 'Error loading history.');
    });

    
    const promptButtons = document.querySelectorAll('button:not([type="submit"]):not([title="Voice input"])');
    promptButtons.forEach(b => {
      if (b.textContent && (b.textContent.includes('?') || b.textContent.includes('Plan') || b.textContent.includes('Explain'))) {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          chatInput.value = b.textContent.trim();
          submitMessage();
        });
      }
    });

    
    const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Clear Chat'));
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
         if (currentConversationId) {
             apiFetch('/api/student/ai-mentor/conversations/' + currentConversationId, { method: 'DELETE' }).then(() => {
                messageContainer.innerHTML = '';
                appendChatMessage('ai', 'Chat history cleared. How can I guide you today?');
                currentConversationId = null;
             });
         } else {
            messageContainer.innerHTML = '';
            appendChatMessage('ai', 'Chat history cleared. How can I guide you today?');
         }
      });
    }


    function setChatBusy(isBusy) {
        if (chatInput) chatInput.disabled = isBusy;
        if (sendBtn) {
            sendBtn.disabled = isBusy;
            if (isBusy) {
                sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    if (sendBtn && chatInput) {
      // Remove any existing disabled state logic bound to input
      
      setChatBusy(false);
      chatInput.addEventListener('input', function() {
          const isEmpty = chatInput.value.trim().length === 0;
          sendBtn.disabled = isEmpty;
          if (isEmpty) {
              sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
              sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
      });
      chatInput.dispatchEvent(new Event('input'));
    

      sendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitMessage();
      });

      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitMessage();
        }
      });
    }

    
    const suggestedPromptButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && (b.textContent.includes('🧭') || b.textContent.includes('⚡') || b.textContent.includes('🎓') || b.textContent.includes('💰') || b.textContent.includes('💼') || b.textContent.includes('📄')));
    suggestedPromptButtons.forEach(b => {
        b.addEventListener('click', function() {
            chatInput.value = this.textContent.trim().replace(/🧭|⚡|🎓|💰|💼|📄/g, '').trim();
            submitMessage();
        });
    });

    function submitMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Save original text in case of error
        const originalText = chatInput.value;
        chatInput.value = '';

        appendChatMessage('user', text);
        
        setChatBusy(true);

        const loadingId = 'loading-' + Date.now();
        appendLoadingBubble(loadingId);

        apiFetch('/api/student/ai-mentor/chat', {
          method: 'POST',
          body: { message: text, conversationId: currentConversationId }
        }).then(function(res) {
          removeLoadingBubble(loadingId);
          setChatBusy(false);
          
          if (res.success && res.message) {
             currentConversationId = res.conversationId;
             appendChatMessage('ai', res.message.content);
          } else {
             appendChatMessage('ai', res.message || res.error || 'Sorry, I am temporarily unavailable.');
             chatInput.value = originalText;
          }
          chatInput.focus(); 
          chatInput.dispatchEvent(new Event('input'));
        }).catch(function(err) {
          removeLoadingBubble(loadingId);
          setChatBusy(false);
          appendChatMessage('ai', err.message || 'Network error reaching AI Mentor.');
          chatInput.value = originalText;
          chatInput.focus(); 
          chatInput.dispatchEvent(new Event('input'));
        });
    }

    function escapeHtml(unsafe) {
      return (unsafe||'').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    
    function formatText(text) {
      // Basic markdown formatting (bold, newlines)
      let formatted = escapeHtml(text);
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return formatted;
    }

    function appendLoadingBubble(id) {
       const bubble = document.createElement('div');
       bubble.id = id;
       bubble.className = 'flex justify-start my-3';
       bubble.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-brand-charcoal text-brand-gold flex items-center justify-center flex-shrink-0 ring-2 ring-[#D4AF37]/30 text-xs font-bold font-serif mr-3">M</div>
        <div class="bg-white rounded-2xl p-4 border border-[#DECDB8] shadow-xs flex items-center space-x-2">
           <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
           <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
           <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
       `;
       messageContainer.appendChild(bubble);
       messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function removeLoadingBubble(id) {
       const el = document.getElementById(id);
       if (el) el.remove();
    }

    function appendChatMessage(sender, msgText) {
      const bubble = document.createElement('div');
      
      if (sender === 'user') {
         bubble.className = 'flex items-start justify-end gap-3 my-4';
         bubble.innerHTML = `
           <div class="max-w-xl bg-[#0f1115] text-[#F8F1E4] rounded-2xl rounded-tr-sm p-4 border border-neutral-700 shadow-sm">
             <p class="text-xs leading-relaxed whitespace-pre-line">${escapeHtml(msgText)}</p>
           </div>
           <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#D4AF37]/60 bg-gray-300"></div>
         `;
      } else {
         bubble.className = 'flex items-start gap-3 my-4';
         bubble.innerHTML = `
           <div class="w-8 h-8 rounded-full bg-[#0f1115] text-[#c99846] flex items-center justify-center flex-shrink-0 ring-2 ring-[#D4AF37]/30 text-xs font-bold font-serif">M</div>
           <div class="max-w-2xl bg-white rounded-2xl rounded-tl-sm p-4 border border-[#DECDB8] shadow-xs">
             <div class="text-xs text-[#3B3224] leading-relaxed whitespace-pre-line">${formatText(msgText)}</div>
           </div>
         `;
      }
      
      messageContainer.appendChild(bubble);
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }

  // 16. RESUME BUILDER
  function initResumeBuilder() {
    const saveBtn = Array.from(document.querySelectorAll('button, a')).find(b => (b.textContent || '').includes('Save') || (b.textContent || '').includes('Draft'));
    const printBtn = Array.from(document.querySelectorAll('button, a')).find(b => (b.textContent || '').includes('Print') || (b.textContent || '').includes('PDF'));

    apiFetch('/api/resume').then(function(data) {
      if (data && data.resume) {
        const r = data.resume;
        const nameInp = document.querySelector('input[placeholder*="Name" i]');
        const emailInp = document.querySelector('input[type="email"]');
        const phoneInp = document.querySelector('input[type="tel"]');
        if (nameInp && r.fullName) nameInp.value = r.fullName;
        if (emailInp && r.email) emailInp.value = r.email;
        if (phoneInp && r.phone) phoneInp.value = r.phone;
      }
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const fullName = document.querySelector('input[placeholder*="Name" i]')?.value || '';
        const email = document.querySelector('input[type="email"]')?.value || '';
        const phone = document.querySelector('input[type="tel"]')?.value || '';
        const summary = document.querySelector('textarea')?.value || '';

        apiFetch('/api/resume', {
          method: 'POST',
          body: { fullName, email, phone, summary }
        }).then(function(res) {
          if (res.success) {
            showToast('success', 'Resume draft saved successfully (+150 XP)');
          }
        });
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.print();
      });
    }
  }

  // 17. CHALLENGES & XP
  function initChallengesXp() {
    apiFetch('/api/challenges-xp').then(function(data) {
      if (!data) return;
      const profile = data.profile || {};
      const xpEl = document.getElementById('user-xp-display');
      if (xpEl) xpEl.textContent = profile.xp + ' XP';
    });

    const startBtn = document.getElementById('btn-start-today-challenge') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Complete') || (b.textContent || '').includes('Start'));
    if (startBtn) {
      startBtn.addEventListener('click', function(e) {
        e.preventDefault();
        apiFetch('/api/challenges/complete', {
          method: 'POST',
          body: { challengeId: 'ch_1' }
        }).then(function(res) {
          if (res.success) {
            showToast('success', `Challenge Completed! +${res.xpEarned} XP Earned.`);
            setTimeout(() => window.location.reload(), 1200);
          }
        });
      });
    }
  }

  // 18. COMMUNITY
  function initCommunity() {
    apiFetch('/api/community/posts').then(function(data) {
      if (!data || !data.posts) return;
      console.log('Community Posts Loaded:', data.posts.length);
    });

    const postBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Post') || (b.textContent || '').includes('Share'));
    const titleInp = document.querySelector('input[placeholder*="title" i]');
    const contentInp = document.querySelector('textarea') || document.querySelector('input[placeholder*="mind" i]');

    if (postBtn && contentInp) {
      postBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const title = titleInp ? titleInp.value.trim() : 'Community Discussion';
        const content = contentInp.value.trim();
        if (!content) return;

        apiFetch('/api/community/posts', {
          method: 'POST',
          body: { title, content }
        }).then(function(res) {
          if (res.success) {
            showToast('success', 'Post published to Margdarshak Community!');
            if (contentInp) contentInp.value = '';
            if (titleInp) titleInp.value = '';
          }
        });
      });
    }
  }

  // 19. RESOURCES
  function initResources() {
    apiFetch('/api/resources').then(function(data) {
      if (!data || !data.resources) return;
      console.log('Resources Loaded:', data.resources.length);
    });
  }

  // 20. MENTOR DASHBOARD
  function initMentorDashboard() {
    // ── Helper: find and render a panel ─────────────────────────────────────
    function ensureMentorPanel() {
      let panel = document.getElementById('mentor-portal-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'mentor-portal-panel';
        panel.className = 'w-full';
        // Append inside the main content area (not sidebar)
        const mains = document.querySelectorAll('main, .overflow-y-auto, .flex-1');
        let target = null;
        for (const m of mains) {
          if (!m.closest('aside') && !m.closest('nav') && m !== document.body) {
            target = m;
            break;
          }
        }
        if (!target) target = document.body;
        target.appendChild(panel);
      }
      return panel;
    }

    function getMentorContentArea() {
      const mains = document.querySelectorAll('main, .overflow-y-auto, .flex-1');
      for (const m of mains) {
        if (!m.closest('aside') && !m.closest('nav') && m !== document.body) return m;
      }
      return document.body;
    }

    function renderMentorPanel(html) {
      const panel = ensureMentorPanel();
      panel.innerHTML = html;
      panel.style.display = '';
      
      const area = getMentorContentArea();
      if (area && area !== document.body) {
        Array.from(area.children).forEach(child => {
          if (child.id !== 'mentor-portal-panel') {
            child.style.display = 'none';
          }
        });
      }
    }

    function hideMentorPanel() {
      const panel = document.getElementById('mentor-portal-panel');
      if (panel) panel.style.display = 'none';
      
      const area = getMentorContentArea();
      if (area && area !== document.body) {
        Array.from(area.children).forEach(child => {
          if (child.id !== 'mentor-portal-panel') {
            child.style.display = '';
          }
        });
      }
    }

    // ── Route Evaluator ────────────────────────────────────────────────────
    function evaluateMentorRoute() {
      const path = window.location.pathname;
      
      document.querySelectorAll('a[href^="/mentor"]').forEach(l => {
        l.classList.remove('bg-[#2A261D]', 'border', 'border-[#D4AF37]/50', 'text-white');
        l.classList.add('text-gray-400');
        if (l.getAttribute('href') === path) {
          l.classList.add('bg-[#2A261D]', 'border', 'border-[#D4AF37]/50', 'text-white');
          l.classList.remove('text-gray-400');
        }
      });

      switch (path) {
        case '/mentor/students':     renderMentorStudentsPanel(); break;
        case '/mentor/mentorship':   renderMentorMentorshipPanel(); break;
        case '/mentor/appointments': renderMentorAppointmentsPanel(); break;
        case '/mentor/resources':    renderMentorResourcesPanel(); break;
        case '/mentor/progress':     renderMentorProgressPanel(); break;
        case '/mentor/community':    renderMentorCommunityPanel_Phase5C(); break;
        case '/mentor/messages':     renderMentorMessagesPanel(); break;
        case '/mentor/profile':      renderMentorProfilePanel(); break;
        case '/mentor/dashboard':
        default:                     hideMentorPanel(); loadMentorDashboard();
      }
    }

    // ── SPA Click Handler ────────────────────────────────────────────────
    document.querySelectorAll('a[href^="/mentor"]').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = link.getAttribute('href');
        if (href.startsWith('/mentor')) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          evaluateMentorRoute();
        }
      });
    });

    // ── Students Panel ────────────────────────────────────────────────────────
    function renderMentorStudentsPanel() {
      renderMentorPanel('<div class="flex items-center justify-center py-16"><div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>');
      apiFetch('/api/mentor/students').then(function(data) {
        const students = (data && data.students) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-5">My Students <span class="text-sm font-normal text-gray-400">(${students.length} assigned)</span></h2>
            ${students.length === 0
              ? '<div class="py-12 text-center text-gray-400">No students assigned yet.</div>'
              : students.map(s => {
                  const safeName = s.fullName ? s.fullName : 'Student';
                  const initials = safeName.substring(0,2).toUpperCase();
                  return `
                  <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl flex items-center justify-between mb-3 shadow-xs">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm flex items-center justify-center border border-amber-500/30">
                        ${initials}
                      </div>
                      <div>
                        <div class="font-bold text-white text-sm">${safeName}</div>
                        <div class="text-[11px] text-gray-400">${s.stream || 'General'} • ${s.district || 'Unspecified'}</div>
                        <div class="text-[11px] text-gray-500 mt-0.5">${s.email}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="text-right hidden md:block">
                        <div class="text-[11px] text-amber-400 font-semibold">${s.xp || 0} XP</div>
                        <div class="text-[10px] text-gray-400">Level ${s.level || 1}</div>
                      </div>
                      <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded text-[10px] border border-emerald-500/20">Active Mentee</span>
                      <button class="px-3 py-1.5 bg-[#292e3d] hover:bg-[#343b4d] text-white text-[10px] font-bold rounded transition" onclick="showToast('info', 'Messaging coming soon')">Message</button>
                    </div>
                  </div>`
                }).join('')}
          </div>
        `);
      });
    }

    // ── Mentorship Panel ──────────────────────────────────────────────────────
    function renderMentorMentorshipPanel() {
      apiFetch('/api/mentor/doubts').then(function(data) {
        const doubts = (data && data.doubts) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-5">Mentorship — Open Doubts <span class="text-sm font-normal text-gray-400">(${doubts.length} pending)</span></h2>
            ${doubts.length === 0
              ? '<div class="py-12 text-center text-gray-400">No open doubts from your students.</div>'
              : doubts.filter(d => d.status !== 'closed').map(d => `
                <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl mb-3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="font-bold text-amber-300 text-sm">${d.title || 'Doubt'}</div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${d.status === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">${d.status || 'open'}</span>
                  </div>
                  <div class="text-xs text-gray-300 mb-2">${d.description || ''}</div>
                  ${d.status === 'open' ? `
                    <div class="mt-2">
                      <textarea id="ans-${d.id}" placeholder="Your answer..." class="w-full bg-[#0d0f14] border border-[#292e3d] text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" rows="2"></textarea>
                      <button data-answer-doubt="${d.id}" class="btn-answer-doubt mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition">Submit Answer</button>
                    </div>
                  ` : (d.answer ? `<div class="text-xs text-gray-400 mt-2 border-t border-[#292e3d] pt-2">Your answer: ${d.answer}</div>` : '')}
                </div>
              `).join('')}
          </div>
        `);
        document.querySelectorAll('.btn-answer-doubt').forEach(btn => {
          btn.onclick = function() {
            const dId = btn.getAttribute('data-answer-doubt');
            const ans = document.getElementById('ans-' + dId);
            if (!ans || !ans.value.trim()) return;
            apiFetch('/api/mentor/doubts/' + dId + '/answer', {
              method: 'POST', body: { answer: ans.value.trim() }
            }).then(res => {
              showToast(res.success ? 'success' : 'error', res.success ? 'Answer submitted!' : (res.error || 'Failed'));
              if (res.success) renderMentorMentorshipPanel();
            });
          };
        });
      });
    }

    // ── Appointments Panel ────────────────────────────────────────────────────
    function renderMentorAppointmentsPanel() {
      apiFetch('/api/mentor/sessions').then(function(data) {
        const sessions = (data && data.sessions) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-5">Session Requests & Appointments <span class="text-sm font-normal text-gray-400">(${sessions.length} total)</span></h2>
            ${sessions.length === 0
              ? '<div class="py-12 text-center text-gray-400">No session requests yet.</div>'
              : sessions.map(s => `
                <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl mb-3 flex items-center justify-between">
                  <div>
                    <div class="font-bold text-amber-300 text-sm">${s.topic || 'Session Request'}</div>
                    <div class="text-xs text-gray-400 mt-0.5">Preferred: ${s.preferredDate || 'TBD'} at ${s.preferredTime || 'TBD'}</div>
                    <div class="text-xs text-gray-500 mt-0.5">Student: ${s.studentId || 'Unknown'}</div>
                  </div>
                  <div class="flex flex-col gap-1 items-end">
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : s.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-400'}">${s.status || 'pending'}</span>
                    ${s.status === 'pending' ? `
                      <div class="flex gap-1 mt-1">
                        <button data-session-action="confirm" data-session-id="${s.id}" class="btn-session-action px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition">Confirm</button>
                        <button data-session-action="cancel" data-session-id="${s.id}" class="btn-session-action px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-300 font-bold text-[10px] rounded border border-red-700 transition">Cancel</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
          </div>
        `);
        document.querySelectorAll('.btn-session-action').forEach(btn => {
          btn.onclick = function() {
            const action = btn.getAttribute('data-session-action');
            const sId = btn.getAttribute('data-session-id');
            apiFetch('/api/mentor/sessions/' + sId + '/respond', {
              method: 'PUT', body: { status: action === 'confirm' ? 'confirmed' : 'cancelled' }
            }).then(res => {
              showToast(res.success ? 'success' : 'error', res.success ? 'Session ' + action + 'ed!' : (res.error || 'Failed'));
              if (res.success) renderMentorAppointmentsPanel();
            });
          };
        });
      });
    }

    // ── Messages Panel ────────────────────────────────────────────────────────
    
    // ── Mentor Community Panel ────────────────────────────────────────────────
    function renderMentorCommunityPanel() {
      renderMentorPanel(`
        <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
          <h2 class="text-lg font-bold text-white mb-5">Mentor Community</h2>
          <div class="bg-[#181a21] border border-[#292e3d] rounded-xl p-8 text-center shadow-xs">
            <div class="text-gray-400 font-medium mb-2">No active discussions.</div>
            <button class="mt-4 px-4 py-2 bg-amber-500 text-[#12141A] font-bold text-xs rounded-xl transition hover:bg-amber-400">Start a Discussion</button>
          </div>
        </div>
      `);
    }

    // ── Progress Panel ────────────────────────────────────────────────────────
    function renderMentorProgressPanel() {
      renderMentorPanel('<div class="flex items-center justify-center py-16"><div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>');
      apiFetch('/api/mentor/students').then(function(data) {
        const students = (data && data.students) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <div class="flex justify-between items-center mb-5">
              <h2 class="text-lg font-bold text-white">Student Progress Tracking</h2>
              <div class="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Average XP: ${Math.round(students.reduce((a, b) => a + (b.xp||0), 0) / (students.length || 1))}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${students.length === 0
              ? '<div class="py-12 text-center text-gray-400 col-span-2">No students to track.</div>'
              : students.map(s => `
                <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl mb-3">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">${(s.fullName||'S').substring(0,2).toUpperCase()}</div>
                      <div>
                        <div class="font-bold text-white text-sm">${s.fullName || 'Student'}</div>
                        <div class="text-xs text-gray-400">Target: ${s.careerGoal || 'Not specified'}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-amber-400 font-bold text-sm">${s.xp || 0} XP</div>
                      <div class="text-gray-400 text-xs">Level ${s.level || 1}</div>
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-xs text-gray-400"><span>Roadmap Progress</span><span>${Math.min(100, Math.round(((s.xp || 0)/1000)*100))} %</span></div>
                    <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-amber-500 rounded-full" style="width:${Math.min(100, ((s.xp || 0)/1000)*100)}%"></div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `);
      });
    }

    // ── Profile Panel ─────────────────────────────────────────────────────────
    
    function renderMentorMessagesPanel() {
      renderMentorPanel('<div class="flex items-center justify-center py-16"><div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>');
      apiFetch('/api/mentor/students').then(function(data) {
        const students = (data && data.students) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6 flex flex-col md:flex-row gap-6 min-h-[600px] h-full">
            <div class="w-full md:w-1/3 border-r border-[#292e3d] pr-6 flex flex-col h-[550px]">
              <h2 class="text-lg font-bold text-white mb-5">Messages</h2>
              <div class="space-y-2 overflow-y-auto flex-1">
                ${students.length === 0 ? '<div class="text-gray-500 text-sm">No assigned students.</div>' : students.map(s => `
                  <div data-student-id="${s.id}" data-student-name="${s.fullName || 'Student'}" class="mentor-student-chat-item p-3 bg-[#181a21] border border-[#292e3d] rounded-xl cursor-pointer hover:border-amber-500/50 transition">
                    <div class="font-bold text-sm text-white">${s.fullName || 'Student'}</div>
                    <div class="text-xs text-gray-500 truncate">Select to view conversation</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="w-full md:w-2/3 flex flex-col h-[550px]">
              <div id="mentor-chat-header" class="pb-3 border-b border-[#292e3d] mb-3 hidden">
                <h3 class="text-white font-bold" id="mentor-chat-title"></h3>
              </div>
              <div id="mentor-chat-messages" class="flex-1 overflow-y-auto space-y-2 pr-2 text-sm">
                <div class="h-full flex items-center justify-center text-gray-500">
                  Select a conversation to start messaging.
                </div>
              </div>
              <div class="mt-4 pt-4 border-t border-[#292e3d] flex gap-3">
                <input type="text" id="mentor-chat-input" placeholder="Type your message..." class="flex-1 bg-[#181a21] border border-[#292e3d] rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500/50" disabled>
                <button id="mentor-chat-send" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#12141A] font-bold rounded-xl transition" disabled>Send</button>
              </div>
            </div>
          </div>
        `);

        let activeStudentId = null;
        let fetchInterval = null;

        function loadConvo() {
          if (!activeStudentId) return;
          apiFetch('/api/mentor/messages').then(mRes => {
            if (mRes.success) {
              const msgs = mRes.messages.filter(m => m.studentId === activeStudentId);
              const container = document.getElementById('mentor-chat-messages');
              if (msgs.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-center py-4 text-xs">No messages yet.</div>';
              } else {
                container.innerHTML = msgs.map(m => {
                  if (m.senderId === activeStudentId) {
                    return `<div class="bg-[#181a21] text-gray-300 p-3 rounded-xl rounded-tl-sm border border-[#292e3d] mb-2">${m.message}</div>`;
                  } else {
                    return `<div class="bg-amber-500/10 text-amber-100 p-3 rounded-xl rounded-tr-sm border border-amber-500/30 mb-2 text-right">${m.message}</div>`;
                  }
                }).join('');
                container.scrollTop = container.scrollHeight;
              }
            }
          });
        }

        document.querySelectorAll('.mentor-student-chat-item').forEach(item => {
          item.onclick = function() {
            document.querySelectorAll('.mentor-student-chat-item').forEach(i => i.classList.remove('border-amber-500/50', 'bg-[#1c1e26]'));
            item.classList.add('border-amber-500/50', 'bg-[#1c1e26]');
            
            activeStudentId = item.getAttribute('data-student-id');
            const sName = item.getAttribute('data-student-name');
            
            document.getElementById('mentor-chat-header').classList.remove('hidden');
            document.getElementById('mentor-chat-title').textContent = 'Chat with ' + sName;
            
            const inp = document.getElementById('mentor-chat-input');
            const btn = document.getElementById('mentor-chat-send');
            inp.disabled = false;
            btn.disabled = false;
            inp.focus();

            loadConvo();
            if (fetchInterval) clearInterval(fetchInterval);
            fetchInterval = setInterval(loadConvo, 5000);
          };
        });

        const btn = document.getElementById('mentor-chat-send');
        const inp = document.getElementById('mentor-chat-input');
        if (btn && inp) {
          btn.onclick = () => {
            if (!activeStudentId || !inp.value.trim()) return;
            const msg = inp.value.trim();
            inp.value = '';
            apiFetch('/api/mentor/messages', { method: 'POST', body: { studentId: activeStudentId, message: msg } })
              .then(() => loadConvo());
          };
          inp.onkeypress = (e) => {
            if (e.key === 'Enter') btn.click();
          };
        }
      });
    }


    function renderMentorProfilePanel() {
      apiFetch('/api/mentor/dashboard-data').then(function(data) {
        const mp = data && data.mentorProfile || {};
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-5">My Profile</h2>
            <div class="flex items-center gap-4 mb-6 p-4 bg-[#181a21] border border-[#292e3d] rounded-xl">
              <div class="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 font-black text-xl flex items-center justify-center border-2 border-amber-500/40">${(mp.fullName || 'M').substring(0,2).toUpperCase()}</div>
              <div>
                <div class="font-bold text-white text-lg">${mp.fullName || 'Mentor'}</div>
                <div class="text-sm text-amber-400">${mp.designation || 'Career Mentor'}</div>
                <div class="text-xs text-gray-400 mt-0.5">${mp.organization || 'Margdarshak'}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl">
                <div class="text-xs text-gray-400 mb-1">Experience</div>
                <div class="font-bold text-white">${mp.experienceYears || 0} Years</div>
              </div>
              <div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl">
                <div class="text-xs text-gray-400 mb-1">Total Sessions</div>
                <div class="font-bold text-white">${mp.totalSessions || 0}</div>
              </div>
              <div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl">
                <div class="text-xs text-gray-400 mb-1">Rating</div>
                <div class="font-bold text-amber-400">⭐ ${mp.rating || '4.8'}</div>
              </div>
              <div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl">
                <div class="text-xs text-gray-400 mb-1">Languages</div>
                <div class="font-bold text-white text-xs">${mp.languages ? mp.languages.join(', ') : 'English'}</div>
              </div>
            </div>
            ${mp.bio ? `<div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl"><div class="text-xs text-gray-400 mb-1">Bio</div><div class="text-sm text-gray-300">${mp.bio}</div></div>` : ''}
            ${mp.expertise ? `<div class="p-3 bg-[#181a21] border border-[#292e3d] rounded-xl mt-3"><div class="text-xs text-gray-400 mb-2">Expertise</div><div class="flex flex-wrap gap-2">${mp.expertise.map(e => `<span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">${e}</span>`).join('')}</div></div>` : ''}
          </div>
        `);
      });
    }

    // ── Resources Panel ───────────────────────────────────────────────────────
    function renderMentorResourcesPanel() {
      apiFetch('/api/resources').then(function(data) {
        const resources = (data && data.resources) || [];
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-5">Learning Resources</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${resources.length === 0
                ? '<div class="py-12 text-center text-gray-400 col-span-2">No resources available yet.</div>'
                : resources.map(r => `
                  <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl">
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">PDF</div>
                      <div>
                        <div class="font-bold text-white text-sm">${r.title}</div>
                        <div class="text-xs text-gray-400 mt-0.5">${r.type} · ${r.category}</div>
                        <div class="text-xs text-gray-500 mt-1">${r.description}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
        `);
      });
    }

    // ── Initial Dashboard Load ────────────────────────────────────────────────
    function loadMentorDashboard() {
      apiFetch('/api/mentor/dashboard-data').then(function(data) {
        if (!data || !data.mentorProfile) return;
        const capacity = data.capacity || { assignedCount: 0, maxCapacity: 5 };
        const assignedStudents = data.assignedStudents || [];
        const metrics = data.metrics || { totalMentees: 0, activeMentees: 0, sessionsThisWeek: 0, questionsToAnswer: 0 };

        const pad = n => (n < 10 ? '0' + n : '' + n);
        const binds = {
          'mentor.fullName': data.mentorProfile.fullName,
          'metric.totalMentees': pad(metrics.totalMentees),
          'metric.activeMentees': pad(metrics.activeMentees),
          'metric.sessionsThisWeek': pad(metrics.sessionsThisWeek),
          'metric.questionsToAnswer': pad(metrics.questionsToAnswer)
        };
        Object.keys(binds).forEach(key => {
          document.querySelectorAll('[data-bind="' + key + '"]').forEach(el => el.textContent = binds[key]);
        });

        // Populate students in main dashboard
        const studentSectionTitle = Array.from(document.querySelectorAll('h3')).find(h =>
          (h.textContent || '').includes('Students Who Need Your Attention')
        );
        if (studentSectionTitle) {
          const listContainer = studentSectionTitle.nextElementSibling ||
            (studentSectionTitle.closest('section') && studentSectionTitle.closest('section').querySelector('.space-y-4'));
          if (listContainer) {
            if (assignedStudents.length === 0) {
              listContainer.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">No active mentees assigned yet.</div>';
            } else {
              listContainer.innerHTML = assignedStudents.map(s => `
                <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl flex items-center justify-between text-xs text-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30">
                      ${s.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div class="font-bold text-white text-sm">${s.fullName}</div>
                      <div class="text-[11px] text-gray-400">${s.stream || ''} • ${s.district || ''}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px] border border-emerald-500/30">Active Mentee</span>
                    <div class="text-[10px] text-amber-400 font-semibold mt-1">${s.xp || 0} XP</div>
                  </div>
                </div>
              `).join('');
            }
          }
        }
      });
    }

    // Initial load
    window.addEventListener('popstate', evaluateMentorRoute);
    evaluateMentorRoute();
  }
  
    // --- PHASE 5C MENTOR FUNCTIONS ---
    function renderMentorCommunityPanel_Phase5C() {
      renderMentorPanel('<div class="flex items-center justify-center py-16"><div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>');
      apiFetch('/api/community/posts').then(function(data) {
        const posts = (data && data.posts) || [];
        const visiblePosts = posts.filter(p => p.status !== 'hidden');
        renderMentorPanel(`
          <div class="bg-[#12141A] border border-[#1E2230] rounded-2xl p-6">
            <div class="flex justify-between items-center mb-5">
              <h2 class="text-lg font-bold text-white">Mentor Community <span class="text-sm font-normal text-gray-500">(${visiblePosts.length} posts)</span></h2>
              <button class="btn-create-post px-4 py-2 bg-amber-500 text-[#12141A] font-bold text-xs rounded-xl transition hover:bg-amber-400">+ New Discussion</button>
            </div>
            <div class="space-y-4">
              ${visiblePosts.length === 0 ? '<div class="text-gray-400 font-medium py-12 text-center">No active discussions.</div>' : visiblePosts.map(p => `
                <div class="bg-[#181a21] border border-[#292e3d] rounded-xl p-5 shadow-xs">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-amber-300 text-sm">${p.title}</h3>
                    <span class="text-xs text-gray-500">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div class="text-gray-300 text-xs mb-3">${p.content}</div>
                  <div class="text-gray-500 text-[10px]">By ${p.authorName || 'Mentor'} • ${p.comments ? p.comments.length : 0} Comments</div>
                </div>
              `).join('')}
            </div>
          </div>
        `);

        const createBtn = document.querySelector('.btn-create-post');
        if (createBtn) {
          createBtn.onclick = () => {
            const title = prompt('Enter discussion title:');
            if (!title) return;
            const content = prompt('Enter discussion details:');
            if (!content) return;
            apiFetch('/api/community/posts', { method: 'POST', body: { title, content } }).then(renderMentorCommunityPanel_Phase5C);
          };
        }
      });
    }
  // 21. ADMIN PORTAL
  function initAdminPortal() {
    // ── Sidebar Nav: intercept hash links and show panels ──────────────────
    function activateSidebarLink(path) {
      document.querySelectorAll('a[href^="/admin"]').forEach(link => {
        const isActive = link.getAttribute('href') === path;
        link.classList.toggle('bg-[#2A261D]', isActive);
        link.classList.toggle('border', isActive);
        link.classList.toggle('border-[#D4AF37]/40', isActive);
        link.classList.toggle('text-white', isActive);
        link.classList.toggle('font-medium', isActive);
        link.classList.toggle('text-gray-400', !isActive);
      });
    }

    const mainContentArea = document.querySelector('main') ||
      document.querySelector('.flex-1') ||
      document.querySelector('[class*="main"]') ||
      document.getElementById('students-section')?.closest('section') ||
      document.getElementById('students-section')?.parentElement;

    function getPortalContentArea() {
      // Find the main workspace container which holds the dashboard
      const main = document.querySelector('main');
      if (main) {
        // The dashboard is wrapped in max-w-[1400px] which is the direct child of main
        const wrapper = main.querySelector('.max-w-\\[1400px\\]') || main.firstElementChild;
        if (wrapper) return wrapper;
        return main;
      }
      return document.body;
    }

    // ── Main Panel Renderer ──────────────────────────────────────────────────
    let panelContainer = null;

    function ensurePortalPanel() {
      let panel = document.getElementById('admin-portal-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'admin-portal-panel';
        panel.className = 'w-full animate-fade-in';
        
        const area = getPortalContentArea();
        if (area) {
          // Always insert it at the very top of the content area
          area.prepend(panel);
        } else {
          document.body.appendChild(panel);
        }
      }
      return panel;
    }

    function renderPanel(html) {
      const panel = ensurePortalPanel();
      panel.innerHTML = html;
      panel.style.display = '';
      
      const area = getPortalContentArea();
      if (area) {
        Array.from(area.children).forEach(child => {
          if (child.id !== 'admin-portal-panel') {
            child.style.display = 'none';
          }
        });
      }
    }

    function showDashboard() {
      const panel = document.getElementById('admin-portal-panel');
      if (panel) panel.style.display = 'none';
      
      const area = getPortalContentArea();
      if (area) {
        Array.from(area.children).forEach(child => {
          if (child.id !== 'admin-portal-panel') {
            child.style.display = '';
          }
        });
      }
      loadDashboardData();
    }

    function loadDashboardData() {
      apiFetch('/api/admin/dashboard-data').then(data => {
        if (!data || !data.metrics) return;
        const area = getPortalContentArea();
        
        // Update data-binds globally in the portal
        document.querySelectorAll('[data-bind]').forEach(el => {
          const bindPath = el.getAttribute('data-bind');
          if (bindPath.startsWith('metrics.')) {
            const key = bindPath.split('.')[1];
            if (data.metrics[key] !== undefined) {
              el.textContent = data.metrics[key].toLocaleString();
            }
          }
        });
      }).catch(err => console.error(err));
    }

    // ── Sidebar click handler ────────────────────────────────────────────────
    
    function evaluateAdminRoute() {
      const path = window.location.pathname;
      activateSidebarLink(path);
      
      switch (path) {
        case '/admin/students': renderRobustStudents(); break;
        case '/admin/mentors': renderRobustMentors(); break;
        case '/admin/content': renderRobustContent(); break;
        case '/admin/scholarships': renderRobustScholarships(); break;
        case '/admin/jobs': renderRobustJobs(); break;
        case '/admin/community': renderRobustCommunity(); break;
        case '/admin/reports': renderRobustReports(); break;
        case '/admin/notifications': renderRobustNotifications(); break;
        case '/admin/settings': renderRobustSettings(); break;
        case '/admin/portal':
        default:
          showDashboard();
      }
    }

    function renderLoading() {
      renderPanel('<div class="flex items-center justify-center py-16"><div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>');
    }

    function renderError(msg) {
      renderPanel('<div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]"><h2 class="text-lg font-bold text-red-600 mb-2">Error</h2><div class="py-4 text-gray-700">' + msg + '</div></div>');
    }

    function renderRobustStudents() {
      renderLoading();
      apiFetch('/api/admin/students')
        .then(res => {
          let students = Array.isArray(res) ? res : (res.students || []);
          
          const columnsHtml = `
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">Stream</th>
            <th class="px-4 py-3">District</th>
            <th class="px-4 py-3">XP</th>
            <th class="px-4 py-3">Mentor</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 text-right">Actions</th>
          `;

          const renderRow = s => `
            <tr class="hover:bg-[#FAF7F2] transition-colors border-b border-[#E8E0D4] last:border-0">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#2A261D] text-[#D4AF37] text-xs font-bold flex items-center justify-center">${(s.fullName||'ST').substring(0,2).toUpperCase()}</div>
                  <div>
                    <div class="font-bold text-[#0D0F12]">${s.fullName||'Unknown'}</div>
                    <div class="text-[10px] text-gray-400">${s.email||''}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-xs font-semibold">${s.stream||'General'}</td>
              <td class="px-4 py-3 text-xs text-gray-500">${s.district||'Telangana'}</td>
              <td class="px-4 py-3 text-xs font-bold text-amber-600">${s.xp||0} XP</td>
              <td class="px-4 py-3 text-xs">${s.assignedMentor ? s.assignedMentor.mentorName : '<span class="text-gray-400 italic">Unassigned</span>'}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.assignmentStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                  ${s.assignmentStatus === 'active' ? 'Assigned' : 'Pending'}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button data-view-student="${s.studentId}" class="btn-view-student text-[11px] font-bold text-amber-600 hover:text-amber-700 px-2">View</button>
              </td>
            </tr>
          `;

          const panel = ensurePortalPanel();
          panel.innerHTML = '<div id="students-paginated-container"></div>';
          panel.style.display = '';
          
          const area = getPortalContentArea();
          if (area) {
            Array.from(area.children).forEach(child => {
              if (child.id !== 'admin-portal-panel') {
                child.style.display = 'none';
              }
            });
          }

          window.renderPaginatedTable('students-paginated-container', students, renderRow, columnsHtml, 'Students', 'margdarshak_students.csv');
        })
        .catch(err => renderError('Unable to load students. Retry.'));
    }

    function renderRobustMentors() {
      renderLoading();
      apiFetch('/api/admin/mentors')
        .then(res => {
          let mentors = Array.isArray(res) ? res : (res.mentors || []);
          
          const columnsHtml = `
            <th class="px-4 py-3">Mentor</th>
            <th class="px-4 py-3">Specialization</th>
            <th class="px-4 py-3">Students</th>
            <th class="px-4 py-3">Capacity</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 text-right">Actions</th>
          `;
          
          const renderRow = m => `
            <tr class="hover:bg-[#FAF7F2] transition-colors border-b border-[#E8E0D4] last:border-0">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#2A261D] text-[#D4AF37] text-xs font-bold flex items-center justify-center">${(m.fullName||'MN').substring(0,2).toUpperCase()}</div>
                  <div>
                    <div class="font-bold text-[#0D0F12]">${m.fullName||'Unknown'}</div>
                    <div class="text-[10px] text-gray-400">${m.email||''}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-xs font-semibold">${m.specialization||'General'}</td>
              <td class="px-4 py-3 text-xs text-gray-500">${m.assignedCount||0} students</td>
              <td class="px-4 py-3 text-xs font-bold">${m.capacity||5} max</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'active' || m.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">
                  ${m.status === 'active' || m.status === 'available' ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button class="text-[11px] font-bold text-amber-600 hover:text-amber-700 px-2">View</button>
              </td>
            </tr>
          `;

          const headerActions = `<button onclick="showAddMentorModal()" class="px-4 py-2 bg-[#2A261D] hover:bg-[#3d3825] text-[#D4AF37] font-bold text-xs rounded-xl shadow">+ Create Mentor</button>`;

          const panel = ensurePortalPanel();
          panel.innerHTML = '<div id="mentors-paginated-container"></div>';
          panel.style.display = '';
          
          const area = getPortalContentArea();
          if (area) {
            Array.from(area.children).forEach(child => {
              if (child.id !== 'admin-portal-panel') {
                child.style.display = 'none';
              }
            });
          }

          window.renderPaginatedTable('mentors-paginated-container', mentors, renderRow, columnsHtml, 'Mentor Management', 'margdarshak_mentors.csv', headerActions);
        })
        .catch(err => renderError('Unable to load mentors. Retry.'));
    }

    function renderRobustContent() {
      renderLoading();
      apiFetch('/api/admin/resources')
        .then(res => {
          let list = Array.isArray(res) ? res : (res.resources || []);
          let tableRows = list.length === 0 
            ? '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">No resources found.</td></tr>' 
            : list.map(r => `
              <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td class="px-4 py-3"><div class="font-bold text-gray-900">${r.title||''}</div><div class="text-[10px] text-gray-400">${r.author||''}</div></td>
                <td class="px-4 py-3 text-xs font-semibold">${r.type||''}</td>
                <td class="px-4 py-3 text-xs">${(r.tags||[]).map(t => `<span class="inline-block bg-gray-100 px-2 py-0.5 rounded text-[10px] mr-1">${t}</span>`).join('')}</td>
                <td class="px-4 py-3 text-right">
                  <a href="${r.url||'#'}" class="text-[11px] font-bold text-amber-600 hover:text-amber-700 px-2">View</a>
                </td>
              </tr>
            `).join('');

          renderPanel(`
            <div class="bg-white border border-[#E6E0D4] rounded-2xl p-6 shadow-sm">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-serif font-bold text-[#0D0F12]">Content & Resources <span class="text-sm font-normal text-gray-500">(${list.length})</span></h2>
                <button class="px-4 py-2 bg-[#2A261D] text-[#D4AF37] font-bold text-xs rounded-xl shadow">+ Add Resource</button>
              </div>
              <div class="overflow-x-auto rounded-xl border border-gray-200">
                <table class="w-full text-left text-sm text-gray-600">
                  <thead class="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr><th class="px-4 py-3">Title & Author</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Tags</th><th class="px-4 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </div>
            </div>
          `);
        })
        .catch(err => renderError('Unable to load resources. Retry.'));
    }

    function renderRobustScholarships() {
      renderLoading();
      apiFetch('/api/admin/scholarships')
        .then(res => {
          let list = Array.isArray(res) ? res : (res.scholarships || []);
          let tableRows = list.length === 0 
            ? '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No scholarships found.</td></tr>' 
            : list.map(s => `
              <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td class="px-4 py-3"><div class="font-bold text-gray-900">${s.title||''}</div><div class="text-[10px] text-gray-400">${s.provider||''}</div></td>
                <td class="px-4 py-3 text-xs font-semibold">${s.amount||''}</td>
                <td class="px-4 py-3 text-xs text-gray-500">${s.deadline||''}</td>
                <td class="px-4 py-3 text-[10px] text-gray-500 max-w-[200px] truncate">${s.eligibility||''}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                    ${s.status === 'active' ? 'Active' : 'Upcoming'}
                  </span>
                </td>
              </tr>
            `).join('');

          renderPanel(`
            <div class="bg-white border border-[#E6E0D4] rounded-2xl p-6 shadow-sm">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-serif font-bold text-[#0D0F12]">Scholarships <span class="text-sm font-normal text-gray-500">(${list.length})</span></h2>
                <button class="px-4 py-2 bg-[#2A261D] text-[#D4AF37] font-bold text-xs rounded-xl shadow">+ Add Scholarship</button>
              </div>
              <div class="overflow-x-auto rounded-xl border border-gray-200">
                <table class="w-full text-left text-sm text-gray-600">
                  <thead class="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr><th class="px-4 py-3">Title & Provider</th><th class="px-4 py-3">Amount</th><th class="px-4 py-3">Deadline</th><th class="px-4 py-3">Eligibility</th><th class="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </div>
            </div>
          `);
        })
        .catch(err => renderError('Unable to load scholarships. Retry.'));
    }

    function renderRobustJobs() {
      renderLoading();
      apiFetch('/api/admin/jobs')
        .then(res => {
          let list = Array.isArray(res) ? res : (res.jobs || []);
          let tableRows = list.length === 0 
            ? '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No jobs found.</td></tr>' 
            : list.map(j => `
              <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td class="px-4 py-3"><div class="font-bold text-gray-900">${j.title||''}</div><div class="text-[10px] text-gray-400">${j.company||''}</div></td>
                <td class="px-4 py-3 text-xs font-semibold">${j.type||''}</td>
                <td class="px-4 py-3 text-xs text-gray-500">${j.location||''}</td>
                <td class="px-4 py-3 text-xs text-gray-500">${j.salary || j.stipend || ''}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${j.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">
                    ${j.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                </td>
              </tr>
            `).join('');

          renderPanel(`
            <div class="bg-white border border-[#E6E0D4] rounded-2xl p-6 shadow-sm">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-serif font-bold text-[#0D0F12]">Jobs & Internships <span class="text-sm font-normal text-gray-500">(${list.length})</span></h2>
                <button class="px-4 py-2 bg-[#2A261D] text-[#D4AF37] font-bold text-xs rounded-xl shadow">+ Post Job</button>
              </div>
              <div class="overflow-x-auto rounded-xl border border-gray-200">
                <table class="w-full text-left text-sm text-gray-600">
                  <thead class="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr><th class="px-4 py-3">Title & Company</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Location</th><th class="px-4 py-3">Compensation</th><th class="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </div>
            </div>
          `);
        })
        .catch(err => renderError('Unable to load jobs. Retry.'));
    }

    function renderRobustCommunity() {
      renderLoading();
      apiFetch('/api/admin/community')
        .then(res => {
          let list = Array.isArray(res) ? res : (res.posts || []);
          renderPanel(`
            <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-[#1A1D20]">Community Moderation <span class="text-sm font-normal text-gray-500">(${list.length})</span></h2>
              </div>
              ${list.length === 0 ? '<div class="py-12 text-center text-gray-400">No community posts found.</div>' : '<div class="py-12 text-center text-gray-400">Posts listed here.</div>'}
            </div>
          `);
        })
        .catch(err => renderError('Unable to load community. Retry.'));
    }

    function renderRobustReports() {
      renderLoading();
      apiFetch('/api/admin/reports')
        .then(res => {
          let metrics = res.metrics || {};
          renderPanel(`
            <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]">
              <h2 class="text-lg font-bold text-[#1A1D20] mb-5">Reports & Analytics</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white border border-[#E8E0D4] rounded-xl p-4 text-center">
                  <div class="text-2xl font-black text-[#D4AF37]">${metrics.totalStudents || 0}</div>
                  <div class="text-xs text-gray-500 mt-1 font-medium">Total Students</div>
                </div>
                <div class="bg-white border border-[#E8E0D4] rounded-xl p-4 text-center">
                  <div class="text-2xl font-black text-[#D4AF37]">${metrics.totalMentors || 0}</div>
                  <div class="text-xs text-gray-500 mt-1 font-medium">Total Mentors</div>
                </div>
                <div class="bg-white border border-[#E8E0D4] rounded-xl p-4 text-center">
                  <div class="text-2xl font-black text-[#D4AF37]">${metrics.assignments || 0}</div>
                  <div class="text-xs text-gray-500 mt-1 font-medium">Assignments</div>
                </div>
                <div class="bg-white border border-[#E8E0D4] rounded-xl p-4 text-center">
                  <div class="text-2xl font-black text-[#D4AF37]">${metrics.sessions || 0}</div>
                  <div class="text-xs text-gray-500 mt-1 font-medium">Sessions</div>
                </div>
              </div>
            </div>
          `);
        })
        .catch(err => renderError('Unable to load reports. Retry.'));
    }

    function renderRobustNotifications() {
      renderLoading();
      apiFetch('/api/admin/notifications')
        .then(res => {
          let list = Array.isArray(res) ? res : (res.notifications || []);
          renderPanel(`
            <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]">
              <h2 class="text-lg font-bold text-[#1A1D20] mb-5">Platform Notifications <span class="text-sm font-normal text-gray-500">(${list.length})</span></h2>
              ${list.length === 0 ? '<div class="py-12 text-center text-gray-400">No notifications found.</div>' : '<div class="py-12 text-center text-gray-400">Notifications listed here.</div>'}
            </div>
          `);
        })
        .catch(err => renderError('Unable to load notifications. Retry.'));
    }

    function renderRobustSettings() {
      renderPanel(`
        <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]">
          <h2 class="text-lg font-bold text-[#1A1D20] mb-5">Platform Settings</h2>
          <div class="space-y-4">
            <div class="p-4 bg-white border border-[#E8E0D4] rounded-xl">
              <h3 class="font-bold text-sm text-[#0D0F12] mb-3">Mentor Capacity</h3>
              <div class="flex items-center gap-3">
                <label class="text-xs text-gray-600 font-medium">Max Students per Mentor:</label>
                <span class="px-3 py-1.5 bg-amber-100 text-amber-800 font-black rounded-lg text-sm">5</span>
                <span class="text-xs text-gray-400">(System default — change requires server config update)</span>
              </div>
            </div>
          </div>
        </div>
      `);
    }

    // --- Wire Admin Sidebar Links ---
    window.addEventListener('popstate', function() {
      evaluateAdminRoute();
    });
    evaluateAdminRoute(); // Call router on load to handle direct URL entries

    // Use robust global event delegation instead of cloning nodes
    document.body.addEventListener('click', function(e) {
      const link = e.target.closest('a[href^="/admin"]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      // Protect against full page reload while supporting normal internal anchor tags
      if (href.startsWith('/admin')) {
        e.preventDefault();
        if (window.location.pathname !== href) {
          window.history.pushState({}, '', href);
          evaluateAdminRoute();
        }
      }
    });
  }

  // Admin Add Mentor Modal
  window.showAddMentorModal = showAddMentorModal;
  function showAddMentorModal() {
    let modal = document.getElementById('admin-add-mentor-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-add-mentor-modal';
      modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-[#1c202a] text-gray-200 border border-[#303646] rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-none">
        <button id="close-add-mentor-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold">✕</button>
        <h3 class="text-base font-bold text-white mb-4 border-b border-[#2d3345] pb-2 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" stroke-width="2"></path></svg>
          Provision New Mentor Account
        </h3>
        <form id="add-mentor-form" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-gray-400 mb-1 font-medium">Full Name</label>
            <input type="text" id="m-name" placeholder="Dr. Anita Rao" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" required>
          </div>
          <div>
            <label class="block text-gray-400 mb-1 font-medium">Mentor Email</label>
            <input type="email" id="m-email" placeholder="anita.rao@margdarshak.org" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" required>
          </div>
          <div>
            <label class="block text-gray-400 mb-1 font-medium">Temporary Password</label>
            <input type="password" id="m-password" placeholder="mentorPass123" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" required>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1 font-medium">Qualification</label>
              <input type="text" id="m-qual" placeholder="Ph.D. / M.Tech" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
            </div>
            <div>
              <label class="block text-gray-400 mb-1 font-medium">Specialization</label>
              <input type="text" id="m-spec" placeholder="Career Guidance" class="w-full bg-[#13151c] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
            </div>
          </div>
          <div class="pt-3 flex justify-end gap-2">
            <button type="button" id="cancel-add-mentor" class="px-4 py-2 bg-[#282d3c] hover:bg-[#343b4e] text-gray-300 font-semibold text-xs rounded-xl transition">Cancel</button>
            <button type="submit" id="save-add-mentor" class="px-4 py-2 bg-[#c99846] hover:bg-[#b58434] text-black font-bold text-xs rounded-xl shadow transition">Create Mentor</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('close-add-mentor-modal').onclick = () => modal.remove();
    document.getElementById('cancel-add-mentor').onclick = () => modal.remove();

    document.getElementById('add-mentor-form').onsubmit = function(e) {
      e.preventDefault();
      const fullName = document.getElementById('m-name').value.trim();
      const email = document.getElementById('m-email').value.trim();
      const password = document.getElementById('m-password').value;
      const qualification = document.getElementById('m-qual').value.trim();
      const specialization = document.getElementById('m-spec').value.trim();

      if (!fullName || !email || !password) return;

      apiFetch('/api/admin/mentors', {
        method: 'POST',
        body: { fullName, email, password, qualification, specialization }
      }).then(function(res) {
        if (res.success) {
          modal.remove();
          showToast('success', `Mentor ${fullName} provisioned successfully!`);
          initAdminPortal();
        } else {
          showToast('error', res.error || 'Failed to create mentor.');
        }
      });
    };
  }

  // ── Global Handlers for UI elements ─────────────────────────────────────
  
  // Google Auth Button fallback
  document.querySelectorAll('button[class*="google"], a[href*="google"], [id*="google"]').forEach(btn => {
    // Only apply if it looks like a login button
    if (btn.textContent.toLowerCase().includes('google')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('info', 'Google OAuth not configured. Please use email login.');
      });
    }
  });

  // Language Toggles fallback
  document.querySelectorAll('[id*="lang"], [class*="language"]').forEach(btn => {
    if (btn.tagName === 'BUTTON' || btn.tagName === 'A') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('info', 'తెలుగు (Telugu) translation module coming soon.');
      });
    }
  });

  // Theme Toggles fallback
  document.querySelectorAll('[id*="theme"], [class*="theme"]').forEach(btn => {
    if (btn.tagName === 'BUTTON' || (btn.querySelector && btn.querySelector('svg'))) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('info', 'Dark/Light theme toggle coming soon.');
      });
    }
  });

  // AI Mentor fallback if no API key
  const aiMentorSearchBtn = document.querySelector('input[placeholder*="Ask"]')?.parentElement?.querySelector('button');
  if (aiMentorSearchBtn) {
    const originalClick = aiMentorSearchBtn.onclick;
    aiMentorSearchBtn.onclick = function(e) {
      e.preventDefault();
      apiFetch('/api/system/runtime-info').then(info => {
        if (!info || !info.aiAvailable) {
          showToast('error', 'AI Mentor temporarily unavailable (API key missing).');
        } else {
          window.location.href = '/ai-mentor';
        }
      });
    };
  }

  // --- Global Ctrl+K / Cmd+K Search Shortcut ---
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault(); // Prevent browser default search
      const searchInput = document.querySelector('input[placeholder*="Search" i], input[type="search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  
  // --- AUTO-EXPORT GLOBALS FOR INLINE HTML HANDLERS ---
  window.apiFetch = typeof apiFetch === 'function' ? apiFetch : undefined;
  window.showToast = typeof showToast === 'function' ? showToast : undefined;
  window.applyStoredPreferences = typeof applyStoredPreferences === 'function' ? applyStoredPreferences : undefined;
  window.getDashboardRoute = typeof getDashboardRoute === 'function' ? getDashboardRoute : undefined;
  window.syncGlobalHeaderUser = typeof syncGlobalHeaderUser === 'function' ? syncGlobalHeaderUser : undefined;
  window.toggleProfileDropdown = typeof toggleProfileDropdown === 'function' ? toggleProfileDropdown : undefined;
  window.closeProfileDropdown = typeof closeProfileDropdown === 'function' ? closeProfileDropdown : undefined;
  window.showProfileModal = typeof showProfileModal === 'function' ? showProfileModal : undefined;
  window.showEditProfileModal = typeof showEditProfileModal === 'function' ? showEditProfileModal : undefined;
  window.showSettingsModal = typeof showSettingsModal === 'function' ? showSettingsModal : undefined;
  window.initGlobalHeaderControls = typeof initGlobalHeaderControls === 'function' ? initGlobalHeaderControls : undefined;
  window.toggleNotificationDropdown = typeof toggleNotificationDropdown === 'function' ? toggleNotificationDropdown : undefined;
  window.initLandingPage = typeof initLandingPage === 'function' ? initLandingPage : undefined;
  window.initRoleTabs = typeof initRoleTabs === 'function' ? initRoleTabs : undefined;
  window.initStudentAuthScreen = typeof initStudentAuthScreen === 'function' ? initStudentAuthScreen : undefined;
  window.initMentorAuthScreen = typeof initMentorAuthScreen === 'function' ? initMentorAuthScreen : undefined;
  window.initAdminAuthScreen = typeof initAdminAuthScreen === 'function' ? initAdminAuthScreen : undefined;
  window.initOnboardingStep1 = typeof initOnboardingStep1 === 'function' ? initOnboardingStep1 : undefined;
  window.initOnboardingStep2 = typeof initOnboardingStep2 === 'function' ? initOnboardingStep2 : undefined;
  window.initOnboardingStep3 = typeof initOnboardingStep3 === 'function' ? initOnboardingStep3 : undefined;
  window.initOnboardingStep4 = typeof initOnboardingStep4 === 'function' ? initOnboardingStep4 : undefined;
  window.initStudentDashboard = typeof initStudentDashboard === 'function' ? initStudentDashboard : undefined;
  window.fetchMsgs = typeof fetchMsgs === 'function' ? fetchMsgs : undefined;
  window.initCareerGuidance = typeof initCareerGuidance === 'function' ? initCareerGuidance : undefined;
  window.initSkillDevelopment = typeof initSkillDevelopment === 'function' ? initSkillDevelopment : undefined;
  window.initCoursesColleges = typeof initCoursesColleges === 'function' ? initCoursesColleges : undefined;
  window.initScholarships = typeof initScholarships === 'function' ? initScholarships : undefined;
  window.initJobsInternships = typeof initJobsInternships === 'function' ? initJobsInternships : undefined;
  window.initAiMentor = typeof initAiMentor === 'function' ? initAiMentor : undefined;
  window.setChatBusy = typeof setChatBusy === 'function' ? setChatBusy : undefined;
  window.submitMessage = typeof submitMessage === 'function' ? submitMessage : undefined;
  window.escapeHtml = typeof escapeHtml === 'function' ? escapeHtml : undefined;
  window.formatText = typeof formatText === 'function' ? formatText : undefined;
  window.appendLoadingBubble = typeof appendLoadingBubble === 'function' ? appendLoadingBubble : undefined;
  window.removeLoadingBubble = typeof removeLoadingBubble === 'function' ? removeLoadingBubble : undefined;
  window.appendChatMessage = typeof appendChatMessage === 'function' ? appendChatMessage : undefined;
  window.initResumeBuilder = typeof initResumeBuilder === 'function' ? initResumeBuilder : undefined;
  window.initChallengesXp = typeof initChallengesXp === 'function' ? initChallengesXp : undefined;
  window.initCommunity = typeof initCommunity === 'function' ? initCommunity : undefined;
  window.initResources = typeof initResources === 'function' ? initResources : undefined;
  window.initMentorDashboard = typeof initMentorDashboard === 'function' ? initMentorDashboard : undefined;
  window.ensureMentorPanel = typeof ensureMentorPanel === 'function' ? ensureMentorPanel : undefined;
  window.getMentorContentArea = typeof getMentorContentArea === 'function' ? getMentorContentArea : undefined;
  window.renderMentorPanel = typeof renderMentorPanel === 'function' ? renderMentorPanel : undefined;
  window.hideMentorPanel = typeof hideMentorPanel === 'function' ? hideMentorPanel : undefined;
  window.evaluateMentorRoute = typeof evaluateMentorRoute === 'function' ? evaluateMentorRoute : undefined;
  window.renderMentorStudentsPanel = typeof renderMentorStudentsPanel === 'function' ? renderMentorStudentsPanel : undefined;
  window.renderMentorMentorshipPanel = typeof renderMentorMentorshipPanel === 'function' ? renderMentorMentorshipPanel : undefined;
  window.renderMentorAppointmentsPanel = typeof renderMentorAppointmentsPanel === 'function' ? renderMentorAppointmentsPanel : undefined;
  window.renderMentorCommunityPanel = typeof renderMentorCommunityPanel === 'function' ? renderMentorCommunityPanel : undefined;
  window.renderMentorProgressPanel = typeof renderMentorProgressPanel === 'function' ? renderMentorProgressPanel : undefined;
  window.renderMentorMessagesPanel = typeof renderMentorMessagesPanel === 'function' ? renderMentorMessagesPanel : undefined;
  window.loadConvo = typeof loadConvo === 'function' ? loadConvo : undefined;
  window.renderMentorProfilePanel = typeof renderMentorProfilePanel === 'function' ? renderMentorProfilePanel : undefined;
  window.renderMentorResourcesPanel = typeof renderMentorResourcesPanel === 'function' ? renderMentorResourcesPanel : undefined;
  window.loadMentorDashboard = typeof loadMentorDashboard === 'function' ? loadMentorDashboard : undefined;
  window.renderMentorCommunityPanel_Phase5C = typeof renderMentorCommunityPanel_Phase5C === 'function' ? renderMentorCommunityPanel_Phase5C : undefined;
  window.initAdminPortal = typeof initAdminPortal === 'function' ? initAdminPortal : undefined;
  window.activateSidebarLink = typeof activateSidebarLink === 'function' ? activateSidebarLink : undefined;
  window.getPortalContentArea = typeof getPortalContentArea === 'function' ? getPortalContentArea : undefined;
  window.ensurePortalPanel = typeof ensurePortalPanel === 'function' ? ensurePortalPanel : undefined;
  window.renderPanel = typeof renderPanel === 'function' ? renderPanel : undefined;
  window.showDashboard = typeof showDashboard === 'function' ? showDashboard : undefined;
  window.loadDashboardData = typeof loadDashboardData === 'function' ? loadDashboardData : undefined;
  window.evaluateAdminRoute = typeof evaluateAdminRoute === 'function' ? evaluateAdminRoute : undefined;
  window.renderLoading = typeof renderLoading === 'function' ? renderLoading : undefined;
  window.renderError = typeof renderError === 'function' ? renderError : undefined;
  window.renderRobustStudents = typeof renderRobustStudents === 'function' ? renderRobustStudents : undefined;
  window.renderRobustMentors = typeof renderRobustMentors === 'function' ? renderRobustMentors : undefined;
  window.renderRobustContent = typeof renderRobustContent === 'function' ? renderRobustContent : undefined;
  window.renderRobustScholarships = typeof renderRobustScholarships === 'function' ? renderRobustScholarships : undefined;
  window.renderRobustJobs = typeof renderRobustJobs === 'function' ? renderRobustJobs : undefined;
  window.renderRobustCommunity = typeof renderRobustCommunity === 'function' ? renderRobustCommunity : undefined;
  window.renderRobustReports = typeof renderRobustReports === 'function' ? renderRobustReports : undefined;
  window.renderRobustNotifications = typeof renderRobustNotifications === 'function' ? renderRobustNotifications : undefined;
  window.renderRobustSettings = typeof renderRobustSettings === 'function' ? renderRobustSettings : undefined;
  window.showAddMentorModal = typeof showAddMentorModal === 'function' ? showAddMentorModal : undefined;

  // --- MISSING STUBS ---
  if (typeof window.toggleSaveHeart === 'undefined') {
    window.toggleSaveHeart = function() {
      if (window.showToast) window.showToast('info', 'Feature coming soon!');
      else console.log('toggleSaveHeart called - feature coming soon');
    };
  }

  window.toggleSaveHeart = function(el) {
    if (el && el.classList) {
      el.classList.toggle('text-stone-400');
      el.classList.toggle('text-red-600');
      if (window.showToast) {
         if (el.classList.contains('text-red-600')) window.showToast('success', 'Saved!');
         else window.showToast('info', 'Removed from saved.');
      }
    }
  };

});

})();
