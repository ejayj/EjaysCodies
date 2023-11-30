//imports
const express = require('express'); // using express
const socketIO = require('socket.io'); //using socketio
const path = require('path'); //used to find our files
const http = require('http') //use to interact w server
const port = process.env.PORT || 8080 // setting the port 
let app = express(); //create app with express
let server = http.createServer(app) //initialize server
let io = socketIO(server) //initialize socketio'
//require('./public/script.js'); //import my js file


//directoryfiles
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
});
server.listen(port);
console.log("server running onport 8080");


/******************* GAME VARIABLES ****************/

var redscore = 9 //how many tiles they get to start
var bluescore = 8 //how many tiles they get to start
var cards = []
var availablecards = [] //keep track of cards already used 
var avaialbleColors = []
var currentTurn = "red"; //to start, red normally goes first
var ShowBomb = "on"; //its on to start
var TimerSeconds = 61; //its 60 seconds to start
var Timer = "off";

//GAME VARIABLES
//how many cards we want of each
var bluecards = 8
var redcards = 9
var blackcards = 1
var myTimer;

//word packs//
var wordcards=[]; //randomized cards array
var packs = ["./codenames.txt","./deep_undercover.txt","./duet.txt"]; //list of available word packs. 0 is codenames default, deep_undercover is 1, duet is 2
var wordpack=[] //current use word pack; codenames by default
var wordPackChoice=0; //the user will choose the word pack on front end, this code change re-runs the build game. (maybe make an alert saying this action will create a new game). default is 0
var fs = require("fs"); //import file sync

//suport variable
var client=0; //starts game build on client connection

//***** GET VARIABLES ****/
app.get("/get/scores", (req, res) => {
    let scores = [{ redscore: redscore }, { bluescore: bluescore }];
    res.json(scores);
});

app.get("/get/currentTurn", (req, res) => {
    let turn = { currentTurn: currentTurn };
    res.json(turn);
});


//Establishes Socket.IO Connection
io.on('connection', function (socket) {
    console.log('New user connected');
    client++;
    if(client==1) { //build game upon first player entry
        BuildGame()
        // /BuildGame()//lets try doing this server side first
        socket.emit('BuildGame', {
        });
    }
    
    
    // client++;

    // //tells everyone how many players there are
    // io.sockets.emit('clientAddition', {
    //     count: client
    // });

    // if(client==1) { //build game upon first player entry
    //     BuildGame()
    //     // /BuildGame()//lets try doing this server side first
    // }

    //Whenever someone disconnects
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });


    //END TURN
    socket.on('endTurn', function () {

        //logic for ending turn
        if (currentTurn == "red") { //if its red's turn, skips to blue
            currentTurn = "blue";
        } else if (currentTurn == "blue") { //if its blue's turn, it skips to red
            currentTurn = "red";
        }

        //sends new turn to clients
        io.sockets.emit('endTurn', {
            currentTurn: currentTurn
        });
    });

    //BUILD NEW GAME
    socket.on('BuildGame', function () {

        //logic for Building Game
        BuildGame();

    });

    //SEND VARIABLES TO CLIENT REQUEST
    socket.on('requestVariables', function () {
        socket.emit('sendVariables', {
            redscore: redscore,
            bluescore: bluescore,
            cards: cards,
            availablecards: availablecards,
            avaialbleColors: avaialbleColors,
            currentTurn: currentTurn,
            ShowBomb: ShowBomb,
            TimerSeconds: TimerSeconds,
            bluecards: bluecards,
            redcards: redcards,
            blackcards: blackcards,
            wordcards:wordcards
        });
    });

    socket.on('setTimerValue', function (data) {
        setTimerValue(data.value);
    });

    //TOGGLE BOMB FUNCTION
    socket.on('toggleBomb', function () {
        if (ShowBomb == "on") {
            ShowBomb = "off";
        }
        else if (ShowBomb == "off") {
            ShowBomb = "on"
        }

        io.sockets.emit('toggleBomb', {
            ShowBomb: ShowBomb
        });

    });

    //CHANGE TURNS
    socket.on('changeTurns', function () {
        changeTurns();
    });

    //REGISTER SCORE CARD CHANGE
    socket.on('changeScoreCard', function (data) {
        let id = data.id;
        changeScoreCard(id);

    });

    //Toggle Timer
    socket.on('toggleTimer', function () {
        toggleTimer();
    });

    //Set Timer Value
    socket.on('setTimerValue', function (data) {
        setTimerValue(data.value);
    });
});


