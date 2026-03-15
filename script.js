/* --- LEDGERCOON: SHADOW PROTOCOL V2 (SOVEREIGN ENGINE - FULL) --- */

// Inicjalizacja stanu z localStorage
let state = JSON.parse(localStorage.getItem('ledger_coon_shadow_v3')) || {
    income: 3600, fixed: 1200, payday: "2026-03-31", 
    stash: 0, xp: 0, streak: 0, expenses: [], 
    subscriptions: [], 
    notes: "", avatar: null, vision: null, 
    theme: 'man', lang: 'pl', 
    isDecoy: false, decoyPin: "0000", activePin: "1111"
};

let audioCtx;
let gameInterval;
let score = 0;
let clockClicks = 0;

window.onload = () => {
    applyTheme(state.theme);
    updateUI();
    initSensors();
    setInterval(updateClock, 1000);
    
    // Załadowanie zapisanych notatek do edytora
    const notesArea = document.getElementById('shadow-notes');
    if(notesArea) notesArea.value = state.notes || "";

    setTimeout(hideSplash, 2000);
};

/* --- SYSTEM DOSWIADCZENIA (XP) I RANG --- */
function addXP(amount) {
    if (state.isDecoy) return; // W trybie Decoy nie zdobywasz XP
    state.xp += amount;
    save();
    updateUI();
}

function checkRankUp() {
    const ranks = LEDGER_STRINGS[state.lang].ranks;
    // Ranga rośnie co 1000 XP
    const currentLevel = Math.floor(state.xp / 1000);
    const rankName = ranks[Math.min(currentLevel, ranks.length - 1)];
    document.getElementById('rank-name').innerText = rankName;
    document.getElementById('xp-fill').style.width = (state.xp % 1000) / 10 + "%";
}

/* --- LOGIKA FINANSOWA --- */
function calculateDaily() {
    const today = new Date();
    const payDate = new Date(state.payday);
    const diff = payDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24)) || 1;
    
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    const subs = state.subscriptions ? state.subscriptions.reduce((s, b) => s + b.amount, 0) : 0;
    
    return ((state.income - state.fixed - subs) - spent) / days;
}

function getSurvivalDays() {
    const dailyBalance = calculateDaily();
    const totalLeft = (state.income - state.fixed) - state.expenses.reduce((s, e) => s + e.amount, 0);
    
    if (totalLeft <= 0) return 0;
    
    // POPRAWKA: Liczenie średniej z faktycznej liczby wydatków (max 7)
    const historyCount = Math.min(state.expenses.length, 7);
    const avgSpent = state.expenses.length > 0 
        ? state.expenses.slice(-7).reduce((s, e) => s + e.amount, 0) / historyCount 
        : dailyBalance;
        
    return Math.floor(totalLeft / (avgSpent || 1));
}

/* --- AKTUALIZACJA INTERFEJSU --- */
function updateUI() {
    const amountEl = document.getElementById('daily-amount');
    const stashekTalk = document.getElementById('stashek-talk');
    const rankEl = document.getElementById('rank-name');
    const survivalEl = document.getElementById('streak-display');
    const dialogues = LEDGER_STRINGS[state.lang].stashek;

    if (state.isDecoy) {
        // Dane widmo dla niepowołanych osób
        amountEl.innerText = "15.20";
        rankEl.innerText = "Dust Collector";
        stashekTalk.innerText = dialogues.decoy || "Kupisz mi te winogrona?";
        survivalEl.innerText = "⏳ Paliwa na: 1 dzień";
        document.getElementById('xp-fill').style.width = "5%";
    } else {
        const daily = calculateDaily();
        amountEl.innerText = daily.toFixed(2);
        
        checkRankUp();
        
        const survival = getSurvivalDays();
        survivalEl.innerText = `⏳ Paliwa na: ${survival} dni`;
        
        stashekTalk.innerText = daily < 20 ? dialogues.bad : dialogues.good;
        
        // Krytyczny kolor kwoty
        if (daily < 0) amountEl.style.color = "var(--danger)";
        else amountEl.style.color = "var(--accent)";
    }
}

/* --- OBSŁUGA WYDATKÓW --- */
function openExpenseModal() { 
    document.getElementById('expense-modal').style.display = 'flex'; 
    document.getElementById('exp-val').focus();
}

function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

