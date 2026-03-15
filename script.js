/* --- LEDGERCOON V2.5: SOVEREIGN ENGINE --- */

// Inicjalizacja stanu z localStorage (V2.5)
let state = JSON.parse(localStorage.getItem('ledger_coon_v2_5')) || {
    income: 0, bills: 0, payday: "", expenses: [], xp: 0, 
    theme: 'dark', lang: 'pl', notes: "", avatar: null, subs: [], decoy: false
};

let gameInterval;
let score = 0;
let clockClicks = 0;
let audioCtx;

// Klimatyczne sample audio (ASMR Finansowe)
const playSound = (type) => {
    try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);

        if(type === 'coin') { // Szelest banknotu/monety
            osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if(type === 'shred') { // Niszczarka
            const bufferSize = 2 * audioCtx.sampleRate;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const whiteNoise = audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 1000;
            whiteNoise.connect(filter); filter.connect(audioCtx.destination);
            whiteNoise.start(); whiteNoise.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) {} // Ignoruj błędy audio na starszych urządzeniach
};

window.onload = () => {
    applyTheme(state.theme || 'dark');
    updateUI();
    const q = LEDGER_STRINGS[state.lang].quotes;
    document.getElementById('splash-quote').innerText = q[Math.floor(Math.random() * q.length)];
    
    if(state.avatar) {
        const img = document.getElementById('avatar-img');
        img.src = state.avatar; img.style.display = 'block';
    }
    
    // Załaduj dane do pól Skarbca
    document.getElementById('shadow-notes').value = state.notes || "";
    document.getElementById('base-income').value = state.income || "";
    document.getElementById('base-bills').value = state.bills || "";
    document.getElementById('base-payday').value = state.payday || "";

    setInterval(updateClock, 1000);
    setTimeout(hideSplash, 2500);
};

function save() { localStorage.setItem('ledger_coon_v2_5', JSON.stringify(state)); }

function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    
    if(state.decoy) { // Tryb Przynęty
        amountEl.innerText = "15.20";
        document.getElementById('stashek-talk').innerText = "Kupisz mi te winogrona?";
    } else {
        amountEl.innerText = daily.toFixed(2);
        amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
        const survival = getSurvivalDays();
        document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${survival} dni`;
        const dialogues = LEDGER_STRINGS[state.lang].stashek;
        document.getElementById('stashek-talk').innerText = daily < 20 ? dialogues.bad : dialogues.good;
    }
    updateRank();
}

// Główna kalkulacja suwerennego budżetu
function calculateDaily() {
    if(!state.payday) return 0;
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    const subSum = state.subs ? state.subs.reduce((s, b) => s + b.amount, 0) : 0;
    return (state.income - state.bills - subSum - spent) / days;
}

// Zegar Przetrwania (Survival Days) z poprawioną logiką
function getSurvivalDays() {
    const daily = calculateDaily();
    const totalLeft = (state.income - state.bills) - state.expenses.reduce((s, e) => s + e.amount, 0);
    if(totalLeft <= 0) return 0;
    const count = Math.min(state.expenses.length, 7);
    const avg = state.expenses.length > 0 ? (state.expenses.slice(-7).reduce((s,e)=>s+e.amount, 0) / count) : daily;
    return Math.floor(totalLeft / (avg || 1));
}

function updateRank() {
    const ranks = LEDGER_STRINGS[state.lang].ranks;
    const lvl = Math.floor(state.xp / 1000);
    document.getElementById('rank-name').innerText = ranks[Math.min(lvl, ranks.length-1)];
    document.getElementById('xp-text').innerText = `${state.xp % 1000} / 1000 XP`;
    const offset = 150.8 - ((state.xp % 1000) / 1000) * 150.8;
    document.querySelector('.progress-ring__circle').style.strokeDashoffset = offset;
}

function updateBase() {
    state.income = parseFloat(document.getElementById('base-income').value) || 0;
    state.bills = parseFloat(document.getElementById('base-bills').value) || 0;
    state.payday = document.getElementById('base-payday').value;
    save(); updateUI();
}

function confirmExpense() {
    const v = parseFloat(document.getElementById('exp-val').value);
    const t = document.getElementById('exp-title').value;
    if(v > 0) {
        state.expenses.push({amount: v, title: t || "Zakup", date: new Date().toISOString()});
        state.xp += 40; playSound('coin'); 
        if (navigator.vibrate) navigator.vibrate(50);
        closeModal(); save(); updateUI();
        document.getElementById('exp-val').value = ""; document.getElementById('exp-title').value = "";
    }
}

function quickAdd(val) { document.getElementById('exp-val').value = val; }

// Suwerenne zarządzanie danymi (Błękitny Protokół)
function exportData() {
    const data = JSON.stringify(state);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ledger_akta.json'; a.click();
}

function triggerImport() { document.getElementById('import-input').click(); }
document.getElementById('import-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        state = JSON.parse(reader.result);
        save(); location.reload();
    };
    reader.readAsText(e.target.files[0]);
};

// Nawigacja i Tryby
function toggleSettings() { 
    const m = document.getElementById('settings-modal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}
function toggleStash() {
    const s = document.getElementById('stash-layer');
    s.style.display = s.style.display === 'flex' ? 'none' : 'flex';
}
function saveNotes() { state.notes = document.getElementById('shadow-notes').value; save(); }

function applyTheme(t) { document.body.setAttribute('data-theme', t); }
function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(state.theme); save(); }

function updateClock() {
    const n = new Date();
    document.getElementById('clock-display').innerHTML = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
}

// Decoy Mode (Tryb Przynęty) - 5 kliknięć w zegar
document.getElementById('clock-display').onclick = () => {
    clockClicks++;
    if(clockClicks >= 5) { state.decoy = !state.decoy; updateUI(); clockClicks = 0; }
    setTimeout(() => clockClicks = 0, 3000);
};

// Zarządzanie Avatarem Agenta
function triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
document.getElementById('avatar-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        state.avatar = reader.result;
        const img = document.getElementById('avatar-img');
        img.src = reader.result; img.style.display = 'block';
        save();
    };
    reader.readAsDataURL(e.target.files[0]);
};

// Systemowe
function hideSplash() { 
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; document.getElementById('app-container').style.display='block'; }, 800);
}
function openExpenseModal() { document.getElementById('expense-modal').style.display='flex'; }
function closeModal() { document.getElementById('expense-modal').style.display='none'; }

// Logika Minigry
function openMiniGame() { document.getElementById('game-container').style.display='flex'; initGame(); }
function closeMiniGame() { document.getElementById('game-container').style.display='none'; clearInterval(gameInterval); }
function initGame() {
    const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40; canvas.height = window.innerHeight * 0.6;
    let x = canvas.width / 2; let items = []; score = 0;
    gameInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font = "40px Arial"; ctx.fillText("🦝", x-20, canvas.height-50);
        if(Math.random()<0.05) items.push({x:Math.random()*canvas.width, y:0, v: 10, i: "🪙"});
        items.forEach((it, i) => {
            it.y += 5; ctx.fillText(it.i, it.x, it.y);
            if(it.y > canvas.height-80 && Math.abs(it.x-x)<40) { score+=it.v; state.xp+=5; items.splice(i,1); playSound('coin'); }
        });
        document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
    }, 30);
    canvas.ontouchmove = (e) => x = e.touches[0].clientX - 20;
}
