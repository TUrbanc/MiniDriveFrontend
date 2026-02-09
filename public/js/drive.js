function requireTokenOrRedirect() {
  const t = localStorage.getItem('token');
  if (!t) location.href = '/';
}

function humanKB(n) { return (n / 1024).toFixed(1) + ' KB'; }

// helper: create button with SVG icon from /public/icons
function createIconButton(iconName, label, extraClasses = []) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('icon-btn', ...extraClasses);
  btn.title = label;

  const img = document.createElement('img');
  img.src = `/icons/${iconName}.svg`;
  img.alt = label;
  img.className = 'icon-img';

  btn.appendChild(img);
  return btn;
}

// Toast notification helper. Shows a small message at the bottom of the page.
// Type can be 'ok' or 'error' (default 'ok') which controls accent color.
function showToast(message, type = 'ok', timeout = 3500) {
  // ensure container exists
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
  // allow CSS transition
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  // remove after timeout
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (!container.children.length) {
        container.remove();
      }
    }, 300);
  }, timeout);
}

// Modal helper for confirmations (yes/no).
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

// Modal helper for sharing to a user. Returns { username, canDownload } or null.
function openShareModal(file) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = '100%';
    modal.style.maxWidth = '520px';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';

    const title = document.createElement('h3');
    title.textContent = `Skupna raba – ${file.original_name}`;
    modal.appendChild(title);

    const field1 = document.createElement('div');
    const labelUser = document.createElement('label');
    labelUser.textContent = 'Uporabniško ime prejemnika';
    const inputUser = document.createElement('input');
    inputUser.type = 'text';
    inputUser.placeholder = 'npr. janez';
    field1.appendChild(labelUser);
    field1.appendChild(inputUser);
    modal.appendChild(field1);

    const field2 = document.createElement('div');
    field2.style.marginTop = '8px';
    const labelCanDl = document.createElement('label');
    // Put checkbox + text on one line, aligned left
    labelCanDl.style.display = 'flex';
    labelCanDl.style.alignItems = 'center';
    labelCanDl.style.justifyContent = 'flex-start';
    labelCanDl.style.gap = '8px';
    labelCanDl.style.margin = '0';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    const span = document.createElement('span');
    span.textContent = 'Prejemnik lahko prenese';
    labelCanDl.appendChild(checkbox);
    labelCanDl.appendChild(span);
    field2.appendChild(labelCanDl);
    modal.appendChild(field2);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.marginTop = '12px';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'secondary';
    btnCancel.textContent = 'Prekliči';
    const btnOk = document.createElement('button');
    btnOk.textContent = 'Deli';

    function cleanup(val) {
      overlay.remove();
      resolve(val);
    }
    btnCancel.onclick = () => cleanup(null);
    btnOk.onclick = () => {
      const username = (inputUser.value || '').trim();
      if (!username) {
        showToast('Vnesi uporabniško ime prejemnika.', 'error');
        return;
      }
      cleanup({ username, canDownload: checkbox.checked });
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(null);
    };
    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    inputUser.focus();
  });
}

// Modal helper for creating a link share. Returns { days, maxDownloads } or null.
function openLinkShareModal(file) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = '100%';
    modal.style.maxWidth = '520px';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';

    const title = document.createElement('h3');
    title.textContent = `Link za prenos – ${file.original_name}`;
    modal.appendChild(title);

    const f1 = document.createElement('div');
    const l1 = document.createElement('label');
    l1.textContent = 'Veljavnost (dni)';
    const i1 = document.createElement('input');
    i1.type = 'number';
    i1.placeholder = 'prazno = brez';
    f1.appendChild(l1);
    f1.appendChild(i1);
    modal.appendChild(f1);

    const f2 = document.createElement('div');
    f2.style.marginTop = '8px';
    const l2 = document.createElement('label');
    l2.textContent = 'Največje število prenosov';
    const i2 = document.createElement('input');
    i2.type = 'number';
    i2.placeholder = 'prazno = brez';
    f2.appendChild(l2);
    f2.appendChild(i2);
    modal.appendChild(f2);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.marginTop = '12px';
    const btnCancel = document.createElement('button');
    btnCancel.className = 'secondary';
    btnCancel.textContent = 'Prekliči';
    const btnOk = document.createElement('button');
    btnOk.textContent = 'Ustvari link';
    function cleanup(val) {
      overlay.remove();
      resolve(val);
    }
    btnCancel.onclick = () => cleanup(null);
    btnOk.onclick = () => {
      const daysVal = i1.value ? Number(i1.value) : null;
      const maxdVal = i2.value ? Number(i2.value) : null;
      if (i1.value && isNaN(daysVal)) {
        showToast('Neveljavna številka dni.', 'error');
        return;
      }
      if (i2.value && isNaN(maxdVal)) {
        showToast('Neveljavno največje število prenosov.', 'error');
        return;
      }
      cleanup({ days: daysVal, maxDownloads: maxdVal });
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(null);
    };
    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    i1.focus();
  });
}

