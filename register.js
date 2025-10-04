(function(){
  function handleRegisterDonor(e){
    e.preventDefault();
    const donor = {
      name: document.getElementById('regName').value.trim(),
      bloodGroup: document.getElementById('regBlood').value,
      email: document.getElementById('regEmail').value.trim().toLowerCase(),
      contact: document.getElementById('regPhone').value.trim(),
      city: document.getElementById('regCity').value.trim()
    };
    const donors = BC.storage.read('donors', []);
    if(donors.some(d => d.email === donor.email)){
      document.getElementById('registerMsg').textContent = 'This email is already registered as donor.';
      BC.showToast('Email already registered', 'error');
      return;
    }
    donors.push(donor);
    BC.storage.write('donors', donors);
    document.getElementById('registerMsg').textContent = 'You are registered as a donor.';
    BC.showToast('Donor registered successfully', 'success');
    e.target.reset();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if(form) form.addEventListener('submit', handleRegisterDonor);
  });
})();

