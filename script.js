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
  sup: null,
};

// 포지션 한글 이름 매핑
const positionNames = {
  top: '탑',
  jg: '정글',
  mid: '미드',
  adc: '원딜',
  sup: '서폿',
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
    currentGameTime = 10 + Math.floor((Date.now() - gameStartTime) / 1000);
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

  // 결과 화면 초기화
  updateSpellTextDisplay();
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
    if (elapsed < 300) {
      // 5분 = 300초
      return; // 아무 반응 없음
    }
  }

  // 스펠 상태 저장
  spellStates[position] = {
    pressedTime: currentGameTime,
    button: button,
  };

  // 버튼 상태 업데이트
  updateSpellButton(position, currentGameTime);

  // 결과 화면 업데이트
  updateSpellTextDisplay();
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
    button.style.setProperty('--water-level', '0%');
  } else {
    // 스펠이 눌림
    button.classList.add('active');
    button.disabled = true;

    const remainingTime = 300 - (currentGameTime - pressedTime); // 5분 = 300초
    if (remainingTime > 0) {
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // 물이 빠지는 효과: 남은 시간 비율에 따라 물 높이 설정 (100% -> 0%)
      const waterLevel = (remainingTime / 300) * 100;
      button.style.setProperty('--water-level', `${waterLevel}%`);
    } else {
      timerElement.textContent = '00:00';
      button.style.setProperty('--water-level', '0%');
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

        // 물이 빠지는 효과 업데이트
        const button = document.getElementById(`spell-${position}`);
        const waterLevel = (remainingTime / 300) * 100;
        button.style.setProperty('--water-level', `${waterLevel}%`);
      } else {
        // 쿨타임 종료 - 스펠 상태 초기화
        spellStates[position] = null;
        updateSpellButton(position, null);
      }
    }
  });

  // 스펠 텍스트 업데이트 (쿨타임 종료된 것 제거)
  updateSpellTextDisplay();
}

// 스펠 텍스트 생성 및 화면 표시
function updateSpellTextDisplay() {
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
        // 시간 기준 정렬을 위해 futureTime과 함께 저장
        activeSpells.push({
          position: position,
          timeString: timeString,
          futureTime: futureTime,
        });
      }
    }
  });

  // futureTime 기준으로 오름차순 정렬
  activeSpells.sort((a, b) => a.futureTime - b.futureTime);

  // 정렬된 순서로 텍스트 조합
  const textToDisplay = activeSpells.map(spell => `${spell.position} ${spell.timeString}`).join(' ');

  // 결과 화면에 표시
  const resultDisplay = document.getElementById('resultDisplay');
  if (textToDisplay) {
    resultDisplay.textContent = textToDisplay;
  } else {
    resultDisplay.textContent = '';
  }
}
