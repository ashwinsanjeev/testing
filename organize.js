(function(){
  function handleOrganize(e){
    e.preventDefault();
    const user = BC.getCurrentUser();
    const req = {
      id: 'id-' + Date.now().toString(36),
      eventName: document.getElementById('campName').value.trim(),
      date: document.getElementById('campDate').value,
      city: document.getElementById('campCity').value.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestedByEmail: user ? user.email : null
    };
    const list = BC.storage.read('campRequests', []);
    list.push(req);
    BC.storage.write('campRequests', list);
    document.getElementById('organizeMsg').textContent = 'Camp submitted for admin approval.';
    BC.showToast('Camp request submitted', 'success');
    e.target.reset();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('organizeForm');
    if(form) form.addEventListener('submit', handleOrganize);
  });
})();

