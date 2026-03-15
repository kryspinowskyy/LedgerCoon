/* --- LEDGERCOON SOVEREIGN V3.0 (FINAL) --- */

let state;
try {
    state = JSON.parse(localStorage.getItem('ledger_coon_final')) || {
        income: 0, fixed: 0, payday: "", expenses: [], subs: [], xp: 0, lang: 'pl', notes: "", avatar: null, decoy: false
    };
} catch(e) {
    state = { income: 0, fixed: 0, payday: "", expenses: [], subs: [], xp: 0, lang: 'pl', notes: "", avatar: null, decoy: false };
}

let gameInterval; let score = 0; let audioCtx; let clockClicks = 0;

// Haptics & Audio
const vibrate = (pattern) => { if (navigator.vibrate) navigator.vibrate(pattern); };
const playSound = (type) => {
    try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === 'coin') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); }
        if (type === 'shred') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); }
        if (type === 'bad') { osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4); osc.start(); osc.stop(audioCtx.currentTime + 0.4); }
    } catch(e) {}
};

window.onload = () => {
    if (typeof LEDGER_STRINGS !== 'undefined' && state.lang in LEDGER_STRINGS) {
        document.getElementById('splash-quote').innerText = LEDGER_STRINGS[state.lang].quotes[Math.floor(Math.random() * LEDGER_STRINGS[state.lang].quotes.length)];
    }
    if(state.avatar) { const img = document.getElementById('avatar-img'); img.src = state.avatar; img.style.display = 'block'; }
    document.getElementById('shadow-notes').value = state.notes || "";
    document.getElementById('base-income').value = state.income || "";
    document.getElementById('base-bills').value = state.fixed || "";
    document.getElementById('base-payday').value = state.payday || "";

    renderSubscriptions(); renderShadowLog();
    setInterval(updateClock, 1000); updateClock();
    setTimeout(exitSplash, 2000);
};

function exitSplash() {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; document.getElementById('app-container').style.display = 'flex'; updateUI(); }, 500);
}

function save() { localStorage.setItem('ledger_coon_final', JSON.stringify(state)); }

/* --- GŁÓWNA LOGIKA BUDŻETU --- */
function updateUI() {
    const amountEl = document.getElementById('daily-amount');
    if(state.decoy) {
        amountEl.innerText = "12.50"; amountEl.style.color = "var(--text)";
        document.getElementById('stashek-talk').innerText = "Tryb Widmo aktywny.";
    } else {
        const daily = calculateDaily();
        amountEl.innerText = daily.toFixed(2);
        amountEl.style.color = daily < 0 ? "var(--danger)" : "var(--accent)";
        document.getElementById('streak-display').innerText = `⏳ Paliwa na: ${getSurvivalDays()} dni`;
        if (typeof LEDGER_STRINGS !== 'undefined') document.getElementById('stashek-talk').innerText = daily < 20 ? LEDGER_STRINGS[state.lang].stashek.bad : LEDGER_STRINGS[state.lang].stashek.good;
    }
    updateRank(); renderShadowLog();
}

function calculateDaily() {
    if(!state.payday) return 0;
    const days = Math.ceil((new Date(state.payday) - new Date()) / (1000*3600*24)) || 1;
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    const subSum = (state.subs || []).reduce((s, b) => s + b.amount, 0);
    return (state.income - state.fixed - subSum - spent) / days;
}

function getSurvivalDays() {
    const daily = calculateDaily();
    const subSum = (state.subs || []).reduce((s, b) => s + b.amount, 0);
    const totalLeft = (state.income - state.fixed - subSum) - state.expenses.reduce((s, e) => s + e.amount, 0);
    if(totalLeft <= 0) return 0;
    const count = Math.min(state.expenses.length, 5);
    const avg = count > 0 ? (state.expenses.slice(-5).reduce((s,e)=>s+e.amount,0) / count) : daily;
    return Math.floor(totalLeft / (avg || 1));
}

function updateRank() {
    const lvl = Math.floor(state.xp / 1000);
    if(typeof LEDGER_STRINGS !== 'undefined') document.getElementById('rank-name').innerText = LEDGER_STRINGS[state.lang].ranks[Math.min(lvl, 4)];
    document.getElementById('xp-text').innerText = `${state.xp} XP`;
    const offset = 150.8 - (((state.xp % 1000) / 1000) * 150.8);
    document.querySelector('.progress-ring__circle').style.strokeDashoffset = offset || 150.8;
}

/* --- WYDATKI I SHADOW LOG --- */
function confirmExpense() {
    const valEl = document.getElementById('exp-val'); const titleEl = document.getElementById('exp-title');
    const v = parseFloat(valEl.value);
    if(v > 0) {
        state.expenses.push({ id: Date.now(), amount: v, title: titleEl.value || "Zakup", date: new Date().toISOString() });
        state.xp += 50; vibrate(50); playSound('coin'); save(); updateUI(); closeModal('expense-modal');
        valEl.value = ""; titleEl.value = "";
    }
}

function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    state.xp = Math.max(0, state.xp - 50); // cofa XP
    vibrate([30, 50, 30]); playSound('shred'); save(); updateUI();
}

