/* ================= GOAL ================= */
const GOAL_DATE = new Date('2026-12-31');

/* ================= FALLBACK (if /data.json unavailable) ================= */
const FALLBACK = {
  startDebt: 71000,
  currentDebt: 53336.68,
  prevDebt: 54183.66,
  lastUpdated: '2026-05-29',
  cards: [
    { name: 'Chase Business Ink',       type: 'Business', balance: 34924.99, min: 765, limit: 50000, apr: 6.00 },
    { name: 'Blue Business Plus',       type: 'Business', balance: 12321.59, min: 472, limit: 15000, apr: 5.00 },
    { name: 'Chase Sapphire Preferred', type: 'Personal', balance:  4183.66, min:  95, limit:  5000, apr: 6.00 },
    { name: 'Blue Business Cash',       type: 'Business', balance:  1176.85, min:  45, limit: 10000, apr: 5.00 },
    { name: 'Amex Gold',                type: 'Personal', balance:   729.59, min:  30, limit:  1500, apr: 5.00 },
    { name: 'Member First (Secured)',   type: 'Personal', balance:     0.00, min:   0, limit:   250, apr: 14.29, closed: true },
    { name: 'Members Cash Rewards',     type: 'Personal', balance:     0.00, min:   0, limit:  3500, apr: 20.29, closed: true },
  ],
  transactions: [
    { date: '2026-05-28', desc: 'Chase Business Ink — monthly minimum', amount: 765,  type: 'payment'  },
    { date: '2026-05-28', desc: 'Blue Business Plus — monthly minimum', amount: 472,  type: 'payment'  },
    { date: '2026-05-28', desc: 'Chase Sapphire — monthly minimum',     amount:  95,  type: 'payment'  },
    { date: '2026-05-28', desc: 'Blue Business Cash — monthly minimum', amount:  45,  type: 'payment'  },
    { date: '2026-05-28', desc: 'Amex Gold — monthly minimum',          amount:  30,  type: 'payment'  },
    { date: '2026-05-06', desc: 'Interest charged — business cards',    amount: 218,  type: 'interest' },
    { date: '2026-04-28', desc: 'Chase Business Ink — monthly minimum', amount: 765,  type: 'payment'  },
    { date: '2026-04-28', desc: 'Blue Business Plus — monthly minimum', amount: 472,  type: 'payment'  },
    { date: '2026-04-28', desc: 'Chase Sapphire — monthly minimum',     amount:  95,  type: 'payment'  },
    { date: '2026-04-28', desc: 'Blink partnership payment received',   amount: 3000, type: 'income'   },
    { date: '2026-04-07', desc: 'Interest charged — business cards',    amount: 221,  type: 'interest' },
  ],
};

/* ================= HELPERS ================= */
const $ = (sel) => document.querySelector(sel);

