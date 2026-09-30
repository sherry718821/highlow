
function getCardValue(rank){
    const values = {
        A: 1,
        2: 2, 3: 3, 4: 4, 5: 5,
        6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
        J: 11, Q: 12, K: 13
    };
    const key = String(rank).toUpperCase();
    return values[key] ?? Number(rank);
}

const SUITS = [
    { symbol: '♠', color: 'black' },
    { symbol: '♣', color: 'black' },
    { symbol: '♥', color: 'red' },
    { symbol: '♦', color: 'red' }
];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

let points = 10000;
let bet = 0;
let pendingBet = 0;
let pendingChips = [];
let activeChips = [];
let multiplier = 1.0;
let inRound = false;
let currentCard = null;
let deck = [];
let hlPayout = 0.25;  // 높음/낮음: 정답 +0.25x, 오답 -0.25x
let eqPayout = 1;     // 같음 적중: +1.00x / 실패: -1.00x
let skipUses = 2;     // 게임당 스킵 2회

const $ = id => document.getElementById(id);

function buildDeck(){
    deck = [];
    for (const s of SUITS){
        for (let r = 0; r < RANKS.length; r++){
            deck.push({ rank: RANKS[r], value: getCardValue(RANKS[r]), suit: s.symbol, color: s.color });
        }
    }
    // simple shuffle
    for (let i = deck.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(){
    if (deck.length === 0) buildDeck();
    return deck.pop();
}

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function updateDashboard(){
    $('total-points').textContent = fmt(points);
    $('multiplier').textContent = multiplier.toFixed(2) + 'x';
    $('payout').textContent = fmt(bet * multiplier);
}

function renderCard(card, animate){
    const el = $('card');
    const show = () => {
        el.className = 'card ' + card.color;
        $('card-val-top').textContent = card.rank;
        $('card-suit-top').textContent = card.suit;
        $('card-val-bottom').textContent = card.rank;
        $('card-suit-bottom').textContent = card.suit;
        $('card-suit-center').textContent = card.suit;
    };
    if (animate){
        el.classList.add('flip');
        setTimeout(() => {
            show();
            el.classList.remove('flip');
        }, 250);
    } else {
        show();
    }
}

function spawnParticleBurst(symbols, variant){
    const cardEl = $('card');
    const rect = cardEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const layer = document.createElement('div');
    layer.className = 'kekw-layer';
    layer.style.left = '0';
    layer.style.top = '0';
    document.body.appendChild(layer);

    const count = 18;
    for (let i = 0; i < count; i++){
        const p = document.createElement('span');
        p.className = 'kekw-particle' + (variant ? ' ' + variant : '');
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
        const distance = 90 + Math.random() * 110;
        const kx = Math.cos(angle) * distance;
        const ky = Math.sin(angle) * distance;
        const rot = (Math.random() * 360 - 180).toFixed(0) + 'deg';
        p.style.left = originX + 'px';
        p.style.top = originY + 'px';
        p.style.setProperty('--kx', kx.toFixed(0) + 'px');
        p.style.setProperty('--ky', ky.toFixed(0) + 'px');
        p.style.setProperty('--kr', rot);
        p.style.fontSize = (18 + Math.random() * 16).toFixed(0) + 'px';
        p.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
        layer.appendChild(p);
    }

    setTimeout(() => { layer.remove(); }, 2400);
}

function spawnKekwBurst(){
    spawnParticleBurst(['ㅋ']);
}

function spawnWinBurst(){
    const cardEl = $('card');
    const rect = cardEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const layer = document.createElement('div');
    layer.className = 'kekw-layer';
    layer.style.left = '0';
    layer.style.top = '0';
    document.body.appendChild(layer);

    const colors = ['#ffd700', '#ff2d78', '#00e5ff', '#39ff88', '#fff3b0'];
    const count = 26;
    for (let i = 0; i < count; i++){
        const p = document.createElement('span');
        p.className = 'confetti-piece';
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.6 - 0.3);
        const distance = 140 + Math.random() * 180;
        const kx = Math.cos(angle) * distance;
        const ky = Math.sin(angle) * distance;
        const rot = (Math.random() * 360 - 180).toFixed(0) + 'deg';
        p.style.left = originX + 'px';
        p.style.top = originY + 'px';
        p.style.setProperty('--kx', kx.toFixed(0) + 'px');
        p.style.setProperty('--ky', ky.toFixed(0) + 'px');
        p.style.setProperty('--kr', rot);
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = (6 + Math.random() * 6).toFixed(0) + 'px';
        p.style.height = (10 + Math.random() * 8).toFixed(0) + 'px';
        p.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
        p.style.animationDelay = (Math.random() * 0.1).toFixed(2) + 's';
        layer.appendChild(p);
    }

    setTimeout(() => { layer.remove(); }, 2000);
}

function setMessage(text, type){
    // 메시지 UI는 제거되었습니다. 게임 로직 호환을 위해 함수만 유지합니다.
}


function renderPendingBet(){
    const totalEl = $('bet-total');
    const chipsEl = $('selected-chips');
    if (totalEl) totalEl.textContent = fmt(pendingBet);

    if (!chipsEl) return;
    const displayedChips = inRound ? activeChips : pendingChips;
    if (displayedChips.length === 0){
        chipsEl.innerHTML = '<span class="empty-chip-message">아직 배팅한 칩이 없습니다.</span>';
    } else if (inRound) {
        chipsEl.innerHTML = displayedChips.map((value) => `
            <span class="mini-chip mini-chip-${value}" title="현재 게임에 건 칩">${fmt(value)}</span>
        `).join('');
    } else {
        chipsEl.innerHTML = displayedChips.map((value, index) => `
            <button class="mini-chip mini-chip-${value} ${index === displayedChips.length - 1 ? 'chip-added' : ''}" onclick="removeChip(${index})" title="이 칩 빼기">
                ${fmt(value)}
            </button>
        `).join('');
    }

    updateChipButtons();
}

function updateChipButtons(){
    document.querySelectorAll('.chip').forEach(btn => {
        const value = Number(btn.dataset.value);
        btn.disabled = inRound || points < value;
    });
}

function addChip(value){
    if (inRound) return;
    if (points < value){
        setMessage(`${fmt(value)} 포인트 칩을 놓기에는 보유 포인트가 부족합니다.`, 'lose');
        return;
    }
    points -= value;
    pendingBet += value;
    pendingChips.push(value);
    renderPendingBet();
    const sourceChip = document.querySelector(`.chip[data-value="${value}"]`);
    if (sourceChip){
        sourceChip.classList.remove('chip-pressed');
        void sourceChip.offsetWidth;
        sourceChip.classList.add('chip-pressed');
        sourceChip.addEventListener('animationend', () => {
            sourceChip.classList.remove('chip-pressed');
        }, { once: true });
    }
    updateDashboard();
    setControlsForRound(false);
    setMessage(`${fmt(value)} 칩을 추가했습니다. 원하는 만큼 칩을 쌓아주세요.`);
}

function removeChip(index){
    if (inRound || index < 0 || index >= pendingChips.length) return;
    const value = pendingChips.splice(index, 1)[0];
    pendingBet -= value;
    points += value;
    renderPendingBet();
    updateDashboard();
    setControlsForRound(false);
    setMessage(`${fmt(value)} 칩을 배팅에서 뺐습니다.`);
}

function clearBet(){
    if (inRound || pendingChips.length === 0) return;
    points += pendingBet;
    pendingBet = 0;
    pendingChips = [];
    renderPendingBet();
    updateDashboard();
    setControlsForRound(false);
    setMessage('배팅을 초기화했습니다. 아래에서 다시 칩을 선택하세요.');
}

function setControlsForRound(active){
    $('start-btn').disabled = active || pendingBet <= 0;
    $('clear-bet-btn').disabled = active || pendingChips.length === 0;
    $('low-btn').disabled = !active;
    $('equal-btn').disabled = !active;
    $('high-btn').disabled = !active;
    $('skip-btn').disabled = !active || skipUses <= 0;
    $('cashout-btn').disabled = !active;
    $('skip-count').textContent = skipUses + '회';
    updateChipButtons();
}


function startGame(){
    if (inRound) return;
    if (pendingBet <= 0){
        setMessage('아래 칩을 하나 이상 배팅해주세요.', 'lose');
        return;
    }

    bet = pendingBet;
    activeChips = pendingChips.slice();
    pendingBet = 0;
    pendingChips = [];
    multiplier = 1.0;
    skipUses = 2;
    inRound = true;
    buildDeck();
    currentCard = drawCard();
    renderCard(currentCard, false);
    renderPendingBet();
    setControlsForRound(true);
    updateDashboard();
    setMessage(`총 ${fmt(bet)} 포인트로 게임을 시작합니다. 다음 카드를 예측하세요!`);
}


function showResultOverlay(change){
    const overlay = $('result-overlay');
    const arrow = $('result-overlay-arrow');
    const text = $('result-overlay-text');
    if (!overlay) return;

    const gained = change > 0;
    overlay.classList.remove('gain', 'loss', 'show');
    void overlay.offsetWidth;

    overlay.classList.add(gained ? 'gain' : 'loss');
    arrow.textContent = gained ? '↑' : '↓';
    text.textContent = (gained ? '+' : '') + change.toFixed(2) + 'x';
    overlay.classList.add('show');

    setTimeout(() => {
        overlay.classList.remove('show', 'gain', 'loss');
    }, 1400);
}

function makeGuess(guess){
    if (!inRound) return;
    const nextCard = drawCard();
    let correct = false;

    if (guess === 'equal'){
        correct = getCardValue(nextCard.rank) === getCardValue(currentCard.rank);
    } else if (guess === 'high'){
        correct = getCardValue(nextCard.rank) > getCardValue(currentCard.rank);
    } else if (guess === 'low'){
        correct = getCardValue(nextCard.rank) < getCardValue(currentCard.rank);
    }

    renderCard(nextCard, true);

    setTimeout(() => {
        const change = guess === 'equal' ? eqPayout : hlPayout;
        const appliedChange = correct ? change : -change;

        multiplier += appliedChange;
        if (multiplier < 0) multiplier = 0;

        currentCard = nextCard;
        updateDashboard();
        showResultOverlay(appliedChange);

        if (correct){
            spawnWinBurst();
        } else {
            spawnKekwBurst();
        }

        if (multiplier <= 0){
            bet = 0;
            activeChips = [];
            multiplier = 0;
            inRound = false;
            setControlsForRound(false);
            renderPendingBet();
            updateDashboard();
        }
    }, 260);
}

function skipCard(){
    if (!inRound || skipUses <= 0) return;
    skipUses--;
    const nextCard = drawCard();
    renderCard(nextCard, true);
    setTimeout(() => {
        currentCard = nextCard;
        $('skip-count').textContent = skipUses + '회';
        setControlsForRound(true);
        updateDashboard();
    }, 260);
}

function cashOut(){
    if (!inRound) return;
    const payout = bet * multiplier;
    points += payout;
    setMessage(`정산 완료! ${fmt(payout)} 포인트를 획득했습니다.`, 'win');
    bet = 0;
    activeChips = [];
    multiplier = 1.0;
    skipUses = 2;
    inRound = false;
    setControlsForRound(false);
    updateDashboard();
    renderPendingBet();
}


updateDashboard();
renderPendingBet();
