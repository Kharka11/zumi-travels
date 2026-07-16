/* ══════════════════════════════════════════════
   ZUMI Travels — Admin Dashboard
══════════════════════════════════════════════ */

let TOKEN = localStorage.getItem('dt_token') || '';
let ADMIN = JSON.parse(localStorage.getItem('dt_admin') || 'null');

let allInquiries   = [];
let allAdmins      = [];
let allSubscribers = [];
let activeInquiryId = null;

// ── API helper ───────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN }
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const json = await res.json();
  if (res.status === 401) { logout(); return; }
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (TOKEN && ADMIN) {
    showApp();
  } else {
    showLogin();
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    err.style.display = 'none';
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('loginEmail').value.trim(),
          password: document.getElementById('loginPassword').value
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      TOKEN = json.token;
      ADMIN = json.admin;
      localStorage.setItem('dt_token', TOKEN);
      localStorage.setItem('dt_admin', JSON.stringify(ADMIN));
      showApp();
    } catch (ex) {
      err.textContent = ex.message;
      err.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.dataset.tab);
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  document.getElementById('subsSearch')?.addEventListener('input', renderSubscribersTable);
  document.getElementById('inquirySearch').addEventListener('input', renderInquiriesTable);
  document.getElementById('inquiryReadFilter').addEventListener('change', renderInquiriesTable);

  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('pwError');
    const suc = document.getElementById('pwSuccess');
    err.style.display = 'none'; suc.style.display = 'none';
    const np = document.getElementById('newPassword').value;
    const cp = document.getElementById('confirmPassword').value;
    if (np !== cp) { err.textContent = 'Passwords do not match'; err.style.display = 'block'; return; }
    try {
      await api('POST', '/api/admin/change-password', {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: np
      });
      suc.textContent = 'Password updated successfully!';
      suc.style.display = 'block';
      e.target.reset();
    } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
  });
});

// ── Show/hide pages ───────────────────────────
function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminApp').style.display  = 'none';
}

function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminApp').style.display  = 'flex';
  populateAdminInfo();
  switchTab('dashboard');
  loadStats();
}

function populateAdminInfo() {
  if (!ADMIN) return;
  const initials = ADMIN.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatarSidebar').textContent = initials;
  document.getElementById('adminNameSidebar').textContent   = ADMIN.name;
  document.getElementById('adminNameTop').textContent       = ADMIN.name;
  document.getElementById('settingsName').textContent       = ADMIN.name;
  document.getElementById('settingsEmail').textContent      = ADMIN.email;
}

function logout() {
  TOKEN = ''; ADMIN = null;
  localStorage.removeItem('dt_token');
  localStorage.removeItem('dt_admin');
  showLogin();
}

// ── Tab switching ─────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  document.querySelector(`.nav-item[data-tab="${name}"]`)?.classList.add('active');

  const titles = { dashboard:'Dashboard', inquiries:'Inquiries', subscribers:'Subscribers', admins:'Team', settings:'Settings' };
  document.getElementById('pageTitle').textContent = titles[name] || name;

  if (name === 'dashboard')   { loadStats(); loadDashRecentInquiries(); }
  if (name === 'inquiries')   loadInquiries();
  if (name === 'subscribers') loadSubscribers();
  if (name === 'admins')      loadAdmins();
}

// ── Stats ─────────────────────────────────────
async function loadStats() {
  try {
    const s = await api('GET', '/api/admin/stats');
    document.getElementById('st-inquiries').textContent   = s.totalInquiries;
    document.getElementById('st-unread').textContent      = s.unreadInquiries;
    document.getElementById('st-subscribers').textContent = s.totalSubscribers;

    const ub = document.getElementById('unreadBadge');
    const sb = document.getElementById('subsBadge');
    if (s.unreadInquiries  > 0) { ub.textContent = s.unreadInquiries;  ub.style.display = 'inline-flex'; } else ub.style.display = 'none';
    if (s.totalSubscribers > 0) { sb.textContent = s.totalSubscribers; sb.style.display = 'inline-flex'; } else sb.style.display = 'none';
  } catch {}
}

