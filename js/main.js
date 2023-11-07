/*----- constants -----*/
import { WORDS } from "./words.js";

const COLORS = {
    P: 'var(--green)',
    A: 'var(--yellow)',
    'null': 'var(--dark-grey)'
  };
  
  /*----- state variables -----*/
  let secretWord;
  let guesses;
  let guessScores;
  let curGuessIdx;
  let bestScoreByLtr; // Ex: {a: 'P', c: 'A', e: 'P'} used to render buttons
  let wrongLtrs;
  let showBadWord;
  let winner;  // null -> game in play; 'W' -> win; 'L' -> lost
  
  /*----- cached elements  -----*/
  const boardEls = [
    [...document.querySelectorAll('.guess1')],
    [...document.querySelectorAll('.guess2')],
    [...document.querySelectorAll('.guess3')],
    [...document.querySelectorAll('.guess4')],
    [...document.querySelectorAll('.guess5')],
    [...document.querySelectorAll('.guess6')],
  ];
  const playAgainBtn = document.getElementById('play-again');
  const ltrBtns = [...document.querySelectorAll('#keyboard > button')].slice(0, 26);
  const enterBtn = document.querySelector('#keyboard > button:last-child');
  const bsBtn = document.querySelector('#keyboard > button:nth-child(27)');
  const titleEl = document.getElementById('title');
  const badWordEl = document.getElementById('bad-word');
  
  /*----- event listeners -----*/
  document.getElementById('keyboard').addEventListener('click', handleKeyboardClick);
  playAgainBtn.addEventListener('click', init);
  
  document.querySelector('h1').addEventListener('click', function() {
    // TEMP DEBUG
    winner = "L"
    render()
  })
  
  /*----- functions -----*/
  init();
  
  function init() {
    secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    guesses = [
      [null, null, null, null, null],  // 1st Guess
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];
    guessScores = [
      [null, null, null, null, null],  // null -> Not scored, 'P' -> Perfect, 'A' -> Almost, 'I' -> Not in word
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];
    curGuessIdx = 0;
    wrongLtrs = new Set();
    bestScoreByLtr = {};
    showBadWord = false;
    winner = null;
    render();
  }
  
  function handleKeyboardClick(evt) {
    if (winner) return;
    let letter = evt.target.innerText;
    if (letter === '⌫') {
      handleBackspace();
    } else if (letter === 'ENTER') {
      handleEnter();
    } else if (letter.length === 1) {
      handleLetter(letter);
    } else {
      return;
    }
    render();
  }
  
  function handleBackspace() {
    const wordArr = guesses[curGuessIdx];
    const ltrIdx = wordArr.findLastIndex((ltr) => ltr);
    if (ltrIdx === -1) return;
    wordArr[ltrIdx] = null;
  }
  
  function handleEnter() {
    showBadWord = !WORDS.includes(guesses[curGuessIdx].join(''));
    if (showBadWord) return;
    winner = getWinner();
    computeGuessScore();
    if (!winner) curGuessIdx++;
  }
  
  function handleLetter(ltr) {
    ltr = ltr.toLowerCase();
    const wordArr = guesses[curGuessIdx];
    const ltrIdx = wordArr.indexOf(null);
    if (ltrIdx === -1) return;
    wordArr[ltrIdx] = ltr;
    renderPopInAnimation(ltrIdx);
  }
  
  function computeGuessScore() {
    const score = guessScores[curGuessIdx];
    const guessCopy = [...guesses[curGuessIdx]];
    const secretCopy = [...secretWord];
    // Compute Perfects first
    guessCopy.forEach(function(ltr, ltrIdx) {
      if (!secretCopy.includes(ltr)) {
        wrongLtrs.add(ltr);
      } else if (ltr === secretCopy[ltrIdx]) {
        score[ltrIdx] = 'P';  // Perfect match
        guessCopy[ltrIdx] = null;  // Mark as used 
        secretCopy[ltrIdx] = null;
        bestScoreByLtr[ltr] = 'P';
      }
    });
    // Compute Almosts
    guessCopy.forEach(function(ltr, ltrIdx) {
      let idxInSecret = ltr ? secretCopy.indexOf(ltr) : -1;
      if (idxInSecret !== -1) {
        score[ltrIdx] = 'A';
        secretCopy[idxInSecret] = null;
        if (bestScoreByLtr[ltr] !== 'P') bestScoreByLtr[ltr] = 'A';
      }
    });
  }
  
  function getWinner() {
    if (guesses[curGuessIdx].join('') === secretWord) return 'W';
    if (curGuessIdx === 5) return 'L';
    return null;
  }
  
  function render() {
    renderBoard();
    renderButtons();
    renderMessage();
    renderControls();
  }
  
  function renderMessage() {
    if (winner === 'W') {
      titleEl.innerHTML = '<span style="color: var(--green)">Congrats!</span>';
    } else if (winner === 'L') {
      titleEl.innerHTML = '<span style="color: var(--red)">Better Luck Next Time</span>';
    } else {
      titleEl.innerHTML = 'Wordle';
    }
    titleEl.style.display = showBadWord ? 'none' : 'block';
    badWordEl.style.display = showBadWord ? 'block' : 'none';
    if (showBadWord) {
      showBadWord = false;
      setTimeout(function() {
        titleEl.style.display = 'block';
        badWordEl.style.display = 'none';
      }, 2000)
    }
  }
  
  function renderPopInAnimation(ltrIdx) {
    boardEls[curGuessIdx][ltrIdx].classList.add('pop-in');
    setTimeout(function() {
      boardEls[curGuessIdx][ltrIdx].classList.remove('pop-in');
    }, 750);
  }
  
  function renderControls() {
    playAgainBtn.style.display = winner ? 'inline' : 'none';
    enterBtn.disabled = guesses[curGuessIdx].includes(null);
    bsBtn.disabled = !guesses[curGuessIdx][0];
  }
  
  // Render the letters according to its best usage thus far
  function renderButtons() {
    ltrBtns.forEach(function(btn) {
      const ltr = btn.innerText.toLowerCase();
      if (wrongLtrs.has(ltr)) {
        btn.style.backgroundColor = 'var(--dark-grey)';
        btn.style.color = 'white';
      } else if (ltr in bestScoreByLtr) {
        btn.style.backgroundColor = COLORS[bestScoreByLtr[ltr]];
        btn.style.color = 'white';
      } else {
        btn.style.backgroundColor = 'var(--light-grey';
        btn.style.color = 'black';
      }
    });
  }
  
  function renderBoard() {
    guesses.forEach(function(guessArr, guessIdx) {
      if (guessIdx < curGuessIdx || (winner && guessIdx === curGuessIdx)) {
        renderPrevGuess(guessIdx);
      } else {
        guessArr.forEach(function(ltr, ltrIdx) {
          const el = boardEls[guessIdx][ltrIdx];
          el.innerText = ltr ? ltr : '';
          el.style.backgroundColor = 'white';
          el.style.borderColor = 'var(--light-grey)';
          el.style.fontColor = 'black';
        });
      }
    });
  }
  
  function renderPrevGuess(guessIdx) {
    guessScores[guessIdx].forEach(function(score, ltrIdx) {
      const el = boardEls[guessIdx][ltrIdx];
      el.style.backgroundColor = el.style.borderColor = COLORS[score];
      el.style.color = 'white';
    });
  }