function renderShadowLog() {
    const container = document.getElementById('recent-expenses-log');
    container.innerHTML = "";
    const recent = state.expenses.slice(-5).reverse();
    if(recent.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    
    let html = `<small style="display:block; margin-bottom:5px; color:var(--accent); font-weight:bold; font-size:0.7rem;">OSTATNIE AKCJE</small>`;
    recent.forEach(exp => {
        html += `<div class="log-item">
            <span>${exp.title}</span>
            <div><span style="color:var(--danger); font-weight:bold; margin-right:10px;">-${exp.amount.toFixed(2)}</span>
            <button class="log-del-btn" onclick="deleteExpense(${exp.id})">✕</button></div>
        </div>`;
    });
    container.innerHTML = html;
}

/* --- PIJAWKI --- */
function openSubModal() { document.getElementById('sub-modal').style.display = 'flex'; }
function addPresetSub(name, amount) {
    if(!state.subs) state.subs = [];
    state.subs.push({ name, amount }); vibrate(50); save(); renderSubscriptions(); updateUI(); closeModal('sub-modal');
}
function addCustomSub() {
    closeModal('sub-modal');
    setTimeout(() => {
        const name = prompt("Nazwa pijawki:"); if(!name) return;
        const amount = parseFloat(prompt("Koszt miesięczny (PLN):")); if(!amount) return;
        addPresetSub(name, amount);
    }, 300);
}
function deleteSubscription(index) {
    if(!confirm("Usunąć pijawkę?")) return;
    state.subs.splice(index, 1); vibrate([50, 50, 50]); playSound('shred'); save(); renderSubscriptions(); updateUI();
}
function renderSubscriptions() {
    const container = document.getElementById('subs-container');
    container.innerHTML = "";
    if(!state.subs || state.subs.length === 0) { container.innerHTML = "<p style='font-size:0.8rem; opacity:0.5;'>Czysto.</p>"; return; }
    state.subs.forEach((sub, index) => {
        container.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(0,0,0,0.3); margin-bottom:5px; border-radius:10px;">
            <div><strong>${sub.name}</strong><br><small style="color:var(--accent);">${sub.amount.toFixed(2)} PLN/msc</small></div>
            <button onclick="deleteSubscription(${index})" style="background:none; border:none; color:var(--danger); font-size:1.2rem;">✕</button>
        </div>`;
    });
}

/* --- SKARBIEC I SYSTEM --- */
function updateBase() { state.income = parseFloat(document.getElementById('base-income').value)||0; state.fixed = parseFloat(document.getElementById('base-bills').value)||0; state.payday = document.getElementById('base-payday').value; save(); updateUI(); }
function saveNotes() { state.notes = document.getElementById('shadow-notes').value; save(); }
function toggleStash() { const s = document.getElementById('stash-layer'); s.style.display = s.style.display === 'flex' ? 'none' : 'flex'; }
function openExpenseModal() { document.getElementById('expense-modal').style.display='flex'; }
function closeModal(id) { document.getElementById(id).style.display='none'; }
function updateClock() { const clock = document.getElementById('clock-display'); if(clock) clock.innerText = new Date().toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'}); }

document.getElementById('clock-display').onclick = () => {
    clockClicks++;
    if(clockClicks >= 5) { state.decoy = !state.decoy; vibrate(300); updateUI(); clockClicks = 0; }
    setTimeout(() => clockClicks = 0, 3000);
};

function triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
document.getElementById('avatar-input').onchange = (e) => {
    const r = new FileReader(); r.onload = () => { state.avatar = r.result; document.getElementById('avatar-img').src = r.result; document.getElementById('avatar-img').style.display = 'block'; save(); };
    if(e.target.files[0]) r.readAsDataURL(e.target.files[0]);
};

/* --- MINIGRA (Symulator Pokus) --- */
function openMiniGame() { document.getElementById('game-container').style.display='flex'; initGame(); }
function closeMiniGame() { document.getElementById('game-container').style.display='none'; clearInterval(gameInterval); }

function initGame() {
    const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40; canvas.height = window.innerHeight * 0.6;
    let x = canvas.width / 2; let items = []; score = 0;

    canvas.ontouchmove = (e) => { x = e.touches[0].clientX - 20; e.preventDefault(); };

    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font = "40px Arial"; ctx.fillText("🦝", x-20, canvas.height-20);
        
        if(Math.random() < 0.08) {
            const types = [ {i:"🪙", v:10, t:'good'}, {i:"💵", v:50, t:'good'}, {i:"☕", v:-20, t:'bad'}, {i:"🍔", v:-50, t:'bad'} ];
            const rand = types[Math.floor(Math.random() * types.length)];
            items.push({x: Math.random() * (canvas.width - 30), y: 0, ...rand});
        }
        
        items.forEach((it, i) => {
            it.y += 6; ctx.fillText(it.i, it.x, it.y);
            if(it.y > canvas.height - 50 && Math.abs(it.x - (x-20)) < 40) { 
                score += it.v;
                if(it.t === 'good') { state.xp += 5; playSound('coin'); vibrate(20); } 
                else { playSound('bad'); vibrate([50, 50]); }
                items.splice(i,1); save(); updateUI();
            }
        });
        document.getElementById('game-score').innerText = `WYNIK: ${score}`;
        document.getElementById('game-score').style.color = score < 0 ? 'var(--danger)' : 'var(--accent)';
    }, 30);
}