//*************** GAME FUNCTIONS **************/
function BuildGame() {
    resetCardsArray(); //blank slate
    buildBoard(); //assign random colors to the cards
    resetScore(); //reset scores to start
    resetTurns(); //sets turn back to 

    sendVariables(); //sends all the new game variables

    //the below is done on client side, triggered by this emit command
    //resetBoard();
    //resetSpyMaster();
    io.sockets.emit('BuildGame', {
        from: "server"
    });


}

//send current game variables
function sendVariables() {
    io.sockets.emit('sendVariables', {
        redscore: redscore,
        bluescore: bluescore,
        cards: cards,
        availablecards: availablecards,
        avaialbleColors: avaialbleColors,
        currentTurn: currentTurn,
        ShowBomb: ShowBomb,
        TimerSeconds: TimerSeconds,
        bluecards: bluecards,
        redcards: redcards,
        blackcards: blackcards,
        wordcards:wordcards
    });
}

function chooseWordPack() {
    //choose one of the three packs, set it to current pack: wordpack var
    var text = fs.readFileSync(packs[wordPackChoice]).toString('utf-8');
    wordpack = text.split("\n") //split text by line
}

function resetCardsArray() { //should be [1,"null"],[2,"null"],[3,"null"], etc
    cards = []; //reset to blank array
    availablecards = []; //reset to blank array
    avaialbleColors = [];
    wordcards=[] //blank wordcards
    for (let i = 1; i < 26; i++) //we dont have a card 0
    {
        cards.push([i, "null"])
        availablecards.push(i)
    }

    //available colors:

    //add blue cards 
    for (let i = 0; i < bluecards; i++) {
        avaialbleColors.push("blue")
    }

    //add red cards 
    for (let i = 0; i < redcards; i++) {
        avaialbleColors.push("red")
    }

    //add black cards 
    for (let i = 0; i < blackcards; i++) {
        avaialbleColors.push("black")
    }

}

function buildBoard() { //assigns cards random colors 

    //9 red+8 blue+1 black=18 total colored cards,
    for (let i = 0; i < 18; i++) {
        //choose random card
        let cardnumberIndex = Math.floor(Math.random() * availablecards.length); //0-24, get index
        let cardnumber = availablecards[cardnumberIndex] //get card number
        availablecards.splice(cardnumberIndex, 1); //remove card from avaialble card numbers

        //choose random color
        let colorIndex = Math.floor(Math.random() * avaialbleColors.length); //0-18, get index
        let color = avaialbleColors[colorIndex] //get color
        avaialbleColors.splice(colorIndex, 1); //remove color from avaialble card numbers

        //match card to color, put them together
        let cardsIndex = indexOf2d(cards, cardnumber)
        cards.splice(cardsIndex, 1, [cardnumber, color]); //add color to the card number
    }

    //choosing words
    chooseWordPack() 
    randomizeWords();
    // window.alert("done!")
    console.log(cards)
}

function randomizeWords() {
    for (let i = 0; i < 25; i++) //we dont have a card 0
    {
        //randomize word cards 
        //get index of random word index
        let randomIndex = Math.floor(Math.random() * wordpack.length);

        //get random word from wordpack
        let randomWord = wordpack[randomIndex] //get card number

        //remove word from available words in wordpack
        wordpack.splice(randomIndex, 1); 

        //set random word to board
        wordcards[i]=randomWord; // old: //wordcards[i]=[i+1,randomWord];// i dont need to specify the number anymore.
    }
    console.log(""+wordcards)
}

function resetScore() { //randomize which one gets 9 to randomize which team goes first
    redscore = 9;
    bluescore = 8;
}

function resetTurns() { //sets it back to red; this hsould be randomized as above
    currentTurn = "red";
}

function changeTurns() {

    if (currentTurn == "red") {
        currentTurn = "blue";
    } else if (currentTurn == "blue") {
        currentTurn = "red";
    }

    io.sockets.emit('changeTurns', {
        changeTurn: currentTurn
    });
}

