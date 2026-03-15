/* --- LEDGERCOON: SHADOW PROTOCOL V2 (FULL UNIFIED ENGINE) --- */

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

window.onload = () => {
    applyTheme(state.theme);
    updateUI();
    initSensors();
    setInterval(updateClock, 1000);
    setTimeout(hideSplash, 2000);
    
    // Załadowanie notatek do textarea
    const notesArea = document.getElementById('shadow-notes');
    if(notesArea) notesArea.value = state.notes;
};

/* --- SYSTEM XP I RANG --- */
function addXP(amount) {
    state.xp += amount;
    checkRankUp();
    save();
    updateUI();
}

function checkRankUp() {
    const ranks = LEDGER_STRINGS[state.lang].ranks;
    const currentLevel = Math.floor(state.xp / 1000);
    const rankName = ranks[Math.min(currentLevel, ranks.length - 1)];
    document.getElementById('rank-name').innerText = rankName;
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
    const avgSpent = state.expenses.length > 0 
        ? state.expenses.slice(-7).reduce((s, e) => s + e.amount, 0) / 7 
        : dailyBalance;
    return Math.floor(totalLeft / (avgSpent || 1));
}

/* --- INTERFEJS I MODALE --- */
function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    
    if (state.isDecoy) {
        amountEl.innerText = "15.20";
        document.getElementById('rank-name').innerText = "Dust Collector";
        document.getElementById('stashek-talk').innerText = "Kupisz mi te winogrona?";
    } else {
        amountEl.innerText = daily.toFixed(2);
        checkRankUp();
        const survival = getSurvivalDays();
        document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${survival} dni`;
        
        const dialogues = LEDGER_STRINGS[state.lang].stashek;
        document.getElementById('stashek-talk').innerText = daily < 20 ? dialogues.bad : dialogues.good;
    }
    
    document.getElementById('xp-fill').style.width = (state.xp % 1000) / 10 + "%";
}

function openExpenseModal() { document.getElementById('expense-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

function confirmExpense() {
    const val = parseFloat(document.getElementById('exp-val').value);
    const title = document.getElementById('exp-title').value;
    if (val > 0) {
        state.expenses.push({ amount: val, title: title || "Zakup", date: new Date().toISOString() });
        addXP(20);
        closeModal();
        vibrate(50);
    }
}

function toggleStash() {
    const layer = document.getElementById('stash-layer');
    layer.style.display = layer.style.display === 'flex' ? 'none' : 'flex';
}

function saveNotes() {
    state.notes = document.getElementById('shadow-notes').value;
    save();
}

/* --- TRYB PRZYNĘTY (DECOY) --- */
function toggleDecoy() {
    state.isDecoy = !state.isDecoy;
    vibrate(200);
    updateUI();
}

/* --- MINIGRA --- */
function openMiniGame() { document.getElementById('game-container').style.display = 'flex'; initGame(); }
function closeMiniGame() { document.getElementById('game-container').style.display = 'none'; clearInterval(gameInterval); }

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6;
    let szopX = canvas.width / 2;
    let items = [];
    const stashekImg = document.getElementById('stashek-mood');

    gameInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.drawImage(stashekImg, szopX - 30, canvas.height - 80, 60, 60);

        if(Math.random() < 0.05) {
            const types = [
                {i: '🪙', v: 5}, {i: '💵', v: 20}, {i: '☕', v: -15}, {i: '🧾', v: -50}
            ];
            const t = types[Math.floor(Math.random() * types.length)];
            items.push({x: Math.random()*canvas.width, y: 0, ...t});
        }

        items.forEach((item, i) => {
            item.y += 5;
            ctx.font = "30px Arial";
            ctx.fillText(item.i, item.x, item.y);
            if(item.y > canvas.height - 90 && Math.abs(item.x - szopX) < 40) {
                score += item.v;
                if(item.v > 0) addXP(2);
                vibrate(item.v > 0 ? 20 : 150);
                items.splice(i, 1);
                document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
            }
        });
    }, 30);
    canvas.ontouchmove = (e) => { szopX = e.touches[0].clientX; e.preventDefault(); };
}

/* --- SYSTEM --- */
function applyTheme(t) { document.body.setAttribute('data-user', t); }
function toggleTheme() {
    const t = ['man', 'woman', 'child'];
    state.theme = t[(t.indexOf(state.theme) + 1) % 3];
    applyTheme(state.theme); save();
}
function save() { localStorage.setItem('ledger_coon_shadow_v3', JSON.stringify(state)); }
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }
function unlockHaptics() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); vibrate(50); }
function updateClock() {
    const n = new Date();
    document.getElementById('clock-display').innerHTML = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}<br><small>${n.toLocaleDateString()}</small>`;
}
function hideSplash() { 
    document.getElementById('splash-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none'; 
        document.getElementById('app-container').style.display = 'block'; 
    }, 800);
}
function initSensors() {
    window.addEventListener('devicemotion', (e) => {
        if (e.accelerationIncludingGravity && Math.abs(e.accelerationIncludingGravity.x) > 30) {
            document.body.classList.toggle('blur-data');
        }
    });
}

// Decoy Trigger (5 kliknięć w zegar)
let clockClicks = 0;
document.getElementById('clock-display').onclick = () => {
    clockClicks++;
    if(clockClicks >= 5) { toggleDecoy(); clockClicks = 0; }
};
