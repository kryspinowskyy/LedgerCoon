/* --- LEDGERCOON SOVEREIGN ENGINE --- */

// Inicjalizacja stanu (V2.6 - Subs Fix)
let state = JSON.parse(localStorage.getItem('ledger_v3')) || {
    income: 0, bills: 0, payday: "", expenses: [], subs: [], xp: 0, 
    theme: 'dark', lang: 'pl', notes: "", avatar: null, decoy: false
};

// ASMR Finansowe
let audioCtx;
const playSound = (t) => {
    try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(t === 'coin' ? 880 : 150, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.3);
        o.start(); o.stop(a.currentTime + 0.3);
    } catch(e) {}
};

window.onload = () => {
    // Ładowanie danych avatara i notatnika
    if(state.avatar) { const i = document.getElementById('avatar-img'); i.src = state.avatar; i.style.display = 'block'; }
    document.getElementById('shadow-notes').value = state.notes || "";
    document.getElementById('base-income').value = state.income || "";
    document.getElementById('base-bills').value = state.bills || "";
    document.getElementById('base-payday').value = state.payday || "";
    
    // Inicjalizacja cytatów
    if(typeof LEDGER_STRINGS !== 'undefined') {
        const q = LEDGER_STRINGS[state.lang].quotes;
        const qEl = document.getElementById('splash-quote');
        if(qEl) qEl.innerText = q[Math.floor(Math.random() * q.length)];
    }

    // Renderowanie subskrypcji (NAPRAWIONE)
    renderSubscriptions();

    // Start aplikacji
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) splash.style.opacity = '0';
        setTimeout(() => {
            if(splash) splash.style.display = 'none';
            const app = document.getElementById('app-container');
            if(app) app.style.display = 'flex';
            updateUI();
        }, 600);
    }, 2500);

    setInterval(updateClock, 1000);
};

function save() { localStorage.setItem('ledger_v3', JSON.stringify(state)); }

/* --- GŁÓWNA LOGIKA UI --- */
function updateUI() {
    try {
        const daily = calculateDaily();
        const amountEl = document.getElementById('daily-amount');
        if(amountEl) {
            amountEl.innerText = daily.toFixed(2);
            amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
        }
        
        const days = getSurvivalDays();
        const streakEl = document.getElementById('streak-display');
        if(streakEl) streakEl.innerText = `⏳ Paliwa na: ${days} dni`;
        
        updateRank();
    } catch(e) { console.error("UI Update Error", e); }
}

function calculateDaily() {
    if(!state.payday) return 0;
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    // UWZGLĘDNIENIE SUBSKRYPCJI W KALKULACJI
    const subSum = (state.subs && state.subs.length > 0) ? state.subs.reduce((s, b) => s + b.amount, 0) : 0;
    return (state.income - state.bills - subSum - spent) / days;
}

function getSurvivalDays() {
    const daily = calculateDaily();
    const subSum = (state.subs && state.subs.length > 0) ? state.subs.reduce((s, b) => s + b.amount, 0) : 0;
    const totalLeft = (state.income - state.bills - subSum) - state.expenses.reduce((s, e) => s + e.amount, 0);
    
    if(totalLeft <= 0) return 0;
    const avg = state.expenses.length > 0 ? (state.expenses.slice(-5).reduce((s,e)=>s+e.amount,0) / Math.min(state.expenses.length, 5)) : daily;
    return Math.floor(totalLeft / (avg || 1));
}

function updateRank() {
    try {
        const lvl = Math.floor(state.xp / 1000);
        const rankNameEl = document.getElementById('rank-name');
        if(rankNameEl) rankNameEl.innerText = LEDGER_STRINGS[state.lang].ranks[Math.min(lvl, 4)];
        
        const xpTextEl = document.getElementById('xp-text');
        if(xpTextEl) xpTextEl.innerText = `${state.xp % 1000} XP`;
        
        const offset = 150.8 - ((state.xp % 1000) / 1000) * 150.8;
        const ringEl = document.querySelector('.progress-ring__circle');
        if(ringEl) ringEl.style.strokeDashoffset = offset;
    } catch(e) {}
}

