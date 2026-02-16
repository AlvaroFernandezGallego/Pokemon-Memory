// DOM Elements 
const gameBoard = document.getElementById('game-board');
const timerText = document.getElementById('timer-text');
const timerCircle = document.getElementById('timer-circle');
const restartBtn = document.getElementById('restart');
const modal = document.getElementById('result-modal');
const modalText = document.getElementById('result-text');
const modalAgain = document.getElementById('modal-again');
const selectionScreen = document.getElementById('selection-screen');
const startBtn = document.getElementById('start-game');
const genSelect = document.getElementById('gen-select');
const gameContainer = document.getElementById('game-container');

// Game variables 
let cardsArray = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matches = 0;
let timeLeft = 30;
let timer;

const PAIRS_COUNT = 6; // 12 cards total
const GEN_RANGES = {
    1:[1,151],2:[152,251],3:[252,386],4:[387,493],
    5:[494,649],6:[650,721],7:[722,809],8:[810,898],9:[899,1010]
};
const FULL_CIRCLE = 2 * Math.PI * 28; // Circle circumference for timer

// Fetch Pokémon images from selected generation 
async function fetchPokemonImages(gen)
{
    const [min,max] = GEN_RANGES[gen];
    const selectedIds = new Set();

    while(selectedIds.size < PAIRS_COUNT)
    {
        selectedIds.add(Math.floor(Math.random()*(max-min+1))+min);
    }
    const promises = [...selectedIds].map(id =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r=>r.json())
    );
    const results = await Promise.all(promises);
    return results.map(p=>p.sprites.front_default);
}

// Shuffle an array in place 
function shuffle(array)
{
    for(let i=array.length-1;i>0;i--)
    {
        const j = Math.floor(Math.random()*(i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Create a single card element 
function createCard(img)
{
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.pokemon = img;
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front"><img src="${img}" alt="Pokemon"></div>
            <div class="card-back"></div>
        </div>
    `;
    card.addEventListener('click',()=>flipCard(card));
    return card;
}

// Flip a card 
function flipCard(card)
{
    if(lockBoard || card===firstCard || card.classList.contains('flipped')) return;
    card.classList.add('flipped');
    if(!firstCard) firstCard = card;
    else 
        { 
            secondCard = card; 
            checkMatch(); 
        }
}

// Check if two flipped cards match 
function checkMatch(){
    if(firstCard.dataset.pokemon === secondCard.dataset.pokemon)
    {
        matches++;
        resetTurn();
        if(matches===PAIRS_COUNT) endGame(true);
    } 
    else 
    {
        lockBoard=true;
        setTimeout(()=>{
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetTurn();
        },1000); // Flip back after 1 second
    }
}

// Reset flipped card tracking 
function resetTurn()
{ 
    [firstCard, secondCard] = [null,null]; 
    lockBoard=false; 
}

// Start countdown timer and update circular progress 
function startTimer()
{
    clearInterval(timer);
    timeLeft = 30;
    timerText.textContent = `${timeLeft}s`;
    timerCircle.style.strokeDashoffset = 0;
    timer = setInterval(()=>{
        timeLeft--;
        timerText.textContent = `${timeLeft}s`;
        const progress = FULL_CIRCLE * (1 - timeLeft/30);
        timerCircle.style.strokeDashoffset = progress;
        if(timeLeft <=0)
        { 
            clearInterval(timer); 
            endGame(false); 
        }
    },
    1000);
}

// End game and show modal 
function endGame(won)
{
    lockBoard = true;
    clearInterval(timer); // Stop timer immediately
    modalText.textContent = won ? "You Won!" : "Time's Up!";
    modal.style.display = "flex";
}

// Initialize game 
async function initGame(gen)
{
    gameBoard.innerHTML = "";
    modal.style.display = "none";
    matches=0; firstCard=null; secondCard=null; lockBoard=false;
    const images = await fetchPokemonImages(gen);
    cardsArray = shuffle([...images,...images]);
    cardsArray.forEach(img=>gameBoard.appendChild(createCard(img)));
    startTimer();
}

// Event listeners
startBtn.addEventListener('click',()=>{
    const gen = parseInt(genSelect.value);
    selectionScreen.style.display="none";
    gameContainer.style.display="flex";
    initGame(gen);
});

restartBtn.addEventListener('click',()=>initGame(parseInt(genSelect.value)));

modalAgain.addEventListener('click',()=>{
    modal.style.display="none";
    gameContainer.style.display="none";
    selectionScreen.style.display="flex";
});
