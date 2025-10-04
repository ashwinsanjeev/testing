(function(){
  function casefold(t){ return (t||'').trim().toLowerCase(); }
  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

  function renderAdmin(){
    const user = BC.getCurrentUser();
    const guard = document.getElementById('adminGuard');
    const content = document.getElementById('adminContent');
    if(!(user && user.isAdmin)){
      if(guard) guard.classList.remove('hidden');
      if(content) content.classList.add('hidden');
      return;
    }
    if(guard) guard.classList.add('hidden');
    if(content) content.classList.remove('hidden');

    const requests = BC.storage.read('campRequests', []);
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const declined = requests.filter(r => r.status === 'declined');

    const makeCard = (r, actionsHtml = '') => `
      <div class="card">
        <div class="row"><strong>${escapeHtml(r.eventName)}</strong><span class="tag">${escapeHtml(r.city)}</span></div>
        <div class="row"><span class="tag">Date</span><span>${escapeHtml(r.date)}</span></div>
        <div class="row"><span class="tag">Requested By</span><span>${r.requestedByEmail ? escapeHtml(r.requestedByEmail) : '<em class=\"muted\">Guest</em>'}</span></div>
      ${actionsHtml ? `<div class=\"actions\">${actionsHtml}</div>` : ''}
      </div>`;

    const pendingList = document.getElementById('pendingList');
    const approvedList = document.getElementById('approvedList');
    const declinedList = document.getElementById('declinedList');

    if(pendingList) pendingList.innerHTML = pending.map(r => makeCard(r,
      `<button class=\"button small primary\" data-approve=\"${r.id}\">Approve</button>
       <button class=\"button small\" data-decline=\"${r.id}\">Decline</button>`
    )).join('') || '<p class="muted">No pending requests.</p>';

    if(approvedList) approvedList.innerHTML = approved.map(r => makeCard(r,
      `<button class=\"button small\" data-notify=\"${r.id}\">Notify Donors</button>`
    )).join('') || '<p class="muted">No approved requests.</p>';

    if(declinedList) declinedList.innerHTML = declined.map(r => makeCard(r)).join('') || '<p class="muted">No declined requests.</p>';

    document.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => updateStatus(btn.getAttribute('data-approve'), 'approved')));
    document.querySelectorAll('[data-decline]').forEach(btn => btn.addEventListener('click', () => updateStatus(btn.getAttribute('data-decline'), 'declined')));
    document.querySelectorAll('[data-notify]').forEach(btn => btn.addEventListener('click', () => notifyDonors(btn.getAttribute('data-notify'))));
  }

  function updateStatus(id, status){
    const list = BC.storage.read('campRequests', []);
    const idx = list.findIndex(r => r.id === id);
    if(idx === -1) return;
    list[idx].status = status;
    list[idx].decisionAt = new Date().toISOString();
    BC.storage.write('campRequests', list);
    BC.showToast(status === 'approved' ? 'Camp approved' : 'Camp declined', status === 'approved' ? 'success' : 'error');
    renderAdmin();
  }

  function notifyDonors(id){
    const list = BC.storage.read('campRequests', []);
    const r = list.find(x => x.id === id);
    if(!r) return;
    const donors = BC.storage.read('donors', []);
    const matches = donors.filter(d => casefold(d.city) === casefold(r.city));
    if(matches.length === 0){ BC.showToast('No donors in this city', 'info'); return; }
    const bcc = encodeURIComponent(matches.map(d => d.email).join(','));
    const subject = encodeURIComponent(`Blood Donation Camp: ${r.eventName} (${r.city}) on ${r.date}`);
    const body = encodeURIComponent('Hello,\n\nYou are invited to participate in the blood donation camp.\n' +
      `Event: ${r.eventName}\nDate: ${r.date}\nCity: ${r.city}\n\nThank you,\nBloodConnect`);
    location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
  }

  function setupTabs(){
    const buttons = document.querySelectorAll('.tab-button');
    const pending = document.getElementById('pendingList');
    const approved = document.getElementById('approvedList');
    const declined = document.getElementById('declinedList');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      const tab = btn.getAttribute('data-tab');
      pending?.classList.toggle('hidden', tab !== 'pending');
      approved?.classList.toggle('hidden', tab !== 'approved');
      declined?.classList.toggle('hidden', tab !== 'declined');
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    renderAdmin();
  });
})();