const fmtMoney = (n, decimals = 0) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ================= RENDER: LEDGER ================= */
function renderLedger(d) {
  const paidOff  = d.startDebt - d.currentDebt;
  const pct      = (paidOff / d.startDebt) * 100;
  const delta    = d.prevDebt - d.currentDebt;
  const daysLeft = Math.max(0, Math.ceil((GOAL_DATE - new Date()) / 86400000));

  $('#last-updated').textContent = fmtDate(d.lastUpdated);
  $('#delta-badge').textContent  = `↓ ${fmtMoney(delta)} since last update`;

  (function () {
    const el = $('#debt-number');
    const from = d.startDebt, to = d.currentDebt, duration = 1600;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = fmtMoney(from + (to - from) * ease(t), 2);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  $('#paid-off').textContent    = `−${fmtMoney(paidOff)}`;
  $('#progress-pct').textContent = pct.toFixed(1) + '%';
  setTimeout(() => { $('#progress-fill').style.width = pct.toFixed(1) + '%'; }, 300);

  $('#card-rows').innerHTML = d.cards.map((c) => {
    const paid    = Math.max(0, c.limit - c.balance);
    const cardPct = Math.round((paid / c.limit) * 100);
    return `<div class="card-row${c.closed ? ' card-row--closed' : ''}">
      <div class="card-row-top">
        <span class="card-name">${c.name}${c.apr != null ? ` <span class="card-apr">${c.apr}% APR</span>` : ''}</span>
        <span class="card-type">${c.closed ? 'CLOSED ✓' : c.type}</span>
      </div>
      <div class="card-bar-wrap">
        <div class="card-bar"><div class="card-bar-fill" style="width:${cardPct}%"></div></div>
        <span class="card-pct">${cardPct}% paid</span>
      </div>
      <div class="card-amounts">
        <span class="paid">${fmtMoney(paid)} paid</span>
        <span class="remaining"> · ${fmtMoney(c.balance, 2)} remaining</span>
      </div>
    </div>`;
  }).join('');

  const icons  = { payment: '↓', interest: '↑', income: '+', expense: '−' };
  const recent = [...d.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  $('#txn-rows').innerHTML = recent.map((t) =>
    `<div class="txn-row">
      <span class="txn-icon ${t.type}">${icons[t.type] || '·'}</span>
      <span class="txn-body">
        <span class="txn-desc">${t.desc}</span><br>
        <span class="txn-date">${fmtDate(t.date)}</span>
      </span>
      <span class="txn-amount ${t.type}">${t.type === 'interest' || t.type === 'expense' ? '+' : ''}${fmtMoney(t.amount)}</span>
    </div>`
  ).join('');
}

/* ================= EMAIL FORMS ================= */
async function subscribe(email, source) {
  const body = { email, source };
  if (source === 'debt-wars-early') body.tag = 'debt-wars-early';
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('subscribe failed');
}

function wireForms() {
  document.querySelectorAll('.email-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email  = form.email.value.trim();
      const source = form.dataset.source;
      const msg    = form.parentElement.querySelector('.form-msg');
      const btn    = form.querySelector('button');
      btn.disabled    = true;
      btn.textContent = '...';
      try {
        await subscribe(email, source);
        if (source === 'war-chest') {
          localStorage.setItem('warchest_unlocked', '1');
          unlockWarChest();
        } else if (msg) {
          msg.textContent = source === 'debt-wars-early'
            ? "You're on the list. ⚔️"
            : "You're in. See you Sunday.";
          msg.className = 'form-msg ok';
          msg.hidden    = false;
          form.reset();
        }
      } catch {
        if (msg) {
          msg.textContent = 'Something broke. Try again or DM me @ljrbuilds.';
          msg.className   = 'form-msg err';
          msg.hidden      = false;
        }
      } finally {
        btn.disabled    = false;
        btn.textContent = source === 'war-chest'       ? 'Get Access'
                        : source === 'debt-wars-early' ? "I'm In"
                        : 'Subscribe';
      }
    });
  });
}

/* ================= WAR CHEST ================= */
function unlockWarChest() {
  const overlay = document.getElementById('warchest-overlay');
  const blur    = document.querySelector('.warchest-blur');
  const success = document.getElementById('warchest-success');
  if (overlay) overlay.style.display = 'none';
  if (blur)    { blur.style.filter = 'none'; blur.style.userSelect = 'auto'; }
  if (success) success.hidden = false;
}

function checkWarChestUnlock() {
  if (localStorage.getItem('warchest_unlocked') === '1') unlockWarChest();
}

/* ================= COPY CODES ================= */
function wireCopyCodes() {
  document.querySelectorAll('.copy-code').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  });
}

/* ================= INIT ================= */
// Data priority: War Room saves (KV via /api/data) → static data.json backup →
// hardcoded FALLBACK. Luke edits day-to-day through the War Room panel, which
// writes to KV, so /api/data is authoritative. data.json is a code-side backup.
async function init() {
  // Ledger only lives on the home page — skip the fetch/render elsewhere (e.g. about.html).
  if (document.getElementById('debt-number')) {
    let data = FALLBACK;
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        data = { ...FALLBACK, ...(await res.json()) };
      } else {
        const backup = await fetch('/data.json', { cache: 'no-store' });
        if (backup.ok) data = { ...FALLBACK, ...(await backup.json()) };
      }
    } catch {}
    renderLedger(data);
  }
  wireForms();
  checkWarChestUnlock();
  wireCopyCodes();
}

init();