// Shows a modal containing a generated transfer link and provides copy button.
function openCopyLinkModal(url) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.alignItems = 'center';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = '100%';
    modal.style.maxWidth = '520px';

    const title = document.createElement('h3');
    title.textContent = 'Povezava za prenos';
    modal.appendChild(title);

    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.value = url;
    linkInput.readOnly = true;
    linkInput.onclick = () => {
      linkInput.focus();
      linkInput.select();
    };
    modal.appendChild(linkInput);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.marginTop = '12px';

    const btnClose = document.createElement('button');
    btnClose.className = 'secondary';
    btnClose.textContent = 'Zapri';
    const btnCopy = document.createElement('button');
    btnCopy.textContent = 'Kopiraj';

    const cleanup = () => {
      overlay.remove();
      resolve();
    };
    btnClose.onclick = cleanup;
    btnCopy.onclick = async () => {
      // Select and then attempt copy
      linkInput.focus();
      linkInput.select();
      await copyText(url);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup();
    };

    actions.appendChild(btnClose);
    actions.appendChild(btnCopy);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Preselect for easier manual copy
    linkInput.focus();
    linkInput.select();
  });
}

// Modal helper for viewing and adding comments.
function openCommentsModal(file) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = '100%';
    modal.style.maxWidth = '520px';
    modal.style.maxHeight = '90vh';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.overflow = 'hidden';

    const title = document.createElement('h3');
    title.textContent = `Komentarji – ${file.original_name}`;
    modal.appendChild(title);

    const list = document.createElement('div');
    list.className = 'comments-list';
    list.style.flex = '1';
    list.style.overflowY = 'auto';
    list.textContent = 'Nalagam komentarje...';
    modal.appendChild(list);

    const inputWrapper = document.createElement('div');
    inputWrapper.style.marginTop = '12px';
    inputWrapper.style.display = 'flex';
    inputWrapper.style.flexDirection = 'column';
    inputWrapper.style.gap = '8px';
    const ta = document.createElement('textarea');
    ta.rows = 3;
    ta.placeholder = 'Napiši komentar...';
    ta.style.resize = 'vertical';
    const actionsRow = document.createElement('div');
    actionsRow.className = 'actions';
    actionsRow.style.marginTop = '8px';
    const btnClose = document.createElement('button');
    btnClose.className = 'secondary';
    btnClose.textContent = 'Zapri';
    btnClose.style.width = 'auto';
    const btnSend = document.createElement('button');
    btnSend.textContent = 'Pošlji';
    btnSend.style.width = 'auto';
    actionsRow.appendChild(btnClose);
    actionsRow.appendChild(btnSend);
    inputWrapper.appendChild(ta);
    inputWrapper.appendChild(actionsRow);
    modal.appendChild(inputWrapper);

    async function refreshComments() {
      try {
        const data = await listComments(file.id);
        list.textContent = '';
        if (!data.comments || !data.comments.length) {
          list.textContent = 'Ni komentarjev.';
        } else {
          data.comments.forEach(c => {
            const li = document.createElement('div');
            li.textContent = `${new Date(c.created_at).toLocaleString()} — ${c.author || 'uporabnik'}: ${c.body}`;
            list.appendChild(li);
          });
        }
      } catch (e) {
        list.textContent = e.message || 'Napaka nalaganja komentarjev.';
      }
    }
    btnSend.onclick = async () => {
      const val = ta.value.trim();
      if (!val) return;
      try {
        await addComment(file.id, val);
        ta.value = '';
        await refreshComments();
        showToast('Komentar dodan.', 'ok');
      } catch (e) {
        showToast(e.message || 'Napaka pri dodajanju komentarja.', 'error');
      }
    };

    btnClose.onclick = () => cleanup();

    function cleanup() {
      overlay.remove();
      resolve();
    }
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup();
    };
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    refreshComments();
    ta.focus();
  });
}


