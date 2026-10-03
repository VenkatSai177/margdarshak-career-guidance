document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch user data from /api/auth/me
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return; // Not authenticated or error
    const data = await res.json();
    
    if (data.authenticated && data.user) {
      hydrateProfileDOM(data.user, data.profile);
    }
  } catch (err) {
    console.error('Failed to hydrate profile:', err);
  }
});

function hydrateProfileDOM(user, profile) {
  const userName = profile?.fullName || user.email.split('@')[0];

  // 1. Update elements that explicitly have data-bind (Student dashboard)
  const nameElems = document.querySelectorAll('[data-bind="user.fullName"], [data-bind="user.name"]');
  nameElems.forEach(el => {
    if (el.tagName === 'INPUT') el.value = userName;
    else el.textContent = userName;
  });

  // 2. Find the Profile Dropdown Wrapper robustly across all pages.
  // Both Student and Admin/Mentor portals use the exact same Chevron Down SVG path: M19 9l-7 7-7-7
  const chevronPaths = document.querySelectorAll('path[d="M19 9l-7 7-7-7"]');
  
  if (chevronPaths.length > 0) {
    // Get the closest wrapper with cursor-pointer
    const profileWrapper = chevronPaths[0].closest('.cursor-pointer');
    
    if (profileWrapper) {
      
      // Attempt to intelligently update the hardcoded name (e.g. "Mentor Name" or "Venkat Sai") 
      // if it didn't have a data-bind attribute.
      const spans = profileWrapper.querySelectorAll('span');
      spans.forEach(span => {
        if (span.textContent.trim() === 'Mentor Name' || span.textContent.trim() === 'Admin Name') {
          span.textContent = userName;
        }
      });
      
      // Attempt to update the Initials circle (e.g. "AR")
      const initialsDiv = profileWrapper.querySelector('.rounded-full.bg-gradient-to-tr');
      if (initialsDiv && !initialsDiv.querySelector('img')) {
        const initials = userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        initialsDiv.textContent = initials;
      }

      // Make sure the parent of the wrapper is relative to position the dropdown
      profileWrapper.parentElement.style.position = 'relative';
      
      // Create the dropdown menu
      const dropdown = document.createElement('div');
      dropdown.id = 'dynamic-profile-dropdown';
      dropdown.className = 'hidden absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50 text-sm text-stone-700';
      
      const dashboardLink = user.role === 'admin' ? '/admin/portal' : (user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');

      dropdown.innerHTML = `
        <div class="px-4 py-2 border-b border-stone-100 mb-1">
          <p class="font-bold text-stone-900 truncate">${userName}</p>
          <p class="text-xs text-stone-500 capitalize">${user.role}</p>
        </div>
        <a href="${dashboardLink}" class="block px-4 py-2 hover:bg-stone-50 hover:text-amber-700 transition-colors">Dashboard</a>
        <a href="/onboarding/personal-details" class="block px-4 py-2 hover:bg-stone-50 hover:text-amber-700 transition-colors">Edit Profile</a>
        <button id="logout-btn" class="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">Logout</button>
      `;
      
      profileWrapper.parentElement.appendChild(dropdown);
      
      // Toggle logic
      profileWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });
      
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!profileWrapper.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
      
      // Logout logic
      document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          if (res.ok) {
            window.location.href = '/';
          }
        } catch (err) {
          console.error('Logout failed:', err);
        }
      });
    }
  }
}
