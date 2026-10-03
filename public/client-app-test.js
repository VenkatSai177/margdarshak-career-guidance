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
    } else if (path.startsWith('/auth/student')) {
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
    } else if (path.startsWith('/mentor/dashboard')) {
      initMentorDashboard();
    } else if (path.startsWith('/admin/portal')) {
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
      if (!data || !data.user) return;
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
  function initStudentAuthScreen() {
    const loginForm = document.getElementById('form-login') || document.querySelector('form');
    const loginSubmitBtn = document.getElementById('btn-login-submit');

      // Hide Registration link if Mentor or Admin is selected
      const roleSelector = document.getElementById('login-role-selector');
      if (roleSelector) {
        roleSelector.addEventListener('click', function(e) {
          const btn = e.target.closest('button[data-role]');
          if (btn) {
            const role = btn.getAttribute('data-role');
            const regPrompt = document.querySelector('button[data-switch-view="view-register"]');
            if (regPrompt && regPrompt.parentElement) {
              if (role === 'student') {
                regPrompt.parentElement.style.display = 'block';
              } else {
                regPrompt.parentElement.style.display = 'none';
              }
            }
          }
        });
        
        // Initial state
        setTimeout(() => {
          const activeTab = document.querySelector('#login-role-selector button[aria-selected="true"]');
          if (activeTab) {
             const role = activeTab.getAttribute('data-role');
             const regPrompt = document.querySelector('button[data-switch-view="view-register"]');
             if (regPrompt && regPrompt.parentElement && role !== 'student') {
               regPrompt.parentElement.style.display = 'none';
             }
          }
        }, 100);
      }


    const regForm = document.getElementById('form-register');
    const regSubmitBtn = document.getElementById('btn-register-submit');

    if (loginSubmitBtn || loginForm) {
      const triggerBtn = loginSubmitBtn || loginForm.querySelector('button[type="submit"]');
      if (loginForm) {
        loginForm.addEventListener('submit', function(e) {

          e.preventDefault();
          const emailInp = document.getElementById('login-email') || document.querySelector('input[type="email"]');
          const passInp = document.getElementById('login-password') || document.querySelector('input[type="password"]');

          if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
            showToast('error', 'Please enter email and password.');
            return;
          }

          triggerBtn.disabled = true;

          
            let activeRole = 'student';
            const activeTab = document.querySelector('#login-role-selector button[aria-selected="true"]');
            if (activeTab) {
              activeRole = activeTab.getAttribute('data-role') || 'student';
            }

            
            console.log('[AUTH DEBUG] ADMIN LOGIN START');
            console.log('[AUTH DEBUG] activeRole =', activeRole);
            console.log('[AUTH DEBUG] login endpoint =', '/api/auth/login-' + activeRole);
            apiFetch('/api/auth/login-' + activeRole, {
              method: 'POST',
              body: { email: emailInp.value.trim(), password: passInp.value }
            }).then(function(res) {
              
              console.log('[AUTH DEBUG] login response status =', res.success ? 200 : 401);
              console.log('[AUTH DEBUG] login response body =', res);
              if (res.success && res.user && res.user.role === activeRole) {
                apiFetch('/api/auth/me').then(function(meRes) {
                  if (triggerBtn) triggerBtn.disabled = false;
                  
                  console.log('[AUTH DEBUG] auth/me status = 200');
                  console.log('[AUTH DEBUG] auth/me role =', meRes.user.role);
                  console.log('[AUTH DEBUG] intended redirect =', activeRole === 'student' ? '/student/dashboard' : (activeRole === 'mentor' ? '/mentor/dashboard' : '/admin/portal'));
                  console.log('[AUTH DEBUG] actual location before redirect =', window.location.href);
                    if (meRes.authenticated && meRes.user && meRes.user.role === activeRole) {
                    if (activeRole === 'student') {
                      if (meRes.user.onboardingCompleted === true) {
                        window.location.assign('/student/dashboard');
                      } else {
                        window.location.assign('/onboarding/personal-details');
                      }
                    } else if (activeRole === 'mentor') {
                      window.location.assign('/mentor/dashboard');
                    } else if (activeRole === 'admin') {
                      window.location.assign('/admin/portal');
                    }
                  } else {
                    showToast('error', 'Session role mismatch. Verification failed.');
                  }
                });
              } else {
                if (triggerBtn) triggerBtn.disabled = false;
                showToast('error', res.error || 'Invalid ' + activeRole + ' credentials.');
              }
            });

        });
      }
    }

    if (regSubmitBtn || regForm) {
      const triggerRegBtn = regSubmitBtn || (regForm ? regForm.querySelector('button[type="submit"]') : null);
      if (triggerRegBtn) {
        triggerRegBtn.addEventListener('click', function(e) {
          e.preventDefault();
          const nameInp = document.getElementById('reg-name') || document.querySelector('input[name="fullName"]');
          const emailInp = document.getElementById('reg-email') || document.querySelector('input[type="email"]');
          const passInp = document.getElementById('reg-password') || document.querySelector('input[type="password"]');
          const phoneInp = document.getElementById('reg-phone') || document.querySelector('input[name="phone"]');

          if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
            showToast('error', 'Please fill required fields.');
            return;
          }

          triggerRegBtn.disabled = true;

          apiFetch('/api/auth/register-student', {
            method: 'POST',
            body: {
              fullName: nameInp ? nameInp.value.trim() : 'Student',
              email: emailInp.value.trim(),
              password: passInp.value,
              phone: phoneInp ? phoneInp.value.trim() : '+91 9876543210'
            }
          }).then(function(res) {
            triggerRegBtn.disabled = false;
            if (res.success) {
              window.location.href = res.redirect || '/onboarding/personal-details';
            } else {
              showToast('error', res.error || 'Registration failed.');
            }
          });
        });
      }
    }
  }

  // 3. MENTOR AUTH
  function initMentorAuthScreen() {
    const loginForm = document.getElementById('form-login') || document.querySelector('form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const emailInp = loginForm.querySelector('input[type="email"]') || document.getElementById('login-email');
        const passInp = loginForm.querySelector('input[type="password"]') || document.getElementById('login-password');

        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please enter mentor email and password.');
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        apiFetch('/api/auth/login-mentor', {
          method: 'POST',
          body: { email: emailInp.value.trim(), password: passInp.value }
        }).then(function(res) {
          if (res.success && res.user && res.user.role === 'mentor' && res.redirect === '/mentor/dashboard') {
            apiFetch('/api/auth/me').then(function(meRes) {
              if (submitBtn) submitBtn.disabled = false;
              if (meRes.authenticated && meRes.user && meRes.user.role === 'mentor') {
                window.location.assign('/mentor/dashboard');
              } else {
                showToast('error', 'Session role mismatch. Verification failed.');
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

  // 4. ADMIN AUTH
  function initAdminAuthScreen() {
    const loginForm = document.getElementById('form-login') || document.querySelector('form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const emailInp = loginForm.querySelector('input[type="email"]') || document.getElementById('admin-email');
        const passInp = loginForm.querySelector('input[type="password"]') || document.getElementById('admin-password');

        if (!emailInp || !emailInp.value.trim() || !passInp || !passInp.value) {
          showToast('error', 'Please enter admin email and password.');
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        apiFetch('/api/auth/login-admin', {
          method: 'POST',
          body: { email: emailInp.value.trim(), password: passInp.value }
        }).then(function(res) {
          if (res.success && res.user && res.user.role === 'admin' && res.redirect === '/admin/portal') {
            apiFetch('/api/auth/me').then(function(meRes) {
              if (submitBtn) submitBtn.disabled = false;
              if (meRes.authenticated && meRes.user && meRes.user.role === 'admin') {
                window.location.assign('/admin/portal');
              } else {
                showToast('error', 'Session role mismatch. Verification failed.');
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
              <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">ONLINE</span>
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
    const chatInput = document.querySelector('input[placeholder*="ask" i]') || document.querySelector('input[type="text"]') || document.querySelector('textarea');
    const sendBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Send') || b.querySelector('svg'));
    const messageContainer = document.querySelector('.space-y-4') || document.querySelector('main');

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('query');
    if (initialQuery && chatInput) {
      chatInput.value = initialQuery;
    }

    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendChatMessage('user', text);
        chatInput.value = '';

        apiFetch('/api/ai-mentor/chat', {
          method: 'POST',
          body: { message: text }
        }).then(function(res) {
          if (res.response) appendChatMessage('ai', res.response);
        }).catch(function() {
          appendChatMessage('ai', 'Namaste! Margdarshak AI Mentor is ready to assist your career and scholarship questions.');
        });
      });
    }

    function appendChatMessage(sender, msgText) {
      const bubble = document.createElement('div');
      bubble.className = sender === 'user' ? 'flex justify-end my-3' : 'flex justify-start my-3';
      bubble.innerHTML = `
        <div class="${sender === 'user' ? 'bg-[#E5B25D] text-black font-medium' : 'bg-[#1c202a] text-gray-200 border border-[#303646]'} p-4 rounded-xl max-w-[80%] shadow-md leading-relaxed whitespace-pre-line">
          ${msgText}
        </div>
      `;
      if (messageContainer) messageContainer.appendChild(bubble);
      window.scrollTo(0, document.body.scrollHeight);
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
    apiFetch('/api/mentor/dashboard-data').then(function(data) {
      if (!data || !data.mentorProfile) return;
      const capacity = data.capacity || { assignedCount: 0, maxCapacity: 5 };
      const assignedStudents = data.assignedStudents || [];
      const metrics = data.metrics || { totalMentees: 0, activeMentees: 0, sessionsThisWeek: 0, questionsToAnswer: 0 };

      // Data Binding
      const binds = {
        'mentor.fullName': data.mentorProfile.fullName,
        'metric.totalMentees': metrics.totalMentees < 10 ? '0'+metrics.totalMentees : metrics.totalMentees,
        'metric.activeMentees': metrics.activeMentees < 10 ? '0'+metrics.activeMentees : metrics.activeMentees,
        'metric.sessionsThisWeek': metrics.sessionsThisWeek < 10 ? '0'+metrics.sessionsThisWeek : metrics.sessionsThisWeek,
        'metric.questionsToAnswer': metrics.questionsToAnswer < 10 ? '0'+metrics.questionsToAnswer : metrics.questionsToAnswer
      };
      Object.keys(binds).forEach(key => {
        document.querySelectorAll(`[data-bind="${key}"]`).forEach(el => el.textContent = binds[key]);
      });

      const studentSectionTitle = Array.from(document.querySelectorAll('h3')).find(h => 
        (h.textContent || '').includes('Students Who Need Your Attention')
      );
      if (studentSectionTitle && assignedStudents.length > 0) {
        const listContainer = studentSectionTitle.nextElementSibling || studentSectionTitle.closest('section')?.querySelector('.space-y-4');
        if (listContainer) {
          listContainer.innerHTML = assignedStudents.map(s => `
            <div class="p-4 bg-[#181a21] border border-[#292e3d] rounded-xl flex items-center justify-between text-xs text-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30">
                  ${s.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div class="font-bold text-white text-sm">${s.fullName}</div>
                  <div class="text-[11px] text-gray-400">${s.stream} • ${s.district}</div>
                </div>
              </div>
              <div class="text-right">
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px] border border-emerald-500/30">Active Mentee</span>
                <div class="text-[10px] text-amber-400 font-semibold mt-1">${s.xp} XP</div>
              </div>
            </div>
          `).join('');
        }
      } else if (studentSectionTitle && assignedStudents.length === 0) {
        const listContainer = studentSectionTitle.nextElementSibling || studentSectionTitle.closest('section')?.querySelector('.space-y-4');
        if (listContainer) {
          listContainer.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">No active mentees assigned yet.</div>';
        }
      }
    });
  }

  // 21. ADMIN PORTAL
  function initAdminPortal() {
    apiFetch('/api/admin/dashboard-data').then(function(data) {
      if (!data) return;
      const metrics = data.metrics || {};
      const mentors = data.mentors || [];
      const students = data.students || [];

      // Data Binding for header metrics
      const binds = {
        'metric.totalStudents': (metrics.totalStudents || 0) + '+',
        'metric.activeMentors': (metrics.totalMentors || 0) + '+',
        'metric.activeOpportunities': (metrics.activeOpportunities || 0) + '+',
        'metric.pendingReviews': metrics.pendingReviews || 0
      };
      Object.keys(binds).forEach(key => {
        document.querySelectorAll(`[data-bind="${key}"]`).forEach(el => el.textContent = binds[key]);
      });

      let panel = document.getElementById('admin-assignment-panel');
      if (!panel) {
        const main = document.querySelector('main') || document.body;
        panel = document.createElement('div');
        panel.id = 'admin-assignment-panel';
        panel.className = 'my-6 bg-[#16181f] border border-[#262933] rounded-2xl p-6 text-gray-200 shadow-2xl select-none';
        main.prepend(panel);
      }

      panel.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262933] pb-4 mb-5">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-width="2"></path></svg>
              Admin Mentor Assignment & Provisioning Engine
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">Strict Rule Enforced: Maximum 5 Active Students per Mentor. Only Admin can assign & create mentors.</p>
          </div>
          <div class="flex items-center gap-3">
            <button id="btn-admin-add-mentor" type="button" class="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-xs shadow hover:opacity-90 transition">
              + Add Mentor
            </button>
            <span class="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
              ${metrics.assignedStudentsCount || 0} Assigned / ${metrics.unassignedStudentsCount || 0} Pending
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-[#0f1115] border border-[#22252e] rounded-xl p-4">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Provisioned Mentors Capacity (5/5 Limit)</h3>
            <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              ${mentors.map(m => `
                <div class="flex items-center justify-between p-3 bg-[#181a21] border border-[#272b38] rounded-lg text-xs">
                  <div>
                    <div class="font-bold text-white">${m.fullName}</div>
                    <div class="text-[11px] text-gray-400">${m.email}</div>
                  </div>
                  <div class="text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded ${m.status === 'full' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
                      ${m.assignedCount} / 5 Students ${m.status === 'full' ? '(FULL)' : ''}
                    </span>
                    <div class="text-[10px] text-gray-500 mt-1">${m.availableSlots} slots available</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bg-[#0f1115] border border-[#22252e] rounded-xl p-4">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Student Mentor Allocation & Pending Queue</h3>
            <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              ${students.map(s => `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#181a21] border border-[#272b38] rounded-lg text-xs">
                  <div>
                    <div class="font-bold text-white">${s.fullName} <span class="text-[10px] font-normal text-gray-400">(${s.stream})</span></div>
                    <div class="text-[10px] text-gray-400">${s.email}</div>
                    <div class="text-[10px] text-amber-300 mt-0.5">Status: ${s.assignedMentor ? 'Assigned to ' + s.assignedMentor.mentorName : 'Unassigned / Pending'}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button data-auto-assign="${s.id}" class="btn-auto-assign px-3 py-1.5 bg-[#c99846] hover:bg-[#b58434] text-black font-bold text-[11px] rounded-lg transition shadow cursor-pointer">
                      Auto Assign
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      // Auto Assign Handler
      panel.querySelectorAll('.btn-auto-assign').forEach(btn => {
        btn.onclick = function(e) {
          e.preventDefault();
          const studentId = btn.getAttribute('data-auto-assign');
          btn.disabled = true;
          btn.textContent = 'Allocating...';

          apiFetch('/api/admin/mentor-assignments/auto', {
            method: 'POST',
            body: { studentId }
          }).then(function(res) {
            if (res.success) {
              if (res.status === 'pending') {
                showToast('info', res.message || 'All mentors full. Student queued in pending assignments.');
              } else {
                showToast('success', `Allocated ${res.mentor.name} (${res.mentor.assignedCount}/5 capacity)`);
              }
              initAdminPortal();
            } else {
              showToast('error', res.error || 'Allocation failed.');
              btn.disabled = false;
              btn.textContent = 'Auto Assign';
            }
          });
        };
      });

      // Add Mentor Button Handler
      const addMentorBtn = document.getElementById('btn-admin-add-mentor');
      if (addMentorBtn) {
        addMentorBtn.onclick = function(e) {
          e.preventDefault();
          showAddMentorModal();
        };
      }
    });
  }

  // Admin Add Mentor Modal
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
})();
