let allRiddles = [];
let currentIndex = 0;
let currentRiddle = null;
let score = 200;
let totalRiddles = 0;

const levelNames = { 1: 'سهل', 2: 'متوسط', 3: 'صعب', 4: 'خبير', 5: 'أسطورة' };
const levelColors = { 1: '#4caf50', 2: '#2196f3', 3: '#ff9800', 4: '#e91e63', 5: '#9c27b0' };

async function startGame() {
    const res = await fetch('/api/game');
    allRiddles = await res.json();
    totalRiddles = allRiddles.length;
    currentIndex = 0;
    score = 200;
    updateStats();
    loadRiddle();
}

function loadRiddle() {
    if (currentIndex >= allRiddles.length) {
        endGame();
        return;
    }
    currentRiddle = allRiddles[currentIndex];
    document.getElementById('question-text').innerText = currentRiddle.question;
    document.getElementById('level-badge').innerText = levelNames[currentRiddle.level];
    document.getElementById('level-badge').style.background = levelColors[currentRiddle.level];
    document.getElementById('reward-badge').innerText = '+' + currentRiddle.reward;
    updateStats();
    setupLetterButtons();
}

function setupLetterButtons() {
    const slotsContainer = document.getElementById('answer-slots');
    const lettersContainer = document.getElementById('letters-bank');
    slotsContainer.innerHTML = '';
    lettersContainer.innerHTML = '';

    const answer = currentRiddle.answer;

    // إنشاء خانات الإجابة
    for (let i = 0; i < answer.length; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.dataset.index = i;
        slot.onclick = () => removeLetterFromSlot(slot);
        slotsContainer.appendChild(slot);
    }

    // تجهيز الحروف
    const answerLetters = answer.split('');
    const distractors = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
    const answerSet = new Set(answerLetters);
    const availableDistractors = distractors.filter(l => !answerSet.has(l));

    const allLetters = [...answerLetters];
    const numDistractors = Math.min(4, Math.max(2, Math.ceil(answer.length / 2)));
    for (let i = 0; i < numDistractors; i++) {
        const pool = availableDistractors.length > 0 ? availableDistractors : distractors;
        allLetters.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    allLetters.sort(() => Math.random() - 0.5);

    // تحديد الحروف المشتتة
    let remaining = [...answerLetters];
    allLetters.forEach((letter, idx) => {
        const pos = remaining.indexOf(letter);
        const isDistractor = pos === -1;
        if (!isDistractor) remaining.splice(pos, 1);

        const btn = document.createElement('button');
        btn.classList.add('letter-btn');
        btn.innerText = letter;
        btn.dataset.id = idx;
        btn.dataset.letter = letter;
        btn.dataset.distractor = isDistractor ? 'true' : 'false';
        btn.onclick = () => addLetterToSlot(letter, btn);
        lettersContainer.appendChild(btn);
    });
}

function addLetterToSlot(letter, btn) {
    if (btn.disabled) return;
    const slots = document.querySelectorAll('.slot');
    for (const slot of slots) {
        if (slot.innerText === '') {
            slot.innerText = letter;
            slot.dataset.letterId = btn.dataset.id;
            btn.disabled = true;
            checkWin();
            return;
        }
    }
}

function removeLetterFromSlot(slot) {
    if (slot.innerText === '') return;
    const btn = document.querySelector(`.letter-btn[data-id="${slot.dataset.letterId}"]`);
    if (btn) btn.disabled = false;
    slot.innerText = '';
    slot.dataset.letterId = '';
}

function checkWin() {
    const slots = document.querySelectorAll('.slot');
    let word = '';
    slots.forEach(s => word += s.innerText);
    if (word.length !== currentRiddle.answer.length) return;
    if (word === currentRiddle.answer) {
        score += currentRiddle.reward;
        updateStats();
        showToast(`✅ إجابة صحيحة! +${currentRiddle.reward}`);
        setTimeout(() => {
            currentIndex++;
            loadRiddle();
        }, 800);
    } else {
        const c = document.getElementById('answer-slots');
        c.style.transform = 'translateX(10px)';
        setTimeout(() => c.style.transform = 'translateX(-10px)', 100);
        setTimeout(() => c.style.transform = 'translateX(0)', 200);
    }
}

// ===== المساعدات =====
function useReveal() {
    if (score < 20) return showToast('❌ نقاط غير كافية', true);
    const slots = Array.from(document.querySelectorAll('.slot'));
    const target = slots.find(s => {
        const idx = parseInt(s.dataset.index);
        return s.innerText !== currentRiddle.answer[idx];
    });
    if (!target) return showToast('كل الحروف مكشوفة');
    // إذا كان الحرف الخطأ موجوداً، أعده للبنك
    if (target.innerText !== '') {
        const oldBtn = document.querySelector(`.letter-btn[data-id="${target.dataset.letterId}"]`);
        if (oldBtn) oldBtn.disabled = false;
        target.innerText = '';
        target.dataset.letterId = '';
    }
    const idx = parseInt(target.dataset.index);
    const needed = currentRiddle.answer[idx];
    const candidates = Array.from(document.querySelectorAll(`.letter-btn[data-letter="${needed}"]`));
    let btn = candidates.find(b => !b.disabled);
    if (!btn) {
        // حاول تحرير حرف محبوس في مكان خاطئ
        for (const c of candidates) {
            if (c.disabled) {
                const placedSlot = slots.find(s => s.dataset.letterId === c.dataset.id);
                if (placedSlot) {
                    const pIdx = parseInt(placedSlot.dataset.index);
                    if (currentRiddle.answer[pIdx] !== needed) {
                        placedSlot.innerText = '';
                        placedSlot.dataset.letterId = '';
                        c.disabled = false;
                        btn = c;
                        break;
                    }
                }
            }
        }
    }
    if (!btn) return showToast('لا يوجد حرف متاح');
    btn.disabled = true;
    btn.classList.add('used');
    target.innerText = needed;
    target.dataset.letterId = btn.dataset.id;
    score -= 20;
    updateStats();
    checkWin();
}

function useRemove() {
    if (score < 30) return showToast('❌ نقاط غير كافية', true);
    const buttons = Array.from(document.querySelectorAll('.letter-btn:not(:disabled)'));
    const distractors = buttons.filter(b => b.dataset.distractor === 'true');
    let removed = 0;
    for (const b of distractors) {
        if (removed >= 3) break;
        b.disabled = true;
        b.classList.add('removed');
        removed++;
    }
    if (removed === 0) return showToast('لا توجد حروف للإزالة');
    score -= 30;
    updateStats();
}

function useSkip() {
    if (score < 50) return showToast('❌ نقاط غير كافية', true);
    score -= 50;
    updateStats();
    currentIndex++;
    showToast('⏭️ تم التخطي');
    setTimeout(loadRiddle, 400);
}

// ===== النهاية =====
function endGame() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}

async function submitScore() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) return alert('يرجى إدخال اسمك');
    await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score })
    });
    const res = await fetch('/api/leaderboard');
    const board = await res.json();
    const container = document.getElementById('leaderboard-container');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    board.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${i + 1}. ${p.name}</span><span>${p.score} 💰</span>`;
        list.appendChild(li);
    });
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

function updateStats() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = currentRiddle ? currentRiddle.level : '-';
    document.getElementById('progress').innerText = `${currentIndex + 1}/${totalRiddles}`;
    // تعطيل الأزرار عند نقص النقاط
    document.querySelectorAll('.hint-btn')[0].disabled = score < 20;
    document.querySelectorAll('.hint-btn')[1].disabled = score < 30;
    document.querySelectorAll('.hint-btn')[2].disabled = score < 50;
}

function showToast(msg, isError) {
    const t = document.createElement('div');
    t.innerText = msg;
    t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:${isError ? '#f44336' : '#4caf50'};color:white;padding:12px 20px;
        border-radius:25px;font-weight:700;z-index:9999;font-family:Cairo,sans-serif;
        box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
}

startGame();