/* --- LEDGERCOON SOVEREIGN: ROBUST ENGINE --- */

// 1. Zabezpieczenie danych
let state;
try {
    state = JSON.parse(localStorage.getItem('ledger_v2_5')) || {
        income: 0, bills: 0, payday: "", expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null
    };
} catch (e) {
    state = { income: 0, bills: 0, payday: "", expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null };
}

window.onload = () => {
    // 2. Wymuszenie motywu
    document.body.setAttribute('data-theme', state.theme || 'dark');
    
    // 3. Obsługa tekstów (zabezpieczenie przed brakiem lang.js)
    if (typeof LEDGER_STRINGS !== 'undefined') {
        const q = LEDGER_STRINGS[state.lang].quotes;
        const quoteEl = document.getElementById('splash-quote');
        if (quoteEl) quoteEl.innerText = q[Math.floor(Math.random() * q.length)];
    }

    // 4. Mechanizm otwierania aplikacji (Splash Exit)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app-container');
        
        if (splash) splash.style.opacity = '0';
        setTimeout(() => {
            if (splash) splash.style.display = 'none';
            if (app) app.style.display = 'flex'; // Zmieniono na flex dla lepszego układu
            updateUI(); // Odśwież cyferki
        }, 600);
    }, 2000);

    setInterval(updateClock, 1000);
};

function updateUI() {
    try {
        const daily = calculateDaily();
        const amountEl = document.getElementById('daily-amount');
        if (amountEl) {
            amountEl.innerText = daily.toFixed(2);
            amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
        }
    } catch (e) { console.error("Błąd UI:", e); }
}

function calculateDaily() {
    if (!state.payday) return 0;
    const payDate = new Date(state.payday);
    const today = new Date();
    const diff = payDate - today;
    const days = Math.ceil(diff / (1000 * 3600 * 24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    return (state.income - state.bills - spent) / days;
}

function updateClock() {
    const n = new Date();
    const clock = document.getElementById('clock-display');
    if (clock) clock.innerText = `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
}

// Funkcje pomocnicze, aby przyciski nie wywalały błędów
function toggleSettings() { 
    const m = document.getElementById('settings-modal');
    if (m) m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}
function openExpenseModal() { 
    const m = document.getElementById('expense-modal');
    if (m) m.style.display = 'flex';
}
function closeModal() { 
    const m = document.getElementById('expense-modal');
    if (m) m.style.display = 'none';
}