// downloads files by calling the backend and forcing browser download

async function downloadFile(fileId, filename) {
  try {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Prenos ni uspel.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'datoteka';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast(e.message || 'Prenos ni uspel.', 'error');
  }
}

async function copyText(txt) {
  // 1) Try modern clipboard API (works on secure contexts)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(txt);
      showToast('Kopirano v odložišče.', 'ok');
      return true;
    }
  } catch (_) {
    // fall through to legacy fallback
  }

  // 2) Legacy fallback (works on many http pages)
  try {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) {
      showToast('Kopirano v odložišče.', 'ok');
      return true;
    }
  } catch (_) {
    // ignore
  }
  showToast('Kopiranje ni uspelo. Kopiraj ročno (Ctrl+C).', 'error', 5000);
  return false;
}

function renderCommentsUI(fileId) {
  const box = document.createElement('div');
  box.className = 'comments';

  const inputWrapper = document.createElement('div');
  inputWrapper.style.display = 'flex';
  inputWrapper.style.flexDirection = 'column';
  inputWrapper.style.gap = '6px';
  inputWrapper.style.marginBottom = '8px';

  const ta = document.createElement('textarea');
  ta.rows = 2;
  ta.placeholder = 'Napiši komentar...';

  const sendRow = document.createElement('div');
  sendRow.style.display = 'flex';
  sendRow.style.justifyContent = 'flex-end';

  const btn = document.createElement('button');
  btn.textContent = 'Pošlji komentar';
  btn.style.width = 'auto';
  btn.style.marginTop = '0';

  sendRow.appendChild(btn);
  inputWrapper.appendChild(ta);
  inputWrapper.appendChild(sendRow);

  const list = document.createElement('div');
  list.className = 'comments-list';
  list.textContent = 'Nalagam komentarje...';

  box.appendChild(inputWrapper);
  box.appendChild(list);

  async function refreshComments() {
    try {
      const data = await listComments(fileId);
      list.textContent = '';
      if (!data.comments || !data.comments.length) {
        list.textContent = 'Ni komentarjev.';
      } else {
        data.comments.forEach(c => {
          const li = document.createElement('div');
          li.textContent = `${new Date(c.created_at).toLocaleString()} — ${c.author || 'uporabnik'}: ${c.body}`;
          list.appendChild(li);
        });
      }
    } catch (e) {
      list.textContent = e.message || 'Napaka nalaganja komentarjev.';
    }
  }

  btn.onclick = async () => {
    const val = ta.value.trim();
    if (!val) return;
    try {
      await addComment(fileId, val);
      ta.value = '';
      await refreshComments();
    } catch (e) {
      showToast(e.message || 'Napaka pri dodajanju komentarja.', 'error');
    }
  };

  // Initial load
  refreshComments();

  return box;
}

function renderActionsForOwned(file) {
  const wrap = document.createElement('div');
  wrap.className = 'actions-owned';

  // Share to user
  const btnShare  = createIconButton('share', 'Daj v skupno rabo');
  btnShare.onclick = async () => {
    try {
      const res = await openShareModal(file);
      if (!res) return;
      await shareFileToUser((file.id ?? file.file_id), res.username, res.canDownload);
      showToast('Skupna raba je dodana.', 'ok');
    } catch (e) {
      showToast(e.message || 'Napaka pri skupni rabi.', 'error');
    }
  };
  wrap.appendChild(btnShare);

  // Create link share
  const btnLink   = createIconButton('link-share', 'Link za prenos');
  btnLink.onclick = async () => {
    try {
      const res = await openLinkShareModal(file);
      if (!res) return;
      const { days, maxDownloads } = res;
      const { url } = await createLinkShare(
        (file.id ?? file.file_id),
        days,
        maxDownloads
      );
      // Show the link in a modal; user can copy manually.
      await openCopyLinkModal(url);
    } catch (e) {
      showToast(e.message || 'Napaka pri ustvarjanju linka.', 'error');
    }
  };
  wrap.appendChild(btnLink);

  // Delete file
  const btnDelete = createIconButton('delete', 'Izbriši');
  btnDelete.onclick = async () => {
    const ok = await confirmModal('Ali res želiš izbrisati to datoteko?');
    if (!ok) return;
    try {
      await authDelete(`/files/${file.id ?? file.file_id}`);
      await loadFiles();
      showToast('Datoteka izbrisana.', 'ok');
    } catch (e) {
      showToast(e.message || 'Napaka pri brisanju datoteke.', 'error');
    }
  };
  wrap.appendChild(btnDelete);

  return wrap;
}

