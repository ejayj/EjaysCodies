//import server connection
var socket = io()

//create connection to server
socket.on('connect', function () {
    console.log('Connected to Server')
});

var redscore = 9 //how many tiles they get to start
var bluescore = 8 //how many tiles they get to start
var cards = []
var availablecards = [] //keep track of cards already used 
var avaialbleColors = []
var currentTurn = "Red"; //to start, red normally goes first
var ShowBomb = "on"; //its on to start
var TimerSeconds = 61; //its 60 seconds to start
var Timer = "off";
var wordcards = [];
var wordPackChoice = 0; //the user will choose the word pack on front end, this code change re-runs the build game. (maybe make an alert saying this action will create a new game). default is 0
var client = 0; //keeps track of how many people are connected so we know to build the game

//GAME VARIABLES
//how many cards we want of each
var bluecards = 8
var redcards = 9
var blackcards = 1
var myTimer;

//COLORS
const defaultcard = "#DDD";

//there's actually 4 colors: ; make text their perspective dark color?
const spymasterblue = "rgb(154,198,242)";
const spymasterred = "rgb(225,156,153)";
const spymasterblack = "rgb(94,94,94)";

//this is colored to all players; make the text white in all of these
const revealedblue = "rgb(65,132,222)";
const revealedred = "rgb(211,72,62)";
const revealednull = "rgb(183,170,163)";
const revealedblack = "rgb(32,32,32) ";


//****************SPYMASTER FUNCTIONS ***********
function toggleSpyMaster() { //turns on spymaster mode
    if (document.getElementById("togglespymaster").value == "Guesser") {
        displayColors();
        document.getElementById("togglespymaster").value = "Spymaster";
    } else if (document.getElementById("togglespymaster").value == "Spymaster") {
        hideColors();
        document.getElementById("togglespymaster").value = "Guesser";
    }
}

function toggleBombClient(Toggle) { //turns on/off bomb detection for spymaster

    ShowBomb = Toggle;

    if (ShowBomb == "off") {
        document.getElementById("BombToggle").value = "Show Bomb"; //the button will now show the bomb because it is currently hidden

        if (document.getElementById("togglespymaster").value == "Spymaster") {//if you are spymaster, refresh your display
            displayColors();
        }

    }
    else if (ShowBomb == "on") //bomb will be shown
    {
        document.getElementById("BombToggle").value = "Hide Bomb"; //the button will now hide the bomb because it is active

        if (document.getElementById("togglespymaster").value == "Spymaster") {//if you are spymaster, refresh your display
            displayColors();
        }

    }
}

function displayColors() { //for example, if someone hits the bomb, show the users all the colors from spymaster view
    for (let i = 0; i < 25; i++) { //for every card, display 
        let CurrentCard = cards[i] //get card array
        let CardNumber = CurrentCard[0];
        let CardColor = CurrentCard[1];


        if (CardColor == "null") { //if null, display nothing 

        } else if (CardColor == "red") { //if red, display spymaster red
            document.getElementById(CardNumber).style.background = "rgb(225,156,153)";
        } else if (CardColor == "blue") { //if blue, display spymaster blue
            document.getElementById(CardNumber).style.background = "rgb(154,198,242)";
        } else if (CardColor == "black") {
            if (ShowBomb == "on") { //if showBomb is on, then the spymaster can see the bomb
                document.getElementById(CardNumber).style.background = "rgb(94,94,94)";
            } else { //if its off, it will remain hidden!
                document.getElementById(CardNumber).style.background = "#DDD"; //hides bomb if already visible
            }
        }
    }
}

function hideColors() {
    for (let i = 0; i < 25; i++) { //for every card, display 
        let CurrentCard = cards[i] //get card array
        let CardNumber = CurrentCard[0];
        let cardColor = CurrentCard[1]
        if (cardColor.indexOf('Revealed') > -1) {
            //if this is a revealed color, don't change it!
        } else {
            document.getElementById(CardNumber).style.background = "#DDD";
        }

    }
}

//************BASIC GAME FUNCTIONS **************

//displays updated score when called
function displayNewScore() {
    document.getElementById("redscore").innerHTML = redscore;
    document.getElementById("bluescore").innerHTML = bluescore;
}

//clears all colors on board back to default
function resetBoard() {
    for (let i = 0; i < 25; i++) { //for every card, display 
        let CurrentCard = cards[i] //get card array
        let CardNumber = CurrentCard[0];
        document.getElementById(CardNumber).style.background = "#DDD";
    }
}

function displayNewWords() {
    for (let i = 0; i < 25; i++) { //for every card, display 
        document.getElementById(i + 1).innerHTML = wordcards[i]
    }
}

