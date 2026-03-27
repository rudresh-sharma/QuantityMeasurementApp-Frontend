/**
 * auth.js
 * Handles login, signup, tab switching, password toggle, and validation.
 */

const USERS_KEY = 'qm_users';
const SESSION_KEY = 'qm_session';

// ── Storage helpers ──────────────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

// ── Tab switching with smooth animation ─────────────────────────
function switchTab(tab) {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab   = document.getElementById('loginTab');
  const signupTab  = document.getElementById('signupTab');

  const showForm = tab === 'login' ? loginForm  : signupForm;
  const hideForm = tab === 'login' ? signupForm : loginForm;
  const activeTab   = tab === 'login' ? loginTab  : signupTab;
  const inactiveTab = tab === 'login' ? signupTab : loginTab;

  // Fade out current
  hideForm.style.opacity = '0';
  hideForm.style.transform = 'translateX(-16px)';

  setTimeout(() => {
    hideForm.classList.remove('active-form');
    hideForm.classList.add('hidden-form');
    hideForm.style.display = 'none';

    // Reset and show new form
    showForm.style.display = 'flex';
    showForm.style.opacity = '0';
    showForm.style.transform = 'translateX(16px)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        showForm.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        showForm.style.opacity = '1';
        showForm.style.transform = 'translateX(0)';
        showForm.classList.remove('hidden-form');
        showForm.classList.add('active-form');
      });
    });
  }, 150);

  activeTab.classList.add('active');
  inactiveTab.classList.remove('active');

  // Clear errors on switch
  hideError('loginError');
  hideError('signupError');
}

// ── Password toggle ──────────────────────────────────────────────
function togglePw(id, btn) {
  const input = document.getElementById(id);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.innerHTML = isText ? eyeOpenSVG() : eyeClosedSVG();
}

function eyeOpenSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;
}

function eyeClosedSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`;
}

// ── Inline validators ────────────────────────────────────────────
function validateSignupPw() {
  const pw   = document.getElementById('signupPassword').value;
  const hint = document.getElementById('pwHint');
  hint.classList.toggle('hidden', !(pw.length > 0 && pw.length < 6));
}

function validateMobile() {
  const mob  = document.getElementById('signupMobile').value;
  const hint = document.getElementById('mobileHint');
  hint.classList.toggle('hidden', !(mob.length > 0 && mob.length < 10));
}

// ── Error helpers ────────────────────────────────────────────────
function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => hideError(elId), 3500);
}

function hideError(elId) {
  const el = document.getElementById(elId);
  if (el) el.classList.add('hidden');
}

function markInvalid(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('error');
  el.addEventListener('input', () => el.classList.remove('error'), { once: true });
}

// ── Login ────────────────────────────────────────────────────────
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPassword').value;

  if (!email) { markInvalid('loginEmail'); showError('loginError', 'Please enter your email.'); return; }
  if (!pw)    { markInvalid('loginPassword'); showError('loginError', 'Please enter your password.'); return; }

  const user = getUsers().find(u => u.email === email && u.password === pw);
  if (!user) {
    markInvalid('loginEmail');
    markInvalid('loginPassword');
    showError('loginError', 'Invalid email or password.');
    return;
  }

  setSession(user);
  window.location.href = 'pages/dashboard.html';
}

// ── Signup ───────────────────────────────────────────────────────
function doSignup() {
  const name   = document.getElementById('signupName').value.trim();
  const email  = document.getElementById('signupEmail').value.trim();
  const pw     = document.getElementById('signupPassword').value;
  const mobile = document.getElementById('signupMobile').value.trim();

  if (!name)   { markInvalid('signupName');     showError('signupError', 'Please enter your full name.'); return; }
  if (!email)  { markInvalid('signupEmail');    showError('signupError', 'Please enter your email.'); return; }
  if (!pw)     { markInvalid('signupPassword'); showError('signupError', 'Please enter a password.'); return; }
  if (pw.length < 6) { markInvalid('signupPassword'); showError('signupError', 'Password must be at least 6 characters.'); return; }
  if (!/^\d{10}$/.test(mobile)) { markInvalid('signupMobile'); showError('signupError', 'Enter a valid 10-digit mobile number.'); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    markInvalid('signupEmail');
    showError('signupError', 'This email is already registered.');
    return;
  }

  users.push({ name, email, password: pw, mobile });
  saveUsers(users);
  setSession({ name, email, mobile });
  window.location.href = 'pages/dashboard.html';
}

// ── Auto-redirect if already logged in ──────────────────────────
(function init() {
  if (getSession()) {
    window.location.href = 'pages/dashboard.html';
  }
})();
