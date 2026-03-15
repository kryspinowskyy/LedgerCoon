
/* --- LEDGERCOON: SHADOW PROTOCOL V2 (SOVEREIGN ENGINE) --- */

let state = JSON.parse(localStorage.getItem('ledger_coon_shadow_v3')) || {
    income: 3600, fixed: 1200, payday: "2026-03-31", 
    stash: 0, xp: 0, streak: 0, expenses: [], 
    subscriptions: [], notes: "", theme: 'man', lang: 'pl', 
    isDecoy: false
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
    
    // Inicjalizacja notatek
    const notesArea = document.getElementById('shadow-notes');
    if(notesArea) notesArea.value = state.notes || "";

    setTimeout(hideSplash, 2500);
};

/* --- SYSTEM XP I RANG --- */
function addXP(amount) {
    if (state.isDecoy) return;
    state.xp += amount;
    save();
    updateUI();
}

function checkRankUp() {
    const ranks = LEDGER_STRINGS[state.lang].ranks;
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
    
    const historyCount = Math.min(state.expenses.length, 7);
    const avgSpent = state.expenses.length > 0 
        ? state.expenses.slice(-7).reduce((s, e) => s + e.amount, 0) / historyCount 
        : dailyBalance;
        
    return Math.floor(totalLeft / (avgSpent || 1));
}

function updateUI() {
    const amountEl = document.getElementById('daily-amount');
    const stashekTalk = document.getElementById('stashek-talk');
    const survivalEl = document.getElementById('streak-display');
    const dialogues = LEDGER_STRINGS[state.lang].stashek;

    if (state.isDecoy) {
        amountEl.innerText = "15.20";
        document.getElementById('rank-name').innerText = "Dust Collector";
        stashekTalk.innerText = dialogues.decoy || "Kupisz mi te winogrona?";
        survivalEl.innerText = "⏳ Paliwa na: 1 dzień";
    } else {
        const daily = calculateDaily();
        amountEl.innerText = daily.toFixed(2);
        checkRankUp();
        const survival = getSurvivalDays();
        survivalEl.innerText = `⏳ Paliwa na: ${survival} dni`;
        stashekTalk.innerText = daily < 20 ? dialogues.bad : dialogues.good;
        
        amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
    }
}

/* --- INTERFEJS --- */
function openExpenseModal() { 
    document.getElementById('expense-modal').style.display = 'flex'; 
}

function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

function confirmExpense() {
    const val = parseFloat(document.getElementById('exp-val').value);
    const title = document.getElementById('exp-title').value;
    if (val > 0) {
        state.expenses.push({ amount: val, title: title || "Zakup", date: new Date().toISOString() });
        addXP(25);
        document.getElementById('exp-val').value = "";
        document.getElementById('exp-title').value = "";
        closeModal();
        vibrate(50);
    }
}

function toggleStash() {
    const layer = document.getElementById('stash-layer');
    layer.style.display = layer.style.display === 'flex' ? 'none' : 'flex';
    if(layer.style.display === 'flex') vibrate(30);
}

function saveNotes() {
    state.notes = document.getElementById('shadow-notes').value;
    save();
}

/* --- TRYB PRZYNĘTY (5 KLIKNIĘĆ W ZEGAR) --- */
document.getElementById('clock-display').onclick = () => {
    clockClicks++;
    if(clockClicks >= 5) {
        state.isDecoy = !state.isDecoy;
        vibrate([100, 50, 100]);
        updateUI();
        clockClicks = 0;
    }
    setTimeout(() => { clockClicks = 0; }, 3000);
};

/* --- MINI GRA --- */
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
        ctx.drawImage(stashekImg, szopX - 35, canvas.height - 80, 70, 70);

        if(Math.random() < 0.06) {
            const types = [{i: '🪙', v: 10}, {i: '💵', v: 50}, {i: '☕', v: -20}, {i: '🧾', v: -100}];
            const t = types[Math.floor(Math.random() * types.length)];
            items.push({x: Math.random() * (canvas.width - 30), y: -30, ...t});
        }

        items.forEach((item, i) => {
            item.y += 6;
            ctx.font = "35px Arial";
            ctx.fillText(item.i, item.x, item.y);
            if(item.y > canvas.height - 90 && Math.abs(item.x - szopX) < 45) {
                score += item.v;
                if(item.v > 0) addXP(5);
                vibrate(item.v > 0 ? 30 : 200);
                items.splice(i, 1);
                document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
            }
            if(item.y > canvas.height) items.splice(i, 1);
        });
    }, 33);

    canvas.ontouchmove = (e) => { 
        szopX = e.touches[0].clientX - 20; 
        e.preventDefault(); 
    };
}

/* --- SYSTEM --- */
function applyTheme(t) { document.body.setAttribute('data-user', t); }
function toggleTheme() {
    const themes = ['man', 'woman', 'child'];
    state.theme = themes[(themes.indexOf(state.theme) + 1) % 3];
    applyTheme(state.theme); save();
    vibrate(40);
}
function save() { localStorage.setItem('ledger_coon_shadow_v3', JSON.stringify(state)); }
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }
function updateClock() {
    const n = new Date();
    const time = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
    const date = n.toLocaleDateString('pl-PL');
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
        if (acc && Math.abs(acc.x) + Math.abs(acc.y) > 38) {
            document.body.classList.toggle('blur-data');
            vibrate(50);
        }
    });
}
function unlockHaptics() { 
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    vibrate(50); 
}