//resets all clients with spymaster toggled, so it would turn off
function resetSpyMaster() { //turns on spymaster mode
    if (document.getElementById("togglespymaster").value == "Spymaster") {
        document.getElementById("togglespymaster").value = "Guesser";
    }
}

//my own function for searching 2d arrays
function indexOf2d(array, element) { //finds index where element is x in array of [x,y]
    for (let i = 0; i < array.length; i++) {
        if (array[i][0] == element) {
            return i;
        }
    }
}

//resets the turns back to red - > this will eventually be randomized
function resetTurns() { //sets it back to red
    document.getElementById("GameHeader").innerHTML = "Red's Turn";
    document.getElementById("GameHeader").style.color = "rgb(217,87,69)";
}

//when someone clicks a card, it sends it to the server for global entry
function changeScoreCard(id) //eventally, i can go per player and say - if current turn != current player's turn, then it wont click
{
    if (document.getElementById("togglespymaster").value == "Spymaster") { //blocks spymaster from playing/chosing cards
        //you cant play as spymaster!
    } else if (currentTurn == "GameOver") {
        //you cant play if the game is over!
    } else {
        socket.emit('changeScoreCard', { //this should automatically change the score card and revealed color server side
            id: id
        });
    }

}

//when someone else clicks a card, this function registers it from server to client and shows the user
function changeScoreCardClient(id, color) {
    if (color == "red") {
        document.getElementById(id).style.background = revealedred;
    } else if (color == "blue") {
        document.getElementById(id).style.background = revealedblue;
    } else if (color == "null") {
        document.getElementById(id).style.background = revealednull;
    } else if (color == "black") {
        document.getElementById(id).style.background = revealedblack;
    }
}

//when the server sends the game over signal, this function is called to notify the user who won
function setWinner(team) {
    if (team == "red") {
        document.getElementById("GameHeader").innerHTML = "Red Wins!";
        document.getElementById("GameHeader").style.color = "rgb(217,87,69)";
        currentTurn = "GameOver"
    } else if (team == "blue") {
        document.getElementById("GameHeader").innerHTML = "Blue Wins!";
        document.getElementById("GameHeader").style.color = "rgb(61,122,210)";
        currentTurn = "GameOver"
    }
    displayColors(); //show remaining colors if any
}

function changeTurns(team) { //changes team to the passed value: team
    // window.alert("chaning teams. input: "+team);

    //restarts timer
    clearInterval(myTimer);
    clock();

    if (team == "red") {
        document.getElementById("GameHeader").innerHTML = "Red's Turn";
        document.getElementById("GameHeader").style.color = "rgb(217,87,69)";
        document.getElementById("Timer").style.color = "rgb(217,87,69)";
        currentTurn = "red";
    } else if (team == "blue") {
        document.getElementById("GameHeader").innerHTML = "Blue's Turn";
        document.getElementById("GameHeader").style.color = "rgb(61,122,210)";
        document.getElementById("Timer").style.color = "rgb(61,122,210)";
        currentTurn = "blue";
    }
    //if timer is active, reset timer!
}

function toggleTimerClient() { //turns on spymaster mode
    if (Timer == "off") {
        //turn timer off
        clearInterval(myTimer);
        //hide timer
        document.getElementById("Timer").style.display = "none";
        //change button value
        document.getElementById("TimerButton").value = "Timer";
        //hide timer slider
        document.getElementById("timerSliderDisplay").style.display = "none"
    } else if (Timer == "on") {
        //turn timer on: start
        clock();
        //show timer
        document.getElementById("Timer").style.display = "block";
        //change button value
        document.getElementById("TimerButton").value = "No Timer";
        //show timer sldier
        document.getElementById("timerSliderDisplay").style.display = "block"
    }
}

function clock() { //clock instance separate but close to server's
    myTimer = setInterval(myClock, 1000);
    var c = TimerSeconds;

    function myClock() {
        document.getElementById("Timer").innerHTML = "[" + --c + "]";
        if (c == 0) {
            clearInterval(myTimer);
            //endTurn(); //end turn will comef rom server
            // alert("Reached zero");
        }
    }
}

function setTimerValueClient(value) { //turns on/off bomb detection for spymaster globally

    //change slider values
    document.getElementById("slidervalue").innerHTML = value //slider text value
    document.getElementById("myRange").value = value //slider position value

    //change timer value
    TimerSeconds = value

    //restart timer
    clearInterval(myTimer);
    clock();
}

//Modal functionalities:
//Modal Stuff:

function openModal(){
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
    document.getElementById("backgroundblur").style.display="block";
}

function closeModal(){
    LoadGame(); //starts game
    var modal = document.getElementById("myModal");
    modal.style.display = "none";
    document.getElementById("backgroundblur").style.display="none";
}