// ── Dashboard recent ──────────────────────────
async function loadDashRecentInquiries() {
  const container = document.getElementById('dashRecentInquiries');
  try {
    const inquiries = await api('GET', '/api/admin/inquiries');
    const recent = inquiries.slice(0, 5);
    if (!recent.length) { container.innerHTML = '<p class="empty-msg">No inquiries yet.</p>'; return; }
    container.innerHTML = `<table>
      <thead><tr><th>#</th><th>From</th><th>Subject</th><th>Received</th><th>Status</th></tr></thead>
      <tbody>${recent.map(i => `
        <tr style="cursor:pointer" onclick="switchTab('inquiries')">
          <td>${i.id}</td>
          <td><div class="cell-name">${esc(i.name)}</div><div class="cell-email">${esc(i.email)}</div></td>
          <td>${esc(i.subject || 'General enquiry')}</td>
          <td class="cell-date">${formatDateTime(i.created_at)}</td>
          <td><span class="status-badge ${i.read ? 's-read' : 's-unread'}">${i.read ? 'Read' : 'Unread'}</span></td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch (ex) { container.innerHTML = `<p class="empty-msg">Error: ${ex.message}</p>`; }
}

// ── Inquiries ─────────────────────────────────
async function loadInquiries() {
  const container = document.getElementById('inquiriesTable');
  container.innerHTML = '<p class="empty-msg">Loading…</p>';
  try {
    allInquiries = await api('GET', '/api/admin/inquiries');
    renderInquiriesTable();
  } catch (ex) { container.innerHTML = `<p class="empty-msg">Error: ${ex.message}</p>`; }
}

function renderInquiriesTable() {
  const q    = document.getElementById('inquirySearch').value.toLowerCase();
  const read = document.getElementById('inquiryReadFilter').value;
  const filtered = allInquiries.filter(i => {
    const matchQ = !q || [i.name, i.email, i.subject || ''].join(' ').toLowerCase().includes(q);
    const matchR = !read || (read === 'read' ? i.read : !i.read);
    return matchQ && matchR;
  });
  const container = document.getElementById('inquiriesTable');
  if (!filtered.length) { container.innerHTML = '<p class="empty-msg">No inquiries found.</p>'; return; }
  container.innerHTML = `<table>
    <thead><tr>
      <th>#</th><th>From</th><th>Subject</th>
      <th>Received</th><th>Status</th><th>Actions</th>
    </tr></thead>
    <tbody>${filtered.map(i => `
      <tr>
        <td>${i.id}</td>
        <td>
          <div class="cell-name">${esc(i.name)}</div>
          <div class="cell-email">${esc(i.email)}</div>
        </td>
        <td>${esc(i.subject || '—')}</td>
        <td class="cell-date">${formatDateTime(i.created_at)}</td>
        <td><span class="status-badge ${i.read ? 's-read' : 's-unread'}">${i.read ? 'Read' : 'Unread'}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-outline" onclick="viewInquiry(${i.id})">View</button>
            <button class="btn btn-sm btn-danger"  onclick="deleteInquiry(${i.id})">Del</button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function viewInquiry(id) {
  const i = allInquiries.find(x => x.id === id);
  if (!i) return;
  activeInquiryId = id;

  const repliedHtml = i.replied_at
    ? `<div class="detail-item detail-full">
         <label>Previous Reply <span style="font-weight:400;color:var(--text-muted)">(sent ${formatDateTime(i.replied_at)})</span></label>
         <p style="white-space:pre-wrap;line-height:1.6;margin-top:.35rem;padding:.75rem;background:var(--forest-lt);border-radius:6px;border-left:3px solid var(--forest)">${esc(i.reply_text)}</p>
       </div>`
    : '';

  document.getElementById('inquiryDetailBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Name</label><span>${esc(i.name)}</span></div>
      <div class="detail-item"><label>Email</label><span>${esc(i.email)}</span></div>
      <div class="detail-item"><label>Phone</label><span>${esc(i.phone || '—')}</span></div>
      <div class="detail-item"><label>Subject</label><span>${esc(i.subject || '—')}</span></div>
      <div class="detail-item"><label>Received</label><span>${formatDateTime(i.created_at)}</span></div>
      <div class="detail-item"><label>Status</label><span class="status-badge ${i.read ? 's-read' : 's-unread'}">${i.read ? 'Read' : 'Unread'}</span></div>
      <div class="detail-item detail-full"><label>Message</label><p style="white-space:pre-wrap;line-height:1.6;margin-top:.35rem">${esc(i.message)}</p></div>
      ${repliedHtml}
      <div class="detail-item detail-full">
        <label>Admin Notes</label>
        <textarea class="notes-area" id="inquiryNotes" placeholder="Add internal notes…">${esc(i.notes || '')}</textarea>
      </div>
    </div>
    <div style="border-top:1px solid var(--border);padding:1.25rem 1.5rem;margin:0 -1.5rem -1.5rem">
      <div id="replyResult" class="alert" style="display:none;margin-bottom:.75rem"></div>
      <div class="field" style="margin-bottom:.75rem">
        <label style="font-size:.8rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)">Reply Subject</label>
        <input type="text" id="replySubject" value="${esc(i.subject ? 'Re: ' + i.subject : 'Re: Your enquiry | ZUMI Travels')}" style="margin-top:.35rem" />
      </div>
      <div class="field" style="margin-bottom:.75rem">
        <label style="font-size:.8rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)">Reply to ${esc(i.name)}</label>
        <textarea id="replyMessage" rows="5" placeholder="Write your reply here…" style="margin-top:.35rem;resize:vertical"></textarea>
      </div>
      <button class="btn btn-primary" onclick="sendInquiryReply()" id="replyBtn">Send Reply</button>
    </div>`;

  const btn = document.getElementById('markReadBtn');
  btn.textContent = i.read ? 'Mark as Unread' : 'Mark as Read';
  openModal('inquiryDetailOverlay', 'inquiryDetailModal');
  if (!i.read) markInquiryRead();
}

async function sendInquiryReply() {
  const subject = document.getElementById('replySubject').value.trim();
  const message = document.getElementById('replyMessage').value.trim();
  const btn     = document.getElementById('replyBtn');
  const result  = document.getElementById('replyResult');

  if (!message) { result.className = 'alert alert-error'; result.textContent = 'Please write a reply message.'; result.style.display = 'block'; return; }

  btn.disabled = true; btn.textContent = 'Sending…';
  result.style.display = 'none';

  try {
    const updated = await api('POST', `/api/admin/inquiries/${activeInquiryId}/reply`, { subject, message });
    const i = allInquiries.find(x => x.id === activeInquiryId);
    if (i) Object.assign(i, updated);

    result.className = 'alert alert-success';
    result.textContent = updated.emailSent
      ? 'Reply sent successfully.'
      : 'Reply saved. Email not configured: add EMAIL_USER and EMAIL_PASS in .env to enable sending.';
    result.style.display = 'block';
    document.getElementById('replyMessage').value = '';
    renderInquiriesTable();
    loadStats();
  } catch (ex) {
    result.className = 'alert alert-error';
    result.textContent = ex.message;
    result.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'Send Reply';
  }
}

async function markInquiryRead() {
  const i = allInquiries.find(x => x.id === activeInquiryId);
  if (!i) return;
  try {
    const updated = await api('PATCH', `/api/admin/inquiries/${activeInquiryId}`, {
      read: !i.read,
      notes: document.getElementById('inquiryNotes')?.value
    });
    Object.assign(i, updated);
    document.getElementById('markReadBtn').textContent = i.read ? 'Mark as Unread' : 'Mark as Read';
    renderInquiriesTable();
    loadStats();
  } catch (ex) { alert('Error: ' + ex.message); }
}

function deleteInquiry(id) {
  showConfirm('Delete this inquiry? This cannot be undone.', async () => {
    await api('DELETE', `/api/admin/inquiries/${id}`);
    allInquiries = allInquiries.filter(i => i.id !== id);
    renderInquiriesTable();
    loadStats();
  });
}

// ── Team (Admin accounts) ─────────────────────
async function loadAdmins() {
  const container = document.getElementById('adminsTable');
  container.innerHTML = '<p class="empty-msg">Loading…</p>';
  try {
    allAdmins = await api('GET', '/api/admin/admins');
    renderAdminsTable();
  } catch (ex) { container.innerHTML = `<p class="empty-msg">Error: ${ex.message}</p>`; }
}

function renderAdminsTable() {
  const container = document.getElementById('adminsTable');
  if (!allAdmins.length) { container.innerHTML = '<p class="empty-msg">No team members found.</p>'; return; }
  container.innerHTML = `<table>
    <thead><tr>
      <th>#</th><th>Name</th><th>Email</th><th>Added</th><th>Actions</th>
    </tr></thead>
    <tbody>${allAdmins.map(a => `
      <tr>
        <td>${a.id}</td>
        <td class="cell-name">${esc(a.name)}</td>
        <td>${esc(a.email)}</td>
        <td class="cell-date">${formatDateTime(a.created_at)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-outline" onclick="editAdmin(${a.id})">Edit</button>
            ${a.id !== ADMIN.id ? `<button class="btn btn-sm btn-danger" onclick="deleteAdmin(${a.id})">Remove</button>` : '<span class="cell-email">You</span>'}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function openAddAdminModal() {
  document.getElementById('addAdminTitle').textContent   = 'Add Team Member';
  document.getElementById('editAdminId').value           = '';
  document.getElementById('adminName').value             = '';
  document.getElementById('adminEmail').value            = '';
  document.getElementById('adminPassword').value         = '';
  document.getElementById('adminPassword').required      = true;
  document.getElementById('pwHint').textContent          = '(required)';
  document.getElementById('addAdminError').style.display = 'none';
  openModal('addAdminOverlay', 'addAdminModal');
}

function editAdmin(id) {
  const a = allAdmins.find(x => x.id === id);
  if (!a) return;
  document.getElementById('addAdminTitle').textContent   = 'Edit Team Member';
  document.getElementById('editAdminId').value           = a.id;
  document.getElementById('adminName').value             = a.name;
  document.getElementById('adminEmail').value            = a.email;
  document.getElementById('adminPassword').value         = '';
  document.getElementById('adminPassword').required      = false;
  document.getElementById('pwHint').textContent          = '(leave blank to keep current)';
  document.getElementById('addAdminError').style.display = 'none';
  openModal('addAdminOverlay', 'addAdminModal');
}

async function saveAdmin() {
  const id       = document.getElementById('editAdminId').value;
  const name     = document.getElementById('adminName').value.trim();
  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const err      = document.getElementById('addAdminError');
  err.style.display = 'none';

  try {
    if (id) {
      const body = { name };
      if (password) body.password = password;
      const updated = await api('PATCH', `/api/admin/admins/${id}`, body);
      const idx = allAdmins.findIndex(a => a.id === +id);
      if (idx !== -1) allAdmins[idx] = updated;
    } else {
      if (!password) { err.textContent = 'Password is required'; err.style.display = 'block'; return; }
      const created = await api('POST', '/api/admin/admins', { name, email, password });
      allAdmins.unshift(created);
    }
    renderAdminsTable();
    closeModal('addAdminOverlay');
  } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
}

function deleteAdmin(id) {
  showConfirm('Remove this team member? They will lose access immediately.', async () => {
    await api('DELETE', `/api/admin/admins/${id}`);
    allAdmins = allAdmins.filter(a => a.id !== id);
    renderAdminsTable();
  });
}

// ── Subscribers ───────────────────────────────
async function loadSubscribers() {
  const container = document.getElementById('subscribersTable');
  container.innerHTML = '<p class="empty-msg">Loading…</p>';
  try {
    allSubscribers = await api('GET', '/api/admin/subscribers');
    renderSubscribersTable();
  } catch (ex) { container.innerHTML = `<p class="empty-msg">Error: ${ex.message}</p>`; }
}

function renderSubscribersTable() {
  const q = (document.getElementById('subsSearch')?.value || '').toLowerCase();
  const filtered = allSubscribers.filter(s =>
    !q || [s.email, s.name || ''].join(' ').toLowerCase().includes(q)
  );
  const count = document.getElementById('subsCount');
  if (count) count.textContent = `${allSubscribers.length} subscriber${allSubscribers.length !== 1 ? 's' : ''}`;

  const container = document.getElementById('subscribersTable');
  if (!filtered.length) { container.innerHTML = '<p class="empty-msg">No subscribers yet.</p>'; return; }
  container.innerHTML = `<table>
    <thead><tr>
      <th>#</th><th>Email</th><th>Name</th><th>Subscribed</th><th>Actions</th>
    </tr></thead>
    <tbody>${filtered.map(s => `
      <tr>
        <td>${s.id}</td>
        <td class="cell-name">${esc(s.email)}</td>
        <td>${esc(s.name || '—')}</td>
        <td class="cell-date">${formatDateTime(s.subscribed_at)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteSubscriber(${s.id})">Remove</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function deleteSubscriber(id) {
  showConfirm('Remove this subscriber from the Dispatch?', async () => {
    await api('DELETE', `/api/admin/subscribers/${id}`);
    allSubscribers = allSubscribers.filter(s => s.id !== id);
    renderSubscribersTable();
    loadStats();
  });
}

function openDispatchModal() {
  document.getElementById('dispatchSubject').value  = '';
  document.getElementById('dispatchMessage').value  = '';
  document.getElementById('dispatchResult').style.display = 'none';
  document.getElementById('dispatchSendBtn').disabled     = false;
  document.getElementById('dispatchSendBtn').textContent  = 'Send to All Subscribers';
  const note = document.getElementById('dispatchSubsNote');
  note.textContent = `${allSubscribers.length} subscriber${allSubscribers.length !== 1 ? 's' : ''} on the list.`;
  openModal('dispatchOverlay', 'dispatchModal');
}

async function sendDispatch() {
  const subject = document.getElementById('dispatchSubject').value.trim();
  const message = document.getElementById('dispatchMessage').value.trim();
  const btn     = document.getElementById('dispatchSendBtn');
  const result  = document.getElementById('dispatchResult');

  if (!subject || !message) {
    result.className = 'alert alert-error';
    result.textContent = 'Subject and message are both required.';
    result.style.display = 'block';
    return;
  }

  btn.disabled = true; btn.textContent = 'Sending…';
  result.style.display = 'none';

  try {
    const res = await api('POST', '/api/admin/subscribers/send-dispatch', { subject, message });
    result.className = 'alert alert-success';
    result.textContent = `Sent to ${res.sent} subscriber${res.sent !== 1 ? 's' : ''}${res.failed ? ` (${res.failed} failed)` : ''}.`;
    result.style.display = 'block';
    btn.textContent = 'Sent';
  } catch (ex) {
    result.className = 'alert alert-error';
    result.textContent = ex.message;
    result.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Send to All Subscribers';
  }
}

// ── Modal helpers ─────────────────────────────
function openModal(overlayId, modalId) {
  document.getElementById(overlayId).classList.add('open');
  document.getElementById(modalId).classList.add('open');
}

function closeModal(overlayId) {
  document.getElementById(overlayId).classList.remove('open');
  const modal = document.getElementById(overlayId.replace('Overlay', 'Modal'));
  if (modal) modal.classList.remove('open');
}

// ── Confirm dialog ────────────────────────────
function showConfirm(msg, cb) {
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmOverlay').classList.add('open');
  document.getElementById('confirmModal').classList.add('open');
  document.getElementById('confirmYes').onclick = async () => {
    closeConfirm();
    try { await cb(); } catch (ex) { alert('Error: ' + ex.message); }
  };
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.remove('open');
  document.getElementById('confirmModal').classList.remove('open');
}

// ── Utilities ─────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

