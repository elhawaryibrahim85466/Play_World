// =====================================================
//  PlayWorld — Shared App Logic
// =====================================================

const PW = {
  KEYS: {
    BALANCE: 'pw_balance',
    DAILY_LOGIN: 'pw_task_login',
    DAILY_PLAY: 'pw_task_play',
    ONCE_TELEGRAM: 'pw_once_telegram',
    VERIFY_TELEGRAM: 'pw_verify_telegram',
    PLAYED_WHEEL: 'pw_played_wheel'
  },

  DAY_MS: 24 * 60 * 60 * 1000,
  VERIFY_SECONDS: 15,

  // ===== Helpers =====
  // Round to nearest 0.5 (e.g. 100.4 → 100.5, 100.25 → 100, 100.75 → 101)
  roundHalf(v) {
    return Math.round(v * 2) / 2;
  },

  // Format for display: 100 → "100", 100.5 → "100.5"
  formatBalance(v) {
    if (v % 1 === 0) return v.toLocaleString();
    return v.toFixed(1);
  },

  // ===== Balance =====
  getBalance() {
    const v = Number(localStorage.getItem(this.KEYS.BALANCE));
    return isNaN(v) ? 1000 : v;
  },

  setBalance(v) {
    const rounded = this.roundHalf(v);
    localStorage.setItem(this.KEYS.BALANCE, rounded);
    this.updateBalanceUI();
  },

  addBalance(amount) {
    const old = this.getBalance();
    const now = this.roundHalf(old + amount);
    localStorage.setItem(this.KEYS.BALANCE, now);
    this.animateBalance(old, now);
    this.popBalanceCard();
    return now;
  },

  updateBalanceUI() {
    const v = this.getBalance();
    const txt = this.formatBalance(v);
    document.querySelectorAll('[data-balance]').forEach(el => {
      el.innerText = txt;
    });
  },

  animateBalance(from, to, duration = 700) {
    const els = document.querySelectorAll('[data-balance]');
    if (!els.length) return;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const raw = from + (to - from) * eased;
      const displayed = Math.round(raw * 2) / 2;
      const txt = (displayed % 1 === 0) ? displayed.toLocaleString() : displayed.toFixed(1);
      els.forEach(el => el.innerText = txt);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  },

  popBalanceCard() {
    document.querySelectorAll('.balance-card').forEach(el => {
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 400);
    });
  },

  // ===== Daily Tasks =====
  getDailyDone(key) {
    const last = Number(localStorage.getItem(key) || 0);
    return Date.now() - last < this.DAY_MS ? last : 0;
  },
  markDailyDone(key) {
    localStorage.setItem(key, Date.now());
  },

  // ===== Once Tasks =====
  isOnceDone(key) {
    return localStorage.getItem(key) === 'done';
  },
  markOnceDone(key) {
    localStorage.setItem(key, 'done');
  },

  // ===== Verify =====
  getVerifyStart(key) {
    return Number(localStorage.getItem(key) || 0);
  },
  startVerify(key) {
    localStorage.setItem(key, Date.now());
  },
  clearVerify(key) {
    localStorage.removeItem(key);
  },

  // ===== Toast =====
  _toastTimer: null,
  showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%) translateY(-100px);background:linear-gradient(135deg,#F59E0B,#D97706);color:#0D0F1D;font-weight:900;font-size:13px;padding:12px 24px;border-radius:99px;box-shadow:0 8px 25px rgba(245,158,11,0.5);z-index:9999;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;font-family:Cairo,sans-serif;white-space:nowrap;';
      document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(-100px)';
    }, 2200);
  },

  // ===== Init =====
  init() {
    this.updateBalanceUI();
  }
};

window.addEventListener('load', () => PW.init());
