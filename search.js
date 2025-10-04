(function(){
  function casefold(t){ return (t||'').trim().toLowerCase(); }
  function renderSearchResults(items){
    const container = document.getElementById('searchResults');
    if(!items.length){ container.innerHTML = '<p class="muted">No matching donors found.</p>'; return; }
    const rows = items.map(d => `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.bloodGroup)}</td><td>${escapeHtml(d.city)}</td><td>${escapeHtml(d.email)}</td><td>${escapeHtml(d.contact)}</td></tr>`).join('');
    container.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Group</th><th>City</th><th>Email</th><th>Contact</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

  function handleSearch(e){
    e.preventDefault();
    const blood = document.getElementById('searchBlood').value;
    const city = document.getElementById('searchCity').value.trim();
    const donors = BC.storage.read('donors', []);
    const results = donors.filter(d => d.bloodGroup === blood && casefold(d.city) === casefold(city));
    BC.showToast(`${results.length} donor${results.length===1?'':'s'} found`, results.length ? 'success' : 'info');
    renderSearchResults(results);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('searchForm');
    if(form) form.addEventListener('submit', handleSearch);
  });
})();

