(function(){
  const storage = {
    read(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    write(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  };

  function initializeSeedData(){
    const users = storage.read('users', []);
    if(!users.some(u => u.isAdmin)){
      users.push({ username: 'Admin', email: 'admin@bloodconnect.local', password: 'admin123', isAdmin: true });
      storage.write('users', users);
    }
    if(!storage.read('donors', null)) storage.write('donors', []);
    if(!storage.read('bloodRequests', null)) storage.write('bloodRequests', []);
    if(!storage.read('campRequests', null)) storage.write('campRequests', []);
  }

  function getSession(){ return storage.read('session', null); }
  function setSession(user){ storage.write('session', user ? { email: user.email } : null); }
  function getCurrentUser(){ const s = getSession(); if(!s) return null; const users = storage.read('users', []); return users.find(u => u.email.toLowerCase() === s.email.toLowerCase()) || null; }

  function showToast(message, type = 'success'){
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => t.classList.add('fade-out'), 700);
    setTimeout(() => t.remove(), 1000);
  }

  function updateYear(){ const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }

  // Profile popup
  function renderProfilePopup(){
    const btn = document.getElementById('profileButton');
    const popup = document.getElementById('profilePopup');
    if(!btn || !popup) return;
    const user = getCurrentUser();
    if(!user){
      popup.innerHTML = `
        <div class="popup-row"><span class="muted">Not logged in</span></div>
        <div class="popup-actions">
          <button id="popupLoginBtn" class="button primary small">Login</button>
          <button id="popupSignupBtn" class="button small">Sign up</button>
        </div>`;
      popup.querySelector('#popupLoginBtn').onclick = () => { closeProfilePopup(); openModal('loginPage'); };
      popup.querySelector('#popupSignupBtn').onclick = () => { closeProfilePopup(); openModal('signupPage'); };
    } else {
      popup.innerHTML = `
        <div class="popup-row"><span class="tag">Username</span><strong>${escapeHtml(user.username)}</strong></div>
        <div class="popup-row"><span class="tag">Email</span><span>${escapeHtml(user.email)}</span></div>
        <div class="popup-actions">
          <button id="popupLogoutBtn" class="button small">Logout</button>
          ${user.isAdmin ? '<span class="tag">Admin</span>' : ''}
        </div>`;
      popup.querySelector('#popupLogoutBtn').onclick = () => { setSession(null); renderAdminNav(); closeProfilePopup(); showToast('Logged out', 'info'); };
    }
  }
  function openProfilePopup(){ const btn = document.getElementById('profileButton'); const popup = document.getElementById('profilePopup'); if(!btn||!popup) return; popup.classList.add('open'); btn.setAttribute('aria-expanded','true'); popup.setAttribute('aria-hidden','false'); }
  function closeProfilePopup(){ const btn = document.getElementById('profileButton'); const popup = document.getElementById('profilePopup'); if(!btn||!popup) return; popup.classList.remove('open'); btn.setAttribute('aria-expanded','false'); popup.setAttribute('aria-hidden','true'); }
  function toggleProfilePopup(){ const popup = document.getElementById('profilePopup'); if(!popup) return; if(popup.classList.contains('open')) closeProfilePopup(); else { renderProfilePopup(); openProfilePopup(); } }

  // Modals
  function openModal(id){ const el = document.getElementById(id); if(!el) return; el.classList.add('open'); el.setAttribute('aria-hidden','false'); }
  function closeModal(id){ const el = document.getElementById(id); if(!el) return; el.classList.remove('open'); el.setAttribute('aria-hidden','true'); const msg = el.querySelector('.form-msg'); if(msg) msg.textContent=''; const form = el.querySelector('form'); if(form) form.reset(); }

  function setupAuthOverlays(){
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const goToSignup = document.getElementById('goToSignup');
    const goToLogin = document.getElementById('goToLogin');
    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => { const m = btn.closest('.modal'); if(m) { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); } }));
    if(goToSignup) goToSignup.addEventListener('click', (e) => { e.preventDefault(); closeModal('loginPage'); openModal('signupPage'); });
    if(goToLogin) goToLogin.addEventListener('click', (e) => { e.preventDefault(); closeModal('signupPage'); openModal('loginPage'); });

    if(loginForm) loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const msg = document.getElementById('loginMsg');
      const users = storage.read('users', []);
      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
      if(!user){ msg.textContent = 'Invalid credentials.'; showToast('Login failed', 'error'); return; }
      setSession(user);
      renderAdminNav();
      renderProfilePopup();
      msg.textContent = 'Logged in successfully.';
      showToast('Login success', 'success');
      setTimeout(() => closeModal('loginPage'), 400);
    });

    if(signupForm) signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const password = document.getElementById('signupPassword').value;
      const msg = document.getElementById('signupMsg');
      if(!username || !email || !password){ msg.textContent = 'All fields are required.'; return; }
      const users = storage.read('users', []);
      if(users.some(u => u.email.toLowerCase() === email)){ msg.textContent = 'Email already registered.'; showToast('Signup failed: email already registered', 'error'); return; }
      users.push({ username, email, password, isAdmin: false });
      storage.write('users', users);
      msg.textContent = 'Account created. You can log in now.';
      showToast('Signup success', 'success');
      setTimeout(() => { closeModal('signupPage'); openModal('loginPage'); document.getElementById('loginEmail').value = email; }, 600);
    });
  }

  function renderAdminNav(){
    const user = getCurrentUser();
    const li = document.getElementById('adminNavItem');
    if(li) li.classList.toggle('hidden', !(user && user.isAdmin));
  }

  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

  function setupHeader(){
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if(toggle && nav){ toggle.addEventListener('click', () => nav.classList.toggle('open')); }
    const profileBtn = document.getElementById('profileButton');
    if(profileBtn) profileBtn.addEventListener('click', toggleProfilePopup);
    document.addEventListener('click', (e) => {
      const popup = document.getElementById('profilePopup');
      const btn = document.getElementById('profileButton');
      if(popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) closeProfilePopup();
    });
    // nav highlight
    const current = document.body.getAttribute('data-route');
    document.querySelectorAll('.nav a.nav-link').forEach(a => {
      const r = a.getAttribute('data-route');
      a.classList.toggle('active', r === current);
    });
    renderAdminNav();
    renderProfilePopup();
  }

  function boot(){
    initializeSeedData();
    updateYear();
    setupHeader();
    setupAuthOverlays();
  }

  window.BC = { storage, getCurrentUser, setSession, showToast, renderProfilePopup, renderAdminNav };
  document.addEventListener('DOMContentLoaded', boot);
})();