function renderRow(file, isShared = false) {
  const row = document.createElement('div');
  row.className = 'file-row';

  const top = document.createElement('div');
  top.className = 'file-top';

  const left = document.createElement('div');

  const titleEl = document.createElement('div');
  titleEl.className = 'file-title';
  titleEl.textContent = file.original_name;
  left.appendChild(titleEl);

  const metaEl = document.createElement('div');
  metaEl.className = 'file-meta';

  const sizeVal = file.size_bytes ?? file.sizeBytes ?? file.size ?? 0;
  const sizeSpan = document.createElement('span');
  sizeSpan.textContent = humanKB(sizeVal);
  metaEl.appendChild(sizeSpan);

  const created = file.created_at || file.createdAt;
  if (created) {
    const dateSpan = document.createElement('span');
    dateSpan.textContent = new Date(created).toLocaleString();
    metaEl.appendChild(dateSpan);
  }

  if (isShared) {
    const sharedSpan = document.createElement('span');
    sharedSpan.textContent = 'v skupni rabi';
    metaEl.appendChild(sharedSpan);
  }

  left.appendChild(metaEl);
  top.appendChild(left);

  const right = document.createElement('div');
  right.className = 'actions';

  const fileId = file.id ?? file.file_id;

  // Single download button (works for both owned and shared)
  const btnDl = createIconButton('download', 'Prenesi');
  btnDl.onclick = () => downloadFile(fileId, file.original_name);
  right.appendChild(btnDl);

  // Comments modal
  const btnC = createIconButton('comment', 'Komentarji');
  btnC.onclick = () => {
    openCommentsModal({ id: fileId, original_name: file.original_name });
  };
  right.appendChild(btnC);

  // Owner-only actions: share, link, delete
  if (!isShared) {
    right.appendChild(renderActionsForOwned(file));
  }

  top.appendChild(right);
  row.appendChild(top);

  return row;
}

async function loadFiles() {
  const ownList = document.getElementById('fileList');
  const sharedList = document.getElementById('sharedList');
  ownList.textContent = 'Nalagam...';
  sharedList.textContent = 'Nalagam...';

  try {
    const own = await authGet('/files');
    const incoming = await listIncomingShares();

    ownList.textContent = '';
    sharedList.textContent = '';

    if (!own.files || !own.files.length) {
      ownList.textContent = 'Ni datotek.';
    } else {
      own.files.forEach(f => ownList.appendChild(renderRow(f, false)));
    }

    if (!incoming.items || !incoming.items.length) {
      sharedList.textContent = 'Ni deljenih datotek.';
    } else {
      incoming.items.forEach(s => {
        const f = {
          id: s.file_id,
          original_name: s.original_name,
          size_bytes: s.size_bytes,
          created_at: s.created_at
        };
        sharedList.appendChild(renderRow(f, true));
      });
    }
  } catch (err) {
    ownList.textContent = err.message || 'Napaka nalaganja.';
    sharedList.textContent = '';
  }
}

function initDrive() {
  requireTokenOrRedirect();
  loadFiles();

  const fileInput = document.getElementById('fileInput');
  const uploadMsg = document.getElementById('uploadMsg');
  const fileLabelSpan = document.getElementById('fileInputLabel');
  const fakeWrapper = document.querySelector('.file-input-fake');

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (fileLabelSpan) {
        fileLabelSpan.textContent = file.name;
      }
      if (fakeWrapper) {
        fakeWrapper.classList.add('has-file');
      }

      if (uploadMsg) {
        uploadMsg.textContent = '';
        uploadMsg.className = 'msg';
      }

      try {
        const fd = new FormData();
        fd.append('file', file);
        await authUpload('/files/upload', fd);

        if (uploadMsg) {
          uploadMsg.textContent = 'Nalaganje uspešno.';
          uploadMsg.className = 'msg ok';
        }

        fileInput.value = '';
        if (fileLabelSpan) {
          fileLabelSpan.textContent = 'Naloži datoteko';
        }
        if (fakeWrapper) {
          fakeWrapper.classList.remove('has-file');
        }

        await loadFiles();
      } catch (err) {
        if (uploadMsg) {
          uploadMsg.textContent = err.message || 'Napaka pri nalaganju.';
          uploadMsg.className = 'msg error';
        }
      }
    });
  }
}
