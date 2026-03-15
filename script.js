/* --- LEDGERCOON SOVEREIGN ENGINE --- */

let state = JSON.parse(localStorage.getItem('ledger_v3')) || {
    income: 0, bills: 0, payday: "", expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null
};

// ASMR Finansowe
const playSound = (t) => {
    try {
        const a = new (window.AudioContext || window.webkitAudioContext)();
        const o = a.createOscillator();
        const g = a.createGain();
        o.connect(g); g.connect(a.destination);
        o.frequency.setValueAtTime(t === 'coin' ? 880 : 150, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.3);
        o.start(); o.stop(a.currentTime + 0.3);
    } catch(e) {}
};

window.onload = () => {
    if(state.avatar) { const i = document.getElementById('avatar-img'); i.src = state.avatar; i.style.display = 'block'; }
    document.getElementById('shadow-notes').value = state.notes || "";
    document.getElementById('base-income').value = state.income || "";
    document.getElementById('base-bills').value = state.bills || "";
    document.getElementById('base-payday').value = state.payday || "";
    
    // Quotes
    if(typeof LEDGER_STRINGS !== 'undefined') {
        const q = LEDGER_STRINGS[state.lang].quotes;
        document.getElementById('splash-quote').innerText = q[Math.floor(Math.random() * q.length)];
    }

    setTimeout(() => {
        document.getElementById('splash-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            updateUI();
        }, 600);
    }, 2500);

    setInterval(updateClock, 1000);
};

function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    amountEl.innerText = daily.toFixed(2);
    amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
    
    const days = getSurvivalDays();
    document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${days} dni`;
    
    // Rank & Ring
    const lvl = Math.floor(state.xp / 1000);
    document.getElementById('rank-name').innerText = LEDGER_STRINGS[state.lang].ranks[Math.min(lvl, 4)];
    document.getElementById('xp-text').innerText = `${state.xp % 1000} XP`;
    const offset = 150.8 - ((state.xp % 1000) / 1000) * 150.8;
    document.querySelector('.progress-ring__circle').style.strokeDashoffset = offset;
}

function calculateDaily() {
    if(!state.payday) return 0;
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    return (state.income - state.bills - spent) / days;
}

function getSurvivalDays() {
    const daily = calculateDaily();
    const totalLeft = (state.income - state.bills) - state.expenses.reduce((s, e) => s + e.amount, 0);
    if(totalLeft <= 0) return 0;
    const avg = state.expenses.length > 0 ? (state.expenses.slice(-5).reduce((s,e)=>s+e.amount,0) / Math.min(state.expenses.length, 5)) : daily;
    return Math.floor(totalLeft / (avg || 1));
}

function confirmExpense() {
    const v = parseFloat(document.getElementById('exp-val').value);
    if(v > 0) {
        state.expenses.push({amount: v, date: new Date().toISOString()});
        state.xp += 50; playSound('coin'); save(); updateUI(); closeModal();
        document.getElementById('exp-val').value = "";
    }
}

function quickAdd(n) { document.getElementById('exp-val').value = n; }
function updateBase() {
    state.income = parseFloat(document.getElementById('base-income').value) || 0;
    state.bills = parseFloat(document.getElementById('base-bills').value) || 0;
    state.payday = document.getElementById('base-payday').value;
    save(); updateUI();
}

function triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
document.getElementById('avatar-input').onchange = (e) => {
    const r = new FileReader();
    r.onload = () => {
        state.avatar = r.result;
        const i = document.getElementById('avatar-img');
        i.src = r.result; i.style.display = 'block';
        save();
    };
    r.readAsDataURL(e.target.files[0]);
};

function save() { localStorage.setItem('ledger_v3', JSON.stringify(state)); }
function saveNotes() { state.notes = document.getElementById('shadow-notes').value; save(); }
function updateClock() {
    const n = new Date();
    document.getElementById('clock-display').innerText = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
}
function toggleSettings() { toggleStash(); } // Dla uproszczenia Skarbiec to Twoje ustawienia
function toggleStash() { 
    const s = document.getElementById('stash-layer');
    s.style.display = (s.style.display === 'flex') ? 'none' : 'flex';
}
function openExpenseModal() { document.getElementById('expense-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }
