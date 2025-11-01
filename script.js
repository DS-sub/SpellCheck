// 게임 시간 변수
let gameStartTime = null;
let gameTimerInterval = null;
let currentGameTime = 0; // 초 단위

// 스펠 상태 저장 (position: { pressedTime: 게임 시간(초), button: 버튼 요소 })
const spellStates = {
    top: null,
    jg: null,
    mid: null,
    adc: null,
    sup: null
};

// 포지션 한글 이름 매핑
const positionNames = {
    top: '탑',
    jg: '정글',
    mid: '미드',
    adc: '원딜',
    sup: '서폿'
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const spellButtons = document.querySelectorAll('.spell-btn');
    
    // 게임 시작 버튼
    startBtn.addEventListener('click', startGame);
    
    // 스펠 버튼 클릭 이벤트
    spellButtons.forEach(button => {
        button.addEventListener('click', handleSpellClick);
    });
});

// 게임 시작
function startGame() {
    if (gameStartTime !== null) {
        // 게임 재시작
        if (confirm('게임을 다시 시작하시겠습니까? 모든 스펠 타이머가 초기화됩니다.')) {
            resetGame();
        } else {
            return;
        }
    }
    
    gameStartTime = Date.now();
    currentGameTime = 10;
    updateGameTimer();
    
    // 게임 타이머 시작 (1초마다 업데이트)
    gameTimerInterval = setInterval(() => {
        currentGameTime = currentGameTime + Math.floor((Date.now() - gameStartTime) / 1000);
        updateGameTimer();
        checkSpellCooldowns();
    }, 1000);
    
    document.getElementById('startBtn').textContent = '게임 재시작';
}

// 게임 재설정
function resetGame() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
    
    gameStartTime = null;
    currentGameTime = 0;
    
    // 모든 스펠 상태 초기화
    Object.keys(spellStates).forEach(position => {
        spellStates[position] = null;
        updateSpellButton(position, null);
    });
    
    updateGameTimer();
    document.getElementById('startBtn').textContent = '게임 시작';
}

// 게임 타이머 표시 업데이트
function updateGameTimer() {
    const minutes = Math.floor(currentGameTime / 60);
    const seconds = currentGameTime % 60;
    const timerDisplay = document.getElementById('gameTimer');
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 스펠 버튼 클릭 처리
function handleSpellClick(event) {
    if (gameStartTime === null) {
        alert('먼저 게임 시작 버튼을 눌러주세요.');
        return;
    }
    
    const button = event.currentTarget;
    const position = button.dataset.position;
    
    // 이미 눌린 스펠인지 확인 (5분이 지나지 않은 경우)
    if (spellStates[position] !== null) {
        const elapsed = currentGameTime - spellStates[position].pressedTime;
        if (elapsed < 300) { // 5분 = 300초
            return; // 아무 반응 없음
        }
    }
    
    // 스펠 상태 저장
    spellStates[position] = {
        pressedTime: currentGameTime,
        button: button
    };
    
    // 버튼 상태 업데이트
    updateSpellButton(position, currentGameTime);
    
    // 클립보드에 복사
    copySpellTextToClipboard();
}

// 스펠 버튼 UI 업데이트
function updateSpellButton(position, pressedTime) {
    const button = document.getElementById(`spell-${position}`);
    const timerElement = document.getElementById(`timer-${position}`);
    
    if (pressedTime === null) {
        // 스펠이 눌리지 않았거나 쿨타임 종료
        button.classList.remove('active');
        button.disabled = false;
        timerElement.textContent = '--:--';
    } else {
        // 스펠이 눌림
        button.classList.add('active');
        button.disabled = true;
        
        const remainingTime = 300 - (currentGameTime - pressedTime); // 5분 = 300초
        if (remainingTime > 0) {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timerElement.textContent = '00:00';
        }
    }
}

// 스펠 쿨타임 체크 및 업데이트
function checkSpellCooldowns() {
    Object.keys(spellStates).forEach(position => {
        if (spellStates[position] !== null) {
            const elapsed = currentGameTime - spellStates[position].pressedTime;
            
            if (elapsed < 300) {
                // 쿨타임 진행 중 - 남은 시간 표시 업데이트
                const remainingTime = 300 - elapsed;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                const timerElement = document.getElementById(`timer-${position}`);
                timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                // 쿨타임 종료 - 스펠 상태 초기화
                spellStates[position] = null;
                updateSpellButton(position, null);
            }
        }
    });
    
    // 스펠 텍스트 업데이트 (쿨타임 종료된 것 제거)
    copySpellTextToClipboard();
}

// 스펠 텍스트 생성 및 클립보드 복사
function copySpellTextToClipboard() {
    const activeSpells = [];
    
    // 활성화된 스펠들만 수집 (5분이 지나지 않은 것들)
    Object.keys(spellStates).forEach(position => {
        if (spellStates[position] !== null) {
            const elapsed = currentGameTime - spellStates[position].pressedTime;
            if (elapsed < 300) {
                const pressedTime = spellStates[position].pressedTime;
                const futureTime = pressedTime + 300; // 5분 후 시간
                const minutes = Math.floor(futureTime / 60);
                const seconds = futureTime % 60;
                const timeString = `${String(minutes).padStart(2, '0')}${String(seconds).padStart(2, '0')}`;
                activeSpells.push(`${position} ${timeString}`);
            }
        }
    });
    
    // 텍스트 조합
    const textToCopy = activeSpells.join(' ');
    
    // 클립보드에 복사
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('복사됨:', textToCopy);
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopyTextToClipboard(textToCopy);
        });
    } else {
        fallbackCopyTextToClipboard(textToCopy);
    }
}

// 클립보드 복사 폴백 (구형 브라우저 지원)
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            console.log('복사됨 (폴백):', text);
        }
    } catch (err) {
        console.error('복사 실패 (폴백):', err);
    }
    
    document.body.removeChild(textArea);
}

