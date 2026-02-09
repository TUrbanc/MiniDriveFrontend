
// User registration and refreshing user list

function setupRegister() {
  const form = document.getElementById('regForm');
  const msg  = document.getElementById('regMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    try {
      const secret   = document.getElementById('secret').value;
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      await postJson('/admin/register', { secret, username, password });
      msg.textContent = 'Registracija uspešna.'; msg.className = 'msg ok';
      form.reset();
      loadUsers(); // refresh list if visible
    } catch (err) {
      msg.textContent = err.message; msg.className = 'msg error';
    }
  });
}

// Users list refreshing (auto detection of secret changes)

function setupAdminUsers() {
  document.getElementById('refreshUsers').addEventListener('click', (e) => {
    e.preventDefault();
    loadUsers();
  });

  // Reload list automatically once a secret is typed/changed
  const secretInput = document.getElementById('secret');
  let t = null;
  secretInput.addEventListener('input', () => {
    if (t) clearTimeout(t);
    t = setTimeout(loadUsers, 250);
  });

  loadUsers();
}

// UI helpers for admin panel (use of key shortcuts, modals, etc)

function askPasswordModal(titleText) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const title = document.createElement('h3');
    title.textContent = titleText;

    const label = document.createElement('label');
    label.textContent = 'Novo geslo';

    const input = document.createElement('input');
    input.type = 'password';
    input.autocomplete = 'new-password';

    const msg = document.createElement('p');
    msg.className = 'msg error';
    msg.style.marginTop = '10px';
    msg.style.display = 'none';

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '12px';

    const cancel = document.createElement('button');
    cancel.className = 'secondary';
    cancel.textContent = 'Prekliči';

    const ok = document.createElement('button');
    ok.textContent = 'Spremeni';

    function cleanup(v) {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(v);
    }

    function showErr(s) {
      msg.textContent = s;
      msg.style.display = 'block';
    }

    async function submit() {
      const val = input.value || '';
      if (!val.trim()) return showErr('Vnesi novo geslo.');
      cleanup(val);
    }

    function onKey(e) {
      if (e.key === 'Escape') cleanup(null);
      if (e.key === 'Enter') submit();
    }

    cancel.onclick = () => cleanup(null);
    ok.onclick = submit;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });

    actions.appendChild(cancel);
    actions.appendChild(ok);

    modal.appendChild(title);
    modal.appendChild(label);
    modal.appendChild(input);
    modal.appendChild(msg);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
    input.focus();
    document.addEventListener('keydown', onKey);
  });
}

// Toast notification helper for admin panel. Duplicated from drive.js.
function showToast(message, type = 'ok', timeout = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (!container.children.length) container.remove();
    }, 300);
  }, timeout);
}

// Confirmation modal helper for admin panel.
function confirmModal(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    const p = document.createElement('p');
    p.textContent = message;
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.marginTop = '12px';
    const btnCancel = document.createElement('button');
    btnCancel.className = 'secondary';
    btnCancel.textContent = 'Prekliči';
    const btnOk = document.createElement('button');
    btnOk.textContent = 'Da';
    function cleanup(result) {
      overlay.remove();
      resolve(result);
    }
    btnCancel.onclick = () => cleanup(false);
    btnOk.onclick = () => cleanup(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false);
    };
    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);
    modal.appendChild(p);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}


// Users list rendering per-user row: "Spremeni geslo" -> opens modal -> calls /admin/users/password ; "Izbriši" -> calls /admin/users/delete

async function loadUsers() {
  const box = document.getElementById('usersList');
  box.textContent = 'Nalagam...';
  try {
    const secret = document.getElementById('secret').value;
    if (!secret) {
      box.textContent = 'Vnesi skrivni ključ, da vidiš seznam uporabnikov.';
      return;
    }
    const r = await postJson('/admin/users/list', { secret });
    if (!r.users || !r.users.length) { box.textContent = 'Ni uporabnikov.'; return; }
    const wrap = document.createElement('div');
    r.users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'file-row';

      const top = document.createElement('div');
      top.className = 'file-top';

      const left = document.createElement('div');
      left.className = 'file-title';
      left.textContent = `#${u.id} • ${u.username} • datotek: ${u.file_count} • ${new Date(u.created_at).toLocaleString()}`;

      const actions = document.createElement('div');
      actions.className = 'actions';

      const changePw = document.createElement('button');
      changePw.className = 'secondary';
      changePw.textContent = 'Spremeni geslo';
      changePw.onclick = async () => {
        try {
          const secret = document.getElementById('secret').value;
          if (!secret) { showToast('Najprej vnesi skrivni ključ.', 'error'); return; }

          const newPassword = await askPasswordModal(`Spremeni geslo za: ${u.username}`);
          if (!newPassword) return;

          await postJson('/admin/users/password', { secret, userId: u.id, newPassword });
          showToast('Geslo uspešno spremenjeno.', 'ok');
        } catch (err) {
          showToast(err.message || 'Napaka.', 'error');
        }
      };

      const del = document.createElement('button');
      del.className = 'secondary';
      del.textContent = 'Izbriši';
      del.onclick = async () => {
        try {
          const ok = await confirmModal(`Izbrisati uporabnika ${u.username}?`);
          if (!ok) return;
          const secret = document.getElementById('secret').value;
          await postJson('/admin/users/delete', { secret, userId: u.id });
          loadUsers();
          showToast('Uporabnik izbrisan.', 'ok');
        } catch (err) {
          showToast(err.message || 'Napaka.', 'error');
        }
      };

      actions.appendChild(changePw);
      actions.appendChild(del);

      top.appendChild(left);
      top.appendChild(actions);
      row.appendChild(top);
      wrap.appendChild(row);
    });
    box.innerHTML=''; box.appendChild(wrap);
  } catch (e) {
    box.textContent = e.message || 'Napaka.';
  }
}