//********************************* */
//SOCKET.IO TRIGGERS AND RECEIVING FUNCTIONS
//********************************* */

//this triggers end turn for everyone


//triggers new game build for everyone
function BuildGame() {
    console.log('starting new game')
    socket.emit('BuildGame', {
        from: "client"
    });
}

function LoadGame() {
    // window.alert("loading game")
    console.log("loading game")
    requestVariables(); //get variables form server

    resetBoard();
    displayNewWords();
    displayNewScore();
    resetSpyMaster();
    resetTurns();
    console.log("game loaded")
    //i may need to get variables from server
}

function OnLoadBuildGame() {

    if (client > 90) {
        //don't load new game
    }
    else if (client == 90) //if you're the first to join, build a game
    {
        console.log('starting new game')
        socket.emit('BuildGame', {
            from: "client"
        });

        location.reload();
        //add refresh here?
    }
}

//TOGGLE BOMB VIEW GLOBALLY
function toggleBomb() { //turns on/off bomb detection for spymaster globally
    socket.emit('toggleBomb', {
        from: "client"
    });

}

//TOGGLE TIMER GLOBALLY
function toggleTimer() {

    console.log('request sent to toggle timer');
    socket.emit('toggleTimer', {
        from: "client"
    });

}

//SET NEW TIMER VALUE GLOBALLY
function setTimerValue(value) {

    console.log('New Timer Value: ' + value);
    socket.emit('setTimerValue', {
        value: value
    });
}


//SEND END TURN REQUEST TO SERVEr
function endTurn() {
    socket.emit('endTurn', {
        from: "client"
    });
}

//REQUEST VARIABLES FROM SERVER [this is client specific only]
function requestVariables() {
    socket.emit('requestVariables', {
        from: "client"
    });
}

//END TURN FUNCTION FROM SERVER:
socket.on('endTurn', function (currentTurn) {
    changeTurns(currentTurn.currentTurn);
    console.log("Current Turn: " + currentTurn.currentTurn)
});

//GET VARIABLES GAME FROM SERVER
socket.on('sendVariables', function (data) {
    redscore = data.redscore;
    bluescore = data.bluescore;
    cards = data.cards;
    availablecards = data.availablecards;
    avaialbleColors = data.avaialbleColors;
    currentTurn = data.currentTurn;
    ShowBomb = data.ShowBomb;
    TimerSeconds = data.TimerSeconds;
    bluecards = data.bluecards;
    redcards = data.redcards;
    blackcards = data.blackcards;
    wordcards = data.wordcards;
    //Timer=data.timer; //if timer is off/on? dont know if i need this or if i desperately do
});

//BUILD NEW GAME -> should only be called after we get new variables from server
socket.on('BuildGame', function () {
    resetBoard();
    displayNewWords();
    displayNewScore();
    resetSpyMaster();
    resetTurns();
    console.log('building new game!')
});

//TOGGLE BOMB FROM SERVER
socket.on('toggleBomb', function (ShowBomb) {
    toggleBombClient(ShowBomb.ShowBomb);
    console.log("Toggle Bomb: " + ShowBomb.ShowBomb);
});

//TOGGLE TIMER FROM SERVER
socket.on('toggleTimer', function (data) {
    Timer = data.value;//passes timer on/off functionality
    toggleTimerClient();
});

//NEW TIMER VALUE FROM SERVER
socket.on('setTimerValue', function (data) {
    TimerSeconds = data.value;
    setTimerValueClient(TimerSeconds);
});

//CHANGE TURNS FROM SERVER
socket.on('changeTurns', function (changeTurn) {
    changeTurns(changeTurn.changeTurn);
    console.log("Changing Turns To: " + changeTurn.changeTurn);
});

//CHANGE SCORE CARD FROM SERVER
socket.on('changeScoreCard', function (data) {
    changeScoreCardClient(data.id, data.color);
});

//GET GAME CHANGED VARIABLES:
socket.on('getGameState', function (data) {
    redscore = data.redscore;
    bluescore = data.bluescore;
    cards = data.cards;
    displayNewScore();
});

//GAME OVER, SET WINNER FROM SERVER
socket.on('gameOver', function (data) {
    setWinner(data.winner);
});

//DISPLAY ALERT FROM SERVER
socket.on('sendAlert', function (data) {
    window.alert(data.message);
});

//keeps track of clients connected from server
socket.on('clientAddition', function () {
    client++;
    console.log("new client. count: " + client)
});


//********************************* */
//NOTES
//bomb mode changes these all to black cards and there's only one available card
//upon entering page, a quick modal of a tutorial and reccomended settings is given!
//on load, generate random colors and name titles

window.addEventListener('load', 
  function() { 
    openModal();
  }, false);
