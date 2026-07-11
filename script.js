/* ================= DATA ================= */
const START_DEBT   = 71000;
const CURRENT_DEBT = 53336.68;
const PREV_DEBT    = 54183.66;
const LAST_UPDATED = '2026-05-29';
const GOAL_DATE    = new Date('2026-12-31');

const CARDS = [
  { name: 'Chase Business Ink',       type: 'Business', balance: 34924.99, min: 765, limit: 50000 },
  { name: 'Blue Business Plus',       type: 'Business', balance: 12321.59, min: 472, limit: 15000 },
  { name: 'Chase Sapphire Preferred', type: 'Personal', balance:  4183.66, min:  95, limit:  5000 },
  { name: 'Blue Business Cash',       type: 'Business', balance:  1176.85, min:  45, limit: 10000 },
  { name: 'Amex Gold',                type: 'Personal', balance:   729.59, min:  30, limit:  1500 },
];

const TRANSACTIONS = [
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
];

/* ================= HELPERS ================= */
const $ = (sel) => document.querySelector(sel);

const fmtMoney = (n, decimals = 0) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ================= CALCULATIONS ================= */
const paidOff  = START_DEBT - CURRENT_DEBT;
const pct      = (paidOff / START_DEBT) * 100;
const delta    = PREV_DEBT - CURRENT_DEBT;
const today    = new Date();
const daysLeft = Math.max(0, Math.ceil((GOAL_DATE - today) / 86400000));
const pace     = daysLeft > 0 ? CURRENT_DEBT / daysLeft : CURRENT_DEBT;

/* ================= RENDER: LEDGER ================= */
function renderLedger() {
  $('#last-updated').textContent = fmtDate(LAST_UPDATED);
  $('#delta-badge').textContent = `↓ ${fmtMoney(delta)} since last update`;
  (function() {
    const el = $('#debt-number');
    const from = START_DEBT;
    const to = CURRENT_DEBT;
    const duration = 1600;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = fmtMoney(from + (to - from) * ease(t), 2);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
  $('#paid-off').textContent = `−${fmtMoney(paidOff)}`;

  /* progress bar — animate after 300ms */
  $('#progress-pct').textContent = pct.toFixed(1) + '%';
  setTimeout(() => { $('#progress-fill').style.width = pct.toFixed(1) + '%'; }, 300);

  /* card breakdown — paid measured against card limit as starting point */
  $('#card-rows').innerHTML = CARDS.map((c) => {
    const paid = Math.max(0, c.limit - c.balance);
    const cardPct = Math.round((paid / c.limit) * 100);
    return `<div class="card-row">
      <div class="card-row-top">
        <span class="card-name">${c.name}</span>
        <span class="card-type">${c.type}</span>
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

  /* transaction feed — 5 most recent */
  const icons = { payment: '↓', interest: '↑', income: '+' };
  const recent = [...TRANSACTIONS]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  $('#txn-rows').innerHTML = recent.map((t) =>
    `<div class="txn-row">
      <span class="txn-icon ${t.type}">${icons[t.type]}</span>
      <span class="txn-body">
        <span class="txn-desc">${t.desc}</span><br>
        <span class="txn-date">${fmtDate(t.date)}</span>
      </span>
      <span class="txn-amount ${t.type}">${t.type === 'interest' ? '+' : ''}${fmtMoney(t.amount)}</span>
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
      const email = form.email.value.trim();
      const source = form.dataset.source;
      const msg = form.parentElement.querySelector('.form-msg');
      const btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await subscribe(email, source);
        if (source === 'war-chest') {
          document.getElementById('warchest-overlay').style.display = 'none';
          document.querySelector('.warchest-blur').style.filter = 'none';
          document.querySelector('.warchest-blur').style.userSelect = 'auto';
          document.getElementById('warchest-success').hidden = false;
        } else if (msg) {
          msg.textContent = source === 'debt-wars-early'
            ? "You're on the list. ⚔️"
            : "You're in. See you Sunday.";
          msg.className = 'form-msg ok';
          msg.hidden = false;
          form.reset();
        }
      } catch (err) {
        if (msg) {
          msg.textContent = 'Something broke. Try again or DM me @ljrbuilds.';
          msg.className = 'form-msg err';
          msg.hidden = false;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = form.dataset.source === 'war-chest' ? 'Get Access'
          : form.dataset.source === 'debt-wars-early' ? "I'm In" : 'Subscribe';
      }
    });
  });
}

/* ================= TABS ================= */
function wireTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
    });
  });
}

/* ================= INIT ================= */
renderLedger();
wireForms();
wireTabs();