function confirmExpense() {
    const val = parseFloat(document.getElementById('exp-val').value);
    const title = document.getElementById('exp-title').value;
    
    if (val > 0) {
        state.expenses.push({ 
            amount: val, 
            title: title || "Zakup", 
            date: new Date().toISOString() 
        });
        addXP(25);
        document.getElementById('exp-val').value = "";
        document.getElementById('exp-title').value = "";
        closeModal();
        vibrate(50);
    }
}

/* --- SKARBIEC I NOTATKI --- */
function toggleStash() {
    const layer = document.getElementById('stash-layer');
    if (layer.style.display === 'flex') {
        layer.style.display = 'none';
    } else {
        layer.style.display = 'flex';
        vibrate(30);
    }
}

function saveNotes() {
    state.notes = document.getElementById('shadow-notes').value;
    save();
}

/* --- TRYB PRZYNĘTY (DECOY MODE) --- */
function toggleDecoy() {
    state.isDecoy = !state.isDecoy;
    vibrate([100, 50, 100]);
    updateUI();
}

// Wyzwalacz: 5 kliknięć w zegar
document.getElementById('clock-display').onclick = () => {
    clockClicks++;
    if(clockClicks >= 5) {
        toggleDecoy();
        clockClicks = 0;
    }
    setTimeout(() => { clockClicks = 0; }, 3000); // Reset licznika po 3 sek.
};

/* --- MINI GRA V2 --- */
function openMiniGame() { 
    document.getElementById('game-container').style.display = 'flex'; 
    score = 0;
    initGame(); 
}

function closeMiniGame() { 
    document.getElementById('game-container').style.display = 'none'; 
    clearInterval(gameInterval); 
}

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight * 0.6;
    let szopX = canvas.width / 2;
    let items = [];
    const stashekImg = document.getElementById('stashek-mood');

    gameInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gracz (Stashek)
        ctx.drawImage(stashekImg, szopX - 35, canvas.height - 80, 70, 70);

        // Generowanie przedmiotów
        if(Math.random() < 0.06) {
            const types = [
                {i: '🪙', v: 10}, {i: '💵', v: 50}, 
                {i: '☕', v: -20}, {i: '🧾', v: -100}
            ];
            const t = types[Math.floor(Math.random() * types.length)];
            items.push({x: Math.random() * (canvas.width - 30), y: -30, ...t});
        }

        items.forEach((item, i) => {
            item.y += 6;
            ctx.font = "35px Arial";
            ctx.fillText(item.i, item.x, item.y);

            // Kolizja (łapanie)
            if(item.y > canvas.height - 90 && Math.abs(item.x - szopX) < 45) {
                score += item.v;
                if(item.v > 0) addXP(5);
                vibrate(item.v > 0 ? 30 : 200);
                items.splice(i, 1);
                document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
            }
            
            // Usunięcie poza ekranem
            if(item.y > canvas.height) items.splice(i, 1);
        });
    }, 1000 / 30);

    canvas.ontouchmove = (e) => { 
        szopX = e.touches[0].clientX - 20; 
        e.preventDefault(); 
    };
}

/* --- SYSTEMOWE --- */
function applyTheme(t) { document.body.setAttribute('data-user', t); }

function toggleTheme() {
    const themes = ['man', 'woman', 'child'];
    state.theme = themes[(themes.indexOf(state.theme) + 1) % 3];
    applyTheme(state.theme); 
    save();
}

function save() { localStorage.setItem('ledger_coon_shadow_v3', JSON.stringify(state)); }

function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

function unlockHaptics() { 
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    vibrate(50); 
}

function updateClock() {
    const n = new Date();
    const time = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
    const date = n.toLocaleDateString(state.lang === 'pl' ? 'pl-PL' : 'en-US');
    document.getElementById('clock-display').innerHTML = `${time}<br><small style="font-size:0.6rem;opacity:0.6">${date}</small>`;
}

function hideSplash() { 
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => {
        splash.style.display = 'none'; 
        document.getElementById('app-container').style.display = 'block'; 
    }, 800);
}

function initSensors() {
    window.addEventListener('devicemotion', (e) => {
        const acc = e.accelerationIncludingGravity;
        if (acc && Math.abs(acc.x) + Math.abs(acc.y) > 35) {
            document.body.classList.toggle('blur-data');
            vibrate(50);
        }
    });
}
