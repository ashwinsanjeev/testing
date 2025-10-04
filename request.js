(function(){
  function casefold(t){ return (t||'').trim().toLowerCase(); }
  function handleRequest(e){
    e.preventDefault();
    const req = {
      id: 'id-' + Date.now().toString(36),
      name: document.getElementById('reqName').value.trim(),
      bloodGroup: document.getElementById('reqBlood').value,
      email: document.getElementById('reqEmail').value.trim().toLowerCase(),
      contact: document.getElementById('reqPhone').value.trim(),
      city: document.getElementById('reqCity').value.trim(),
      createdAt: new Date().toISOString()
    };
    const msg = document.getElementById('requestMsg');
    const donors = BC.storage.read('donors', []);
    const matches = donors.filter(d => d.bloodGroup === req.bloodGroup && casefold(d.city) === casefold(req.city));
    BC.storage.write('bloodRequests', [...BC.storage.read('bloodRequests', []), req]);
    msg.textContent = matches.length ? `Found ${matches.length} matching donor(s).` : 'No matching donors found';
    BC.showToast('Blood request submitted', 'success');
    const area = document.getElementById('requestEmailArea');
    if(matches.length){
      const bcc = encodeURIComponent(matches.map(d => d.email).join(','));
      const subject = encodeURIComponent(`Urgent Blood Request: ${req.bloodGroup} in ${req.city}`);
      const body = encodeURIComponent(`Hello,\n\nA requestor needs ${req.bloodGroup} blood in ${req.city}.\nName: ${req.name}\nEmail: ${req.email}\nPhone: ${req.contact}\n\nIf you can donate, please reply directly.\n\nThank you,\nBloodConnect`);
      area.innerHTML = `<a class="button primary" href="mailto:?bcc=${bcc}&subject=${subject}&body=${body}">Compose Email to Donors</a>`;
    } else {
      area.innerHTML = '';
    }
    e.target.reset();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('requestForm');
    if(form) form.addEventListener('submit', handleRequest);
  });
})();

