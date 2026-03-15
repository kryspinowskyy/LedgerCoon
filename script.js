/* --- LEDGERCOON: SHADOW PROTOCOL FINAL ENGINE --- */

let state = JSON.parse(localStorage.getItem('ledger_coon_shadow_v3')) || {
    income: 3600, fixed: 1200, payday: "2026-03-31", 
    stash: 0, xp: 0, streak: 0, expenses: [], 
    avatar: null, vision: null, theme: 'man', lang: 'pl'
};

let audioCtx;
let gameInterval;
let score = 0;
let clickCount = 0;

window.onload = () => {
    applyTheme(state.theme);
    updateUI();
    initSensors();
    setInterval(updateClock, 1000);
    setTimeout(hideSplash, 2500);
};

/* --- SYSTEM ODBLOKOWANIA (HAPTICS) --- */
function unlockHaptics() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    vibrate(50);
    console.log("Haptics & Audio Unlocked, Szefie.");
}

function hideSplash() {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    }, 800);
}

/* --- LOGIKA FINANSOWA --- */
function calculateDaily() {
    const today = new Date();
    const payDate = new Date(state.payday);
    const diff = payDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    return ((state.income - state.fixed) - spent) / days;
}

function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    amountEl.innerText = daily.toFixed(2);
    
    // Rangi Shadow
    const level = Math.floor(state.xp / 500);
    document.getElementById('rank-name').innerText = LEDGER_STRINGS[state.lang].ranks[Math.min(level, 4)];
    document.getElementById('xp-fill').style.width = (state.xp % 500) / 5 + "%";
    
    // Status Stashka
    if (daily < 20) {
        amountEl.classList.add('crisis-mode');
        document.getElementById('stashek-talk').innerText = LEDGER_STRINGS[state.lang].stashek.bad;
        document.getElementById('weather-effect').innerText = '⛈️';
    } else {
        amountEl.classList.remove('crisis-mode');
        document.getElementById('stashek-talk').innerText = LEDGER_STRINGS[state.lang].stashek.good;
        document.getElementById('weather-effect').innerText = '☀️';
    }

    renderShredList();
}

/* --- NISZCZARKA DŁUGÓW (DRAG & DROP) --- */
function renderShredList() {
    const list = document.getElementById('shred-list');
    list.innerHTML = '';
    state.expenses.slice(-5).forEach((exp, idx) => {
        const div = document.createElement('div');
        div.className = 'shred-item glass';
        div.draggable = true;
        div.innerHTML = `<span>${exp.title}</span> <b>${exp.amount.toFixed(2)}</b>`;
        div.onscreen = () => vibrate(10);
        div.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', idx);
            document.getElementById('shredder-zone').classList.add('shredder-active');
        };
        list.appendChild(div);
    });
}

const zone = document.getElementById('shredder-zone');
zone.ondragover = (e) => e.preventDefault();
zone.ondrop = (e) => {
    e.preventDefault();
    const idx = parseInt(e.dataTransfer.getData('text/plain'));
    zone.classList.remove('shredder-active');
    zone.classList.add('shredding');
    
    vibrate([100, 50, 100, 50, 200]);
    state.expenses.splice(-5 + idx, 1);
    
    setTimeout(() => {
        zone.classList.remove('shredding');
        save(); updateUI();
    }, 1000);
};

/* --- MINI GRA: DUMPSTER DIVE --- */
function openMiniGame() {
    document.getElementById('game-container').style.display = 'flex';
    initGame();
}

function closeMiniGame() {
    document.getElementById('game-container').style.display = 'none';
    clearInterval(gameInterval);
}

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.7;
    
    let szopX = canvas.width / 2;
    let items = [];
    score = 0;

    gameInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        
        // Szop (Gracz)
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(szopX - 25, canvas.height - 50, 50, 50);

        if(Math.random() < 0.05) items.push({x: Math.random()*canvas.width, y: 0, type: Math.random() > 0.3 ? 'coin' : 'bill'});

        items.forEach((item, i) => {
            item.y += 5;
            ctx.font = "20px Arial";
            ctx.fillText(item.type === 'coin' ? '🍇' : '📑', item.x, item.y);

            // Kolizja
            if(item.y > canvas.height - 60 && Math.abs(item.x - szopX) < 30) {
                item.type === 'coin' ? (score++, vibrate(20)) : (score = Math.max(0, score-5), vibrate(200));
                items.splice(i, 1);
                document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
            }
        });
    }, 30);

    canvas.ontouchmove = (e) => { szopX = e.touches[0].clientX; e.preventDefault(); };
}

/* --- GHOST FUTURE & MODAL --- */
function openExpenseModal() {
    document.getElementById('expense-modal').style.display = 'flex';
    updateGhost();
}

function updateGhost() {
    const val = parseFloat(document.getElementById('exp-val').value) || 0;
    const cur = calculateDaily();
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000 * 3600 * 24)) || 1;
    document.getElementById('ghost-now').innerText = (cur - val).toFixed(2);
    document.getElementById('ghost-future').innerText = (cur - (val / days)).toFixed(2);
}

document.getElementById('exp-val').oninput = updateGhost;

function confirmExpense() {
    const val = parseFloat(document.getElementById('exp-val').value);
    if (val > 0) {
        state.expenses.push({ amount: val, title: document.getElementById('exp-title').value || "Zakup", date: new Date().toISOString() });
        state.xp += 20;
        save(); updateUI(); closeModal(); vibrate(50);
    }
}

/* --- SENSORY --- */
function initSensors() {
    let lastS = 0;
    window.addEventListener('devicemotion', (e) => {
        let acc = e.accelerationIncludingGravity;
        if (acc && Math.abs(acc.x) + Math.abs(acc.y) > 35 && Date.now() - lastS > 1000) {
            document.body.classList.toggle('blur-data');
            vibrate(100); lastS = Date.now();
        }
    });

    window.addEventListener('orientationchange', () => {
        const layer = document.getElementById('stash-layer');
        Math.abs(window.orientation) === 90 ? layer.style.display = 'flex' : layer.style.display = 'none';
        if (window.orientation !== 0) vibrate(50);
    });
}

/* --- UTILS --- */
function toggleTheme() {
    const t = ['man', 'woman', 'child'];
    state.theme = t[(t.indexOf(state.theme) + 1) % 3];
    applyTheme(state.theme); save();
}

function applyTheme(t) { document.body.setAttribute('data-user', t); vibrate(40); }
function save() { localStorage.setItem('ledger_coon_shadow_v3', JSON.stringify(state)); }
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }
function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }
function updateClock() {
    const n = new Date();
    document.getElementById('clock-display').innerText = n.getHours().toString().padStart(2,'0') + ":" + n.getMinutes().toString().padStart(2,'0');
}
function handleAvatarClick() {
    clickCount++; vibrate(20);
    if(clickCount === 7) {
        document.getElementById('stashek-mood').style.filter = 'drop-shadow(0 0 15px gold)';
        alert("BOSS MODE: @kryspinowskyy Protocol Active.");
        state.xp += 500; save(); updateUI(); clickCount = 0;
    }
}
