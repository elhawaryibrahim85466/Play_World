// =====================================================
//  PlayWorld — Shared App Logic (Firebase Version)
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

  // ===== Current User =====
  userId: null,
  balance: 0,
  isReady: false,

  // ===== Init =====
  async init() {
    // Get Telegram user
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        this.userId = String(tg.initDataUnsafe.user.id);
      }
    }

    if (!this.userId) {
      console.warn('No Telegram user ID found');
      this.userId = 'unknown_' + Date.now();
    }

    // Load from Firebase
    await this.loadBalance();

    // Update UI
    this.updateBalanceUI();
    this.isReady = true;
  },

  // ===== Load Balance from Firebase =====
  async loadBalance() {
    try {
      if (!window.PWFirebase) {
        console.warn('Firebase not loaded, using localStorage');
        this.balance = Number(localStorage.getItem(this.KEYS.BALANCE)) || 1000;
        return;
      }

      const data = await window.PWFirebase.getUserData(this.userId);

      if (data && typeof data.balance === 'number') {
        this.balance = data.balance;
      } else {
        // New user
        this.balance = 1000;
        await window.PWFirebase.createUser(this.userId, {
          userId: this.userId,
          balance: 1000,
          createdAt: new Date()
        });
      }

      // Also save to localStorage as cache
      localStorage.setItem(this.KEYS.BALANCE, this.balance);
    } catch (e) {
      console.error('loadBalance error:', e);
      this.balance = Number(localStorage.getItem(this.KEYS.BALANCE)) || 1000;
    }
  },

  // ===== Save Balance to Firebase =====
  async saveBalance() {
    try {
      localStorage.setItem(this.KEYS.BALANCE, this.balance);

      if (window.PWFirebase) {
        await window.PWFirebase.updateBalance(this.userId, this.balance);
      }
    } catch (e) {
      console.error('saveBalance error:', e);
    }
  },

  // ===== Helpers =====
  roundHalf(v) {
    return Math.round(v * 2) / 2;
  },

  formatBalance(v) {
    if (v % 1 === 0) return v.toLocaleString();
    return v.toFixed(1);
  },

  // ===== Balance =====
  getBalance() {
    return this.balance;
  },

  setBalance(v) {
    this.balance = this.roundHalf(v);
    this.saveBalance();
    this.updateBalanceUI();
  },

  addBalance(amount) {
    const old = this.balance;
    this.balance = this.roundHalf(old + amount);
    this.saveBalance();
    this.animateBalance(old, this.balance);
    this.popBalanceCard();
    return this.balance;
  },

  updateBalanceUI() {
    const txt = this.formatBalance(this.balance);
    document.querySelectorAll('[data-balance]').forEach(el => {
      el.innerText = txt;
    });
  },

  animateBalance(from, to, duration = 700) {
    const els = document.querySelectorAll('[data-balance]');
    if (!els.length) return;
    const start = performance.now();
    const self = this;
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
  }
};

// ===== Start on load =====
window.addEventListener('load', () => PW.init());

// Export for modules
window.PW = PW;
