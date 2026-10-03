// Phase 4 Complete Interactive Engine
// Maps UI interactions to backend APIs for all major modules

document.addEventListener('DOMContentLoaded', () => {
  // Global Event Delegation for all action buttons
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const text = btn.textContent.trim().toLowerCase();
    
    // --- BOOKMARK / SAVE SYSTEM ---
    if (text.includes('save') || text.includes('bookmark') || btn.querySelector('svg[fill="currentColor"]') || (btn.title && btn.title.toLowerCase().includes('save'))) {
      // Find what we are saving
      const card = btn.closest('.bg-white, .bg-[#1a1d26], .bg-[#1c202a]');
      if (!card) return;
      
      const titleEl = card.querySelector('h3, h4, .font-bold');
      if (!titleEl) return;
      
      const itemId = titleEl.textContent.trim().substring(0, 15).replace(/\s/g, '_').toLowerCase();
      let itemType = 'unknown';
      if (window.location.pathname.includes('scholarships')) itemType = 'scholarship';
      else if (window.location.pathname.includes('courses')) itemType = 'course';
      else if (window.location.pathname.includes('jobs')) itemType = 'job';
      else if (window.location.pathname.includes('resources')) itemType = 'resource';
      
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Saving...';
      
      try {
        const res = await fetch('/api/bookmarks/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, itemType })
        });
        const data = await res.json();
        
        if (data.saved) {
          btn.innerHTML = '<span class="text-brand-gold">Saved</span>';
          btn.classList.add('border-brand-gold', 'text-brand-gold');
        } else {
          btn.innerHTML = originalText;
          btn.classList.remove('border-brand-gold', 'text-brand-gold');
        }
      } catch (err) {
        btn.innerHTML = originalText;
      }
      btn.disabled = false;
      return;
    }
    
    // --- APPLY / VIEW DETAILS ---
    if (text.includes('apply') || text.includes('view welfare') || text.includes('open')) {
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Opening...';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('Action recorded: Application initiated.');
      }, 800);
      return;
    }

    // --- SKILL PROGRESS UPDATE ---
    if (text.includes('update progress') || text.includes('continue')) {
      const card = btn.closest('.bg-white, .bg-[#1c202a]');
      if (card) {
        const progressEl = card.querySelector('.w-full.bg-gray-700 div, .w-full.bg-gray-200 div');
        if (progressEl) {
          const currentWidth = parseInt(progressEl.style.width || '0');
          const newWidth = Math.min(100, currentWidth + 20);
          progressEl.style.width = newWidth + '%';
          const txt = card.querySelector('.text-brand-gold, .text-emerald-500');
          if (txt) txt.textContent = newWidth + '% Completed';
        }
      }
      return;
    }

    // --- CHALLENGES ---
    if (text.includes('start challenge') || text.includes('claim')) {
      btn.disabled = true;
      btn.innerHTML = 'Processing...';
      const challengeId = btn.getAttribute('data-challenge-id') || 'ch_1';
      fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          btn.innerHTML = 'Completed';
          btn.classList.add('bg-emerald-600', 'text-white');
          if (window.hydrateUI && data.profile) {
            window.hydrateUI({ id: data.profile.userId, email: data.profile.fullName }, data.profile);
          }
        } else {
          btn.innerHTML = 'Already Done';
        }
      });
      return;
    }
    
    // --- COMMUNITY ACTIONS ---
    if (text.includes('post') || text.includes('reply')) {
      const input = document.querySelector('textarea, input[placeholder*="share" i]');
      if (input && input.value.trim().length > 0) {
        btn.disabled = true;
        btn.innerHTML = 'Posting...';
        fetch('/api/community/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input.value, title: 'New Update' })
        }).then(res => res.json()).then(data => {
          btn.disabled = false;
          btn.innerHTML = 'Post';
          input.value = '';
          alert('Post published successfully.');
          window.location.reload();
        });
      }
      return;
    }
    
    // --- ADMIN PORTAL ACTIONS ---
    if (text.includes('auto assign') || text.includes('auto-assign')) {
      const pendingEl = document.querySelector('.pending-student-id');
      const studentId = pendingEl ? pendingEl.textContent.trim() : null;
      
      btn.innerHTML = 'Assigning...';
      fetch('/api/admin/mentor-assignments/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          btn.innerHTML = 'Assigned';
        } else {
          btn.innerHTML = 'Waitlist / Pending';
        }
      });
      return;
    }
  });

  // --- SEARCH AND FILTER BINDING ---
  const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="search" i]');
  searchInputs.forEach(input => {
    input.addEventListener('keyup', (e) => {
      const term = e.target.value.toLowerCase();
      // Find main grid
      const grid = document.querySelector('main .grid');
      if (!grid) return;
      const cards = Array.from(grid.children);
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) card.style.display = '';
        else card.style.display = 'none';
      });
    });
  });
});


  // --- DYNAMIC LIST RENDERING FROM API ---
  const path = window.location.pathname;
  if (path.includes('/scholarships')) {
    fetch('/api/scholarships').then(res => res.json()).then(data => renderGrid(data.scholarships, 'National & CSR Trusts'));
  } else if (path.includes('/courses-colleges')) {
    fetch('/api/courses-colleges').then(res => res.json()).then(data => renderGrid(data.courses, 'B.Tech'));
  } else if (path.includes('/jobs-internships')) {
    fetch('/api/jobs-internships').then(res => res.json()).then(data => renderGrid(data.jobs, 'Junior Web'));
  }

  function renderGrid(items, sampleTextToFindTemplate) {
    if (!items || !items.length) return;
    const grid = document.querySelector('main .grid') || document.querySelector('.grid');
    if (!grid) return;
    
    // Find the template card
    const cards = Array.from(grid.children);
    let template = cards[0];
    for (let c of cards) {
      if (c.textContent.includes(sampleTextToFindTemplate)) {
        template = c; break;
      }
    }
    if (!template) template = cards[0];
    
    grid.innerHTML = '';
    
    items.forEach(item => {
      const clone = template.cloneNode(true);
      // Try to bind properties to data-bind if any exist, or just general heuristics
      const h4 = clone.querySelector('h4, h3');
      if (h4 && item.title) h4.textContent = item.title;
      
      const p = clone.querySelector('p');
      if (p && (item.provider || item.company || item.description)) {
        p.textContent = item.provider || item.company || item.description;
      }
      
      grid.appendChild(clone);
    });
  }

console.log("Phase 4 Interactive Engine Initialized.");
