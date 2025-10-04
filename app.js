(function(){
  const storage = {
    read(key, fallback){
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  };

  function initializeSeedData(){
    const users = storage.read('users', []);
    const hasAdmin = users.some(u => u.isAdmin);
    if(!hasAdmin){
      users.push({ username: 'Admin', email: 'admin@bloodconnect.local', password: 'admin123', isAdmin: true });
      storage.write('users', users);
    }
    if(!storage.read('donors', null)) storage.write('donors', []);
    if(!storage.read('bloodRequests', null)) storage.write('bloodRequests', []);
    if(!storage.read('campRequests', null)) storage.write('campRequests', []);
  }

  function getSession(){ return storage.read('session', null); }
  function setSession(user){ storage.write('session', user ? { email: user.email } : null); }
  function getCurrentUser(){
    const session = getSession();
    if(!session) return null;
    const users = storage.read('users', []);
    return users.find(u => u.email.toLowerCase() === session.email.toLowerCase()) || null;
  }

  function navigateTo(pageId){
    document.querySelectorAll('.page').forEach(sec => sec.classList.toggle('active', sec.id === pageId));
    document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('data-link') === pageId));
    closeProfilePopup();
    closeModal('loginPage');
    closeModal('signupPage');
  }

  function casefold(text){ return (text||'').trim().toLowerCase(); }

  function renderSearchResults(items){
    const container = document.getElementById('searchResults');
    if(!items.length){ container.innerHTML = '<p class="muted">No matching donors found.</p>'; return; }
    const rows = items.map(d => `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.bloodGroup)}</td><td>${escapeHtml(d.city)}</td><td>${escapeHtml(d.email)}</td><td>${escapeHtml(d.contact)}</td></tr>`).join('');
    container.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Name</th><th>Group</th><th>City</th><th>Email</th><th>Contact</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));
  }

  function uid(){ return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

  function updateYear(){ document.getElementById('year').textContent = new Date().getFullYear(); }

  // Profile popup
  const profileButton = document.getElementById('profileButton');
  const profilePopup = document.getElementById('profilePopup');

  function openProfilePopup(){ profilePopup.classList.add('open'); profileButton.setAttribute('aria-expanded', 'true'); profilePopup.setAttribute('aria-hidden', 'false'); }
  function closeProfilePopup(){ profilePopup.classList.remove('open'); profileButton.setAttribute('aria-expanded', 'false'); profilePopup.setAttribute('aria-hidden', 'true'); }
  function toggleProfilePopup(){ profilePopup.classList.contains('open') ? closeProfilePopup() : (renderProfilePopup(), openProfilePopup()); }

  function renderProfilePopup(){
    const user = getCurrentUser();
    if(!user){
      profilePopup.innerHTML = `
        <div class="popup-row"><span class="muted">Not logged in</span></div>
        <div class="popup-actions">
          <button id="popupLoginBtn" class="button primary small">Login</button>
          <button id="popupSignupBtn" class="button small">Sign up</button>
        </div>`;
      profilePopup.querySelector('#popupLoginBtn').onclick = () => { closeProfilePopup(); openModal('loginPage'); };
      profilePopup.querySelector('#popupSignupBtn').onclick = () => { closeProfilePopup(); openModal('signupPage'); };
    } else {
      profilePopup.innerHTML = `
        <div class="popup-row"><span class="tag">Username</span><strong>${escapeHtml(user.username)}</strong></div>
        <div class="popup-row"><span class="tag">Email</span><span>${escapeHtml(user.email)}</span></div>
        <div class="popup-actions">
          <button id="popupLogoutBtn" class="button small">Logout</button>
          ${user.isAdmin ? '<span class="tag">Admin</span>' : ''}
        </div>`;
      profilePopup.querySelector('#popupLogoutBtn').onclick = () => { setSession(null); updateAuthUI(); closeProfilePopup(); navigateTo('homePage'); };
    }
  }

  // Modals
  function openModal(id){ const el = document.getElementById(id); if(!el) return; el.classList.add('open'); el.setAttribute('aria-hidden','false'); }
  function closeModal(id){ const el = document.getElementById(id); if(!el) return; el.classList.remove('open'); el.setAttribute('aria-hidden','true'); const msg = el.querySelector('.form-msg'); if(msg) msg.textContent=''; const form = el.querySelector('form'); if(form) form.reset(); }

  // Auth UI
  function updateAuthUI(){
    const user = getCurrentUser();
    const adminNavItem = document.getElementById('adminNavItem');
    adminNavItem.classList.toggle('hidden', !(user && user.isAdmin));
    renderProfilePopup();
  }

  function handleSignup(e){
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const msg = document.getElementById('signupMsg');
    if(!name || !email || !password){ msg.textContent = 'All fields are required.'; return; }
    const users = storage.read('users', []);
    if(users.some(u => u.email.toLowerCase() === email)){ msg.textContent = 'Email already registered.'; return; }
    const user = { username: name, email, password, isAdmin: false };
    users.push(user);
    storage.write('users', users);
    msg.textContent = 'Account created. You can log in now.';
    setTimeout(() => { closeModal('signupPage'); openModal('loginPage'); document.getElementById('loginEmail').value = email; }, 800);
  }

  function handleLogin(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    const users = storage.read('users', []);
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if(!user){ msg.textContent = 'Invalid credentials.'; return; }
    setSession(user);
    msg.textContent = 'Logged in successfully.';
    setTimeout(() => { closeModal('loginPage'); updateAuthUI(); }, 500);
  }

  // Donor registration
  function handleRegisterDonor(e){
    e.preventDefault();
    const donor = {
      name: document.getElementById('regName').value.trim(),
      bloodGroup: document.getElementById('regBlood').value,
      email: document.getElementById('regEmail').value.trim().toLowerCase(),
      contact: document.getElementById('regPhone').value.trim(),
      city: document.getElementById('regCity').value.trim()
    };
    const msg = document.getElementById('registerMsg');
    if(!donor.name || !donor.bloodGroup || !donor.email || !donor.contact || !donor.city){ msg.textContent = 'Please fill all fields.'; return; }
    const donors = storage.read('donors', []);
    if(donors.some(d => d.email === donor.email)) { msg.textContent = 'This email is already registered as donor.'; return; }
    donors.push(donor);
    storage.write('donors', donors);
    msg.textContent = 'You are registered as a donor.';
    e.target.reset();
  }

  // Donor search
  function handleSearch(e){
    e.preventDefault();
    const blood = document.getElementById('searchBlood').value;
    const city = document.getElementById('searchCity').value.trim();
    const donors = storage.read('donors', []);
    const results = donors.filter(d => d.bloodGroup === blood && casefold(d.city) === casefold(city));
    renderSearchResults(results);
  }

  // Blood request
  function handleRequest(e){
    e.preventDefault();
    const form = e.target;
    const request = {
      id: uid(),
      name: document.getElementById('reqName').value.trim(),
      bloodGroup: document.getElementById('reqBlood').value,
      email: document.getElementById('reqEmail').value.trim().toLowerCase(),
      contact: document.getElementById('reqPhone').value.trim(),
      city: document.getElementById('reqCity').value.trim(),
      createdAt: new Date().toISOString()
    };
    const msg = document.getElementById('requestMsg');
    const area = document.getElementById('requestEmailArea');
    const donors = storage.read('donors', []);
    const matches = donors.filter(d => d.bloodGroup === request.bloodGroup && casefold(d.city) === casefold(request.city));
    storage.write('bloodRequests', [...storage.read('bloodRequests', []), request]);
    if(matches.length === 0){ msg.textContent = 'No matching donors found.'; area.innerHTML = ''; return; }
    msg.textContent = `Found ${matches.length} matching donor(s).`;
    const bcc = encodeURIComponent(matches.map(d => d.email).join(','));
    const subject = encodeURIComponent(`Urgent Blood Request: ${request.bloodGroup} in ${request.city}`);
    const body = encodeURIComponent(
      `Hello,\n\nA requestor needs ${request.bloodGroup} blood in ${request.city}.\n` +
      `Name: ${request.name}\nEmail: ${request.email}\nPhone: ${request.contact}\n\nIf you can donate, please reply directly.\n\nThank you,\nBloodConnect`
    );
    const href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    area.innerHTML = `<a class="button primary" href="${href}">Compose Email to Donors</a>`;
    form.reset();
  }

  // Organize camp (user) -> pending for admin
  function handleOrganize(e){
    e.preventDefault();
    const user = getCurrentUser();
    const req = {
      id: uid(),
      eventName: document.getElementById('campName').value.trim(),
      date: document.getElementById('campDate').value,
      city: document.getElementById('campCity').value.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestedByEmail: user ? user.email : null
    };
    const msg = document.getElementById('organizeMsg');
    const list = storage.read('campRequests', []);
    list.push(req);
    storage.write('campRequests', list);
    msg.textContent = 'Camp submitted for admin approval.';
    e.target.reset();
  }

  function renderAdmin(){
    const user = getCurrentUser();
    if(!(user && user.isAdmin)) return; // nothing to do
    const requests = storage.read('campRequests', []);
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const declined = requests.filter(r => r.status === 'declined');
    const makeCard = (r, actionsHtml = '') => `
      <div class="card">
        <div class="row"><strong>${escapeHtml(r.eventName)}</strong><span class="tag">${escapeHtml(r.city)}</span></div>
        <div class="row"><span class="tag">Date</span><span>${escapeHtml(r.date)}</span></div>
        <div class="row"><span class="tag">Requested By</span><span>${r.requestedByEmail ? escapeHtml(r.requestedByEmail) : '<em class=\"muted\">Guest</em>'}</span></div>
        <div class="row"><span class="tag">Created</span><span>${new Date(r.createdAt).toLocaleString()}</span></div>
        ${actionsHtml ? `<div class="actions">${actionsHtml}</div>` : ''}
      </div>`;

    document.getElementById('pendingList').innerHTML = pending.map(r => makeCard(r,
      `<button class="button small primary" data-approve="${r.id}">Approve</button>
       <button class="button small" data-decline="${r.id}">Decline</button>`
    )).join('') || '<p class="muted">No pending requests.</p>';

    document.getElementById('approvedList').innerHTML = approved.map(r => makeCard(r,
      `<button class="button small" data-notify="${r.id}">Notify Donors</button>`
    )).join('') || '<p class="muted">No approved requests.</p>';

    document.getElementById('declinedList').innerHTML = declined.map(r => makeCard(r)).join('') || '<p class="muted">No declined requests.</p>';

    // Wire actions
    document.querySelectorAll('[data-approve]').forEach(btn => btn.onclick = () => updateCampStatus(btn.getAttribute('data-approve'), 'approved'));
    document.querySelectorAll('[data-decline]').forEach(btn => btn.onclick = () => updateCampStatus(btn.getAttribute('data-decline'), 'declined'));
    document.querySelectorAll('[data-notify]').forEach(btn => btn.onclick = () => notifyDonorsForCamp(btn.getAttribute('data-notify')));
  }

  function updateCampStatus(id, status){
    const requests = storage.read('campRequests', []);
    const idx = requests.findIndex(r => r.id === id);
    if(idx === -1) return;
    requests[idx].status = status;
    requests[idx].decisionAt = new Date().toISOString();
    storage.write('campRequests', requests);
    renderAdmin();
  }

  function notifyDonorsForCamp(id){
    const requests = storage.read('campRequests', []);
    const r = requests.find(x => x.id === id);
    if(!r) return;
    const donors = storage.read('donors', []);
    const list = donors.filter(d => casefold(d.city) === casefold(r.city));
    if(list.length === 0){ alert('No donors in this city.'); return; }
    const bcc = encodeURIComponent(list.map(d => d.email).join(','));
    const subject = encodeURIComponent(`Blood Donation Camp: ${r.eventName} (${r.city}) on ${r.date}`);
    const body = encodeURIComponent(
      `Hello,\n\nYou are invited to participate in the blood donation camp.\nEvent: ${r.eventName}\nDate: ${r.date}\nCity: ${r.city}\n\nThank you,\nBloodConnect`
    );
    const href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    window.location.href = href;
  }

  // Tabs
  function setupTabs(){
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b === btn));
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
      });
    });
  }

  // Navigation
  function setupNavigation(){
    document.querySelectorAll('a[data-link]').forEach(a => {
      a.addEventListener('click', (e) => {
        const page = a.getAttribute('data-link');
        navigateTo(page);
      });
    });
    // Hamburger
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  function setupForms(){
    document.getElementById('registerForm').addEventListener('submit', handleRegisterDonor);
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('requestForm').addEventListener('submit', handleRequest);
    document.getElementById('organizeForm').addEventListener('submit', handleOrganize);

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    document.getElementById('goToSignup').addEventListener('click', (e) => { e.preventDefault(); closeModal('loginPage'); openModal('signupPage'); });
    document.getElementById('goToLogin').addEventListener('click', (e) => { e.preventDefault(); closeModal('signupPage'); openModal('loginPage'); });

    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => {
      const modal = btn.closest('.modal'); if(modal) modal.classList.remove('open');
    }));
  }

  function setupProfile(){
    document.getElementById('profileButton').addEventListener('click', toggleProfilePopup);
    document.addEventListener('click', (e) => {
      const isClickInside = profilePopup.contains(e.target) || profileButton.contains(e.target);
      if(!isClickInside) closeProfilePopup();
    });
  }

  function init(){
    initializeSeedData();
    updateYear();
    setupNavigation();
    setupForms();
    setupTabs();
    setupProfile();
    updateAuthUI();

    // Route from hash if present
    const hash = (location.hash || '').replace('#','');
    const map = { home:'homePage', register:'registerPage', search:'searchPage', request:'requestPage', organize:'organizePage', admin:'adminPage' };
    if(map[hash]) navigateTo(map[hash]);

    // Render admin section if arriving as admin
    renderAdmin();

    // Re-render admin when navigating to Admin page
    document.querySelector('[data-link="adminPage"]').addEventListener('click', () => renderAdmin());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