/* --- LOGIKA WYDATKÓW --- */
function confirmExpense() {
    const valEl = document.getElementById('exp-val');
    const v = parseFloat(valEl.value);
    if(v > 0) {
        state.expenses.push({amount: v, date: new Date().toISOString()});
        state.xp += 50; playSound('coin'); save(); updateUI(); closeModal();
        valEl.value = "";
    }
}
function quickAdd(n) { document.getElementById('exp-val').value = n; }

/* --- LOGIKA SKARBCA & SUBSKRYPCJI (NAPRAWIONE) --- */
function updateBase() {
    state.income = parseFloat(document.getElementById('base-income').value) || 0;
    state.bills = parseFloat(document.getElementById('base-bills').value) || 0;
    state.payday = document.getElementById('base-payday').value;
    save(); updateUI();
}

// NOWA FUNKCJA: DODAWANIE SUBSKRYPCJI
function addSubscription() {
    const name = prompt("Nazwa pijaweczki (np. Netflix):");
    if(!name) return;
    const amount = parseFloat(prompt("Miesięczny koszt (PLN):"));
    if(!amount || amount <= 0) return;

    if(!state.subs) state.subs = []; // Bezpieczeństwo
    state.subs.push({ name, amount });
    save();
    renderSubscriptions();
    updateUI();
    playSound('coin');
}

// NOWA FUNKCJA: USUWANIE SUBSKRYPCJI
function deleteSubscription(index) {
    if(!confirm("Czy na pewno chcesz unicestwić tę pijawkę?")) return;
    state.subs.splice(index, 1);
    save();
    renderSubscriptions();
    updateUI();
    playSound('shred'); // Klimatyczny dźwięk niszczarki
}

// NOWA FUNKCJA: RENDEROWANIE LISTY W SKARBCOWIE
function renderSubscriptions() {
    const container = document.getElementById('subs-container');
    if(!container) return;
    container.innerHTML = ""; // Czyścimy starą listę

    if(!state.subs || state.subs.length === 0) {
        container.innerHTML = "<p style='font-size:0.8rem; opacity:0.5; font-style:italic; padding:10px;'>Brak aktywnych pijawek. Czysto.</p>";
        return;
    }

    state.subs.forEach((sub, index) => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid rgba(255,255,255,0.05);";
        
        item.innerHTML = `
            <div>
                <strong style="color:white; font-size:0.9rem;">${sub.name}</strong><br>
                <small style="color:var(--accent);">${sub.amount.toFixed(2)} PLN/msc</small>
            </div>
            <button onclick="deleteSubscription(${index})" style="background:none; border:none; color:var(--danger); font-size:1.2rem; cursor:pointer;">✕</button>
        `;
        container.appendChild(item);
    });
}

/* --- SYSTEMOWE & AWATAR --- */
function triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
document.getElementById('avatar-input').onchange = (e) => {
    const r = new FileReader();
    r.onload = () => {
        state.avatar = r.result;
        const i = document.getElementById('avatar-img');
        if(i) { i.src = r.result; i.style.display = 'block'; }
        save();
    };
    if(e.target.files[0]) r.readAsDataURL(e.target.files[0]);
};

function saveNotes() { 
    const notesEl = document.getElementById('shadow-notes');
    if(notesEl) { state.notes = notesEl.value; save(); }
}
function updateClock() {
    const n = new Date();
    const clockEl = document.getElementById('clock-display');
    if(clockEl) clockEl.innerText = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
}

/* --- NAWIGACJA --- */
function toggleSettings() { toggleStash(); } // Ustawienia kierują do Skarbca
function toggleStash() { 
    const s = document.getElementById('stash-layer');
    if(s) s.style.display = (s.style.display === 'flex') ? 'none' : 'flex';
}
function openExpenseModal() { 
    const m = document.getElementById('expense-modal');
    if(m) m.style.display = 'flex'; 
}
function closeModal() { 
    const m = document.getElementById('expense-modal');
    if(m) m.style.display = 'none'; 
}

// Błąd w HTML Turn 11 - openMiniGame nie istnieje w pancernej wersji
function openMiniGame() { alert("Protokół 'Rozrywka' jest jeszcze nieaktywny."); }
