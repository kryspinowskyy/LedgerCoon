/* --- LEDGERCOON SOVEREIGN: PANCERNY SILNIK (V2.1) --- */

// Zabezpieczenie przed brakiem danych w localStorage
let state;
try {
    state = JSON.parse(localStorage.getItem('ledger_coon_shadow_v3')) || {
        income: 0, fixed: 0, payday: "", expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null, isDecoy: false
    };
} catch(e) {
    state = { income: 0, fixed: 0, payday: "", expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null, isDecoy: false };
}

window.onload = () => {
    applyTheme(state.theme || 'dark');
    
    // Zabezpieczenie przed błędem cytatu
    if (typeof LEDGER_STRINGS !== 'undefined' && state.lang in LEDGER_STRINGS) {
        try {
            const q = LEDGER_STRINGS[state.lang].quotes;
            document.getElementById('splash-quote').innerText = q[Math.floor(Math.random() * q.length)];
        } catch(e) {}
    }

    if(state.avatar) { const img = document.getElementById('avatar-img'); img.src = state.avatar; img.style.display = 'block'; }
    document.getElementById('shadow-notes').value = state.notes || "";
    document.getElementById('base-income').value = state.income || "";
    document.getElementById('base-bills').value = state.fixed || "";
    document.getElementById('base-payday').value = state.payday || "";

    setInterval(updateClock, 1000);
    // Uruchomienie aplikacji nawet przy błędzie
    setTimeout(exitSplash, 2500);
};

function exitSplash() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app-container');
    if (splash) splash.style.opacity = '0';
    setTimeout(() => {
        if (splash) splash.style.display = 'none';
        if (app) app.style.display = 'flex';
        updateUI();
    }, 600);
}

function save() { localStorage.setItem('ledger_coon_shadow_v3', JSON.stringify(state)); }

function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    amountEl.innerText = daily.toFixed(2);
    amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
    
    const survival = getSurvivalDays();
    document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${survival} dni`;
    
    // Stashek
    if (typeof LEDGER_STRINGS !== 'undefined' && state.lang in LEDGER_STRINGS) {
        const d = LEDGER_STRINGS[state.lang].stashek;
        document.getElementById('stashek-talk').innerText = daily < 20 ? d.bad : d.good;
    }
}

function calculateDaily() {
    if(!state.payday) return 0;
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    return (state.income - state.fixed - spent) / days;
}

function getSurvivalDays() {
    const daily = calculateDaily();
    const totalLeft = (state.income - state.fixed) - state.expenses.reduce((s, e) => s + e.amount, 0);
    if(totalLeft <= 0) return 0;
    const count = Math.min(state.expenses.length, 5);
    const avg = state.expenses.length > 0 ? (state.expenses.slice(-5).reduce((s,e)=>s+e.amount,0) / count) : daily;
    return Math.floor(totalLeft / (avg || 1));
}

// Skarbiec i Ustawienia
function updateBase() {
    state.income = parseFloat(document.getElementById('base-income').value) || 0;
    state.fixed = parseFloat(document.getElementById('base-bills').value) || 0;
    state.payday = document.getElementById('base-payday').value;
    save(); updateUI();
}

function toggleStash() {
    const s = document.getElementById('stash-layer');
    s.style.display = s.style.display === 'flex' ? 'none' : 'flex';
}
function saveNotes() { state.notes = document.getElementById('shadow-notes').value; save(); }
function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(state.theme); save(); }
function applyTheme(t) { document.body.setAttribute('data-theme', t); }

// System
function updateClock() {
    const clock = document.getElementById('clock-display');
    if (clock) clock.innerText = new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
}
function openExpenseModal() { document.getElementById('expense-modal').style.display='flex'; }
function closeModal() { document.getElementById('expense-modal').style.display='none'; }
function confirmExpense() { /* Logika z Turb 8/9 */ closeModal(); }
// Wyłączone do czasu naprawienia gry
function openMiniGame() { alert("Gra wymaga ponownego wczytania."); }
