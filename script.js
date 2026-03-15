/* --- LEDGERCOON V2: SOVEREIGN ENGINE --- */

let state = JSON.parse(localStorage.getItem('ledger_coon_v2')) || {
    income: 4000, fixed: 1500, payday: "2026-03-31",
    expenses: [], xp: 0, theme: 'dark', lang: 'pl', notes: "", avatar: null
};

let gameInterval;
let score = 0;

window.onload = () => {
    applyTheme(state.theme);
    const q = LEDGER_STRINGS[state.lang].quotes;
    document.getElementById('splash-quote').innerText = q[Math.floor(Math.random() * q.length)];
    
    if(state.avatar) document.getElementById('avatar-img').src = state.avatar;
    document.getElementById('shadow-notes').value = state.notes;
    
    updateUI();
    setInterval(updateClock, 1000);
    setTimeout(() => { document.getElementById('splash-screen').style.opacity = '0'; 
    setTimeout(() => document.getElementById('splash-screen').style.display='none', 800);
    document.getElementById('app-container').style.display='block'; }, 2500);
};

function save() { localStorage.setItem('ledger_coon_v2', JSON.stringify(state)); }

function updateUI() {
    const daily = calculateDaily();
    const amountEl = document.getElementById('daily-amount');
    amountEl.innerText = daily.toFixed(2);
    amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
    
    const survival = getSurvivalDays();
    document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${survival} dni`;
    
    const dialogues = LEDGER_STRINGS[state.lang].stashek;
    document.getElementById('stashek-talk').innerText = daily < 20 ? dialogues.bad : dialogues.good;
    
    updateRank();
}

function calculateDaily() {
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    return (state.income - state.fixed - spent) / days;
}

function getSurvivalDays() {
    const daily = calculateDaily();
    const totalLeft = (state.income - state.fixed) - state.expenses.reduce((s, e) => s + e.amount, 0);
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

function addXP(v) { state.xp += v; save(); updateRank(); }

/* MODALE */
function openExpenseModal() { document.getElementById('expense-modal').style.display='flex'; }
function closeModal() { document.getElementById('expense-modal').style.display='none'; }
function toggleSettings() { 
    const m = document.getElementById('settings-modal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}

function confirmExpense() {
    const v = parseFloat(document.getElementById('exp-val').value);
    if(v > 0) {
        state.expenses.push({amount: v, date: new Date().toISOString()});
        addXP(50); closeModal(); updateUI();
        document.getElementById('exp-val').value = "";
    }
}

function toggleStash() {
    const s = document.getElementById('stash-layer');
    s.style.display = s.style.display === 'flex' ? 'none' : 'flex';
}

function saveNotes() { state.notes = document.getElementById('shadow-notes').value; save(); }

/* SYSTEM */
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme); save();
}

function applyTheme(t) { document.body.setAttribute('data-theme', t); }

function updateClock() {
    const n = new Date();
    document.getElementById('clock-display').innerHTML = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
}

function triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
document.getElementById('avatar-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        state.avatar = reader.result;
        document.getElementById('avatar-img').src = reader.result;
        save();
    };
    reader.readAsDataURL(e.target.files[0]);
};

/* GRA */
function openMiniGame() { document.getElementById('game-container').style.display='flex'; score=0; initGame(); }
function closeMiniGame() { document.getElementById('game-container').style.display='none'; clearInterval(gameInterval); }
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40; canvas.height = window.innerHeight * 0.6;
    let x = canvas.width / 2; let items = [];
    gameInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font = "40px Arial"; ctx.fillText("🦝", x-20, canvas.height-50);
        if(Math.random()<0.05) items.push({x:Math.random()*canvas.width, y:0, v: Math.random()>0.2?10:-50, i:Math.random()>0.2?"🪙":"🧾"});
        items.forEach((it, i) => {
            it.y += 5; ctx.fillText(it.i, it.x, it.y);
            if(it.y > canvas.height-80 && Math.abs(it.x-x)<40) { score+=it.v; addXP(it.v>0?5:0); items.splice(i,1); }
        });
        document.getElementById('game-score').innerText = `PUNKTY: ${score}`;
    }, 30);
    canvas.ontouchmove = (e) => x = e.touches[0].clientX - 20;
}