function changeScoreCard(id) //eventally, i can go per player and say - if current turn != current player's turn, then it wont click
{
    let cardIndex = indexOf2d(cards, id);
    let cardColor = cards[cardIndex][1];


    if (cardColor == "red") {
        cards[cardIndex][1] = "redRevealed";
        redscore = redscore - 1;// first to 0 winds


        //send change to everyone
        io.sockets.emit('changeScoreCard', {
            id: id,
            color: "red"
        });

        if (currentTurn == "blue") { //if blue chose a red card, it's red's turn. otherwise, it stays red's turn
            changeTurns();
        }
    }
    else if (cardColor == "blue") {
        cards[cardIndex][1] = "blueRevealed";
        bluescore = bluescore - 1;

        //send change to everyone
        io.sockets.emit('changeScoreCard', {
            id: id,
            color: "blue"
        });

        if (currentTurn == "red") { //if red chose a blue card, it's blue's turn. otherwise, it stays red's turn
            changeTurns();
        }
    }
    else if (cardColor == "null") {
        cards[cardIndex][1] = "nullRevealed";

        //send change to everyone
        io.sockets.emit('changeScoreCard', {
            id: id,
            color: "null"
        });

        changeTurns();
    } else if (cardColor == "black") {
        //get current turn, they lose, other team wins
        //BOOOM daud shows up, you loose, you hit the bomb!
        cards[cardIndex][1] = "blackRevealed";

        //send change to everyone
        io.sockets.emit('changeScoreCard', {
            id: id,
            color: "black"
        });
    }

    if (cardColor == "black") {
        detonateBomb(currentTurn); //if they detonated the bomb, then the game is over!
    } else {
        //check if someones winner!
        checkScore()

        //push the new score and cards array
        pushGameState();
    }

}

function pushGameState() {
    io.sockets.emit('getGameState', {
        redscore: redscore,
        bluescore: bluescore,
        cards: cards
    });
}

function checkScore() {
    if (bluescore == 0) {
        //window.alert("Blue Wins!")
        setWinner("blue");
    } else if (redscore == 0) {
        //window.alert("Red Wins!")
        setWinner("red")
    }
}
function detonateBomb(team) { //if a team detonated bomb, the other team wins
    if (team == "red") {
        setWinner("blue");
        sendAlert("Red team detonated the bomb! Blue team wins!")
    } else if (team == "blue") {
        setWinner("red");
        sendAlert("Blue team detonated the bomb! Red team wins!")
    }
}

function setWinner(team) {
    pushGameState();
    if (team == "red") {
        currentTurn = "GameOver"
        //send game over message
        io.sockets.emit('gameOver', {
            winner: "red",
            currentTurn: "GameOver"
        });
    } else if (team == "blue") {
        currentTurn = "GameOver"
        //send game over message
        io.sockets.emit('gameOver', {
            winner: "blue",
            currentTurn: "GameOver"
        });
    }

    if(Timer=="on"){
        toggleTimer();
    }
}

function toggleTimer() {
    if (Timer == "on") {
        Timer = "off";
        clearInterval(myTimer);
    } else if (Timer == "off") {
        Timer = "on";
        clock();
    }

    io.sockets.emit('toggleTimer', {
        value: Timer
    });
}

function sendAlert(message) {
    io.sockets.emit('sendAlert', {
        message: message
    });
}

function setTimerValue(value) {

    //Change TimerSeconds Value
    TimerSeconds=value;

    //Send Change To Clients
    io.sockets.emit('setTimerValue', {
        value: TimerSeconds
    });

    //restart Timer [clients to this automatically as well]
    clearInterval(myTimer);
    clock();
}

//************* SUPPORT FUNCTIONS *********** */
function indexOf2d(array, element) { //finds index where element is x in array of [x,y]
    for (let i = 0; i < array.length; i++) {
        if (array[i][0] == element) {
            return i;
        }
    }
}

function clock() { //clock instance separate from client
    myTimer = setInterval(myClock, 1000);
    var c = TimerSeconds;

    function myClock() {
        if (c == 0) {
            clearInterval(myTimer);
            changeTurns();
            sendAlert("Time's Up! It's now " + currentTurn + " Team's turn!")
            // alert("Reached zero");
        }
    }
}

//****************** Game Notes ******************/
//next: optimize for phone, and chose word packs
//maybe even allow people to pick their name and do teams?

// minor stuff:
//new styles and tickmark for timer
//a chat window?

//OTHER NOTES:
// <!-- the end turn button should simply display red turn, or blue turn//should i add logic for keeping track of team names? YES; modal: enter nickname. it should remember who you are; auto assign to teams, randomize teams, allow nickname change, and if you disconnect it removes you from the team-->

// //timer on, 60 secs default, starts timer for you
// allow a text box to enter in names and scramble teams
// light mode/dark mode

// <!-- stylings-->
// <!-- spymaster slider buttons, i would've liked to do this but i have to start doing school work now :( to see the stylings, see notes-->
// <!-- show bomb/hide bomb only effects spymaster-->
// <!-- timer button stylung-->

// <!-- side note, the game switches who starts-->
