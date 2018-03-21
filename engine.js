/*-----------------------------------------------------------------------------------------
Some necessary evil here, namely globals. Since i'm not using anykind of datastorage file, 
like a data.txt to store game states, this will have to do for a noobie like me.
-----------------------------------------------------------------------------------------*/
let playerHand;
let dealerHand;
let carddeck;
let currentRound;
/*----------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------------
This is the hearth of the application, the Card class. Since we're going to have many cards
in play I decided to represent cards as a class. The suite() value is not actually used
for anything, but it was helpfull for debugging&figuring out how to build this app
in the early development cycle. The Card Class also has a method for specifying the exact cordinates
for each card on the cards spritesheet. Which is usefull for later rendering that card.
-----------------------------------------------------------------------------------------*/
class Card {
    constructor(suite,number) {
        this._suite = suite;
        this._number = number;
    }
    get suite() {
        return this._suite;
    }
    get number() {
        return this._number;
    }
    get value() {
        return this._number > 10 ? 10 : this._number;
    }
    get xSprite() {
        return (this._number-1)*100;
    }
    get ySprite() {
        switch(this._suite) {
            case "Clubs": return 0 
            break;
            case "Diamonds": return 150
            break;
            case "Hearts": return 300
            break;
            default: return 450
            break;
        }
        
    }
}
/*----------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------------
In turn, each of the 52 cards, which are occurenses of the Card class, will be stored in an
Array(deck). I chose to make this game with only one deck. 
-----------------------------------------------------------------------------------------*/
function createDeck(deck){
    for (let i=1; i < 53; i++) {
        if (i < 14) {
            deck.push(new Card("Clubs", i));
        } else if (i>13 && i<27) {
            deck.push(new Card("Diamonds", i-13));
        } else if (i>26 && i< 40) {
            deck.push(new Card("Hearts", i-26));
        } else {
            deck.push(new Card("Spades", i-39));
        }
    }
    return deck;
}
/*----------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------------
This is the first function called after document has loaded. Something the jquery tutorials
were adamant on implementing. :)  

#############################THE FUNCTION CHAIN LOOP############################################
restart() --eventhandler--> resetInterface() --> playersTurn() --eventhandler--> dealersTurn()--
--> whoWon() --> restart()
################################################################################################
Each function in turn, has some support functions to does not return or break the chain, but
are used for rendering stuff to the screen, or evaluating card calues etc.
-----------------------------------------------------------------------------------------*/
function restart() {
    $(".cardArea").empty();
    $("#rules").fadeIn(2000)
    playerHand = [];
    dealerHand = [];
    currentRound = initialize();
    $("#console").text("Press play to start!");
    $("#play").on("click", resetInterface);
}

/*--------------------------------called by: restart()-------------------------------------
Starting by making a new emptyGameState, this function is also called upon when starting new
rounds. I chose to use an object, instead of variables, for easier calling.
-----------------------------------------------------------------------------------------*/
function initialize(){
    let emptyGameState = {
        dealerName: ".dealer",
        playerName: ".player",
        deckList: createDeck(new Array),
        cardsDrawn: []
    }
    return emptyGameState;
}
/*----------------------------------------------------------------------------------------*/


/*----------------------------called by: restart()----------------------------------------
After user has clicked play, this function is called upon, which will clear any elements
not to be shown during the round. to be implemented: test if remove() is unnessecary, and
used only hide() show() instead.
-----------------------------------------------------------------------------------------*/
function resetInterface(reset){
    clearConsole();
    if(reset) {
        $("#play").remove();
        $("#rules").hide();
        dealStart();
        setTimeout(function(){
            $('<button id="hit">Hit</div>').appendTo(".interface");
            $('<button id="stand">Stand</div>').appendTo(".interface");
            $("#hit").on();
            $("#stand").on();
            updateConsole();
            playersTurn();
        }, 1200);

    } else {
        $("#hit").remove();
        $("#stand").remove();
        $('<button id="play">Play</div>').appendTo(".interface");
    }
    
}
/*--------------------------------------------------------------------------------------*/

/*---------------------------------called by: resetInterface()--------------------------
Reset interface will in return call upon this function, which deals the beginning hand. I
choose to use setTimeout function, which I found on the jquert documentation site, for 
added effect, to create a illusion of something animating. Next step would be to have the 
cards fly from a specifi order, by altering their offset position, could probably be done
with a foor loop, that would be done in the render card section tho.
-----------------------------------------------------------------------------------------*/
function dealStart() {
    setTimeout(function(){playerDraw()}, 300);
    setTimeout(function(){dealerDraw()}, 600);
    setTimeout(function(){playerDraw()}, 900);
    setTimeout(function(){
        let toBeRendered = '<div class="card wrongside" style="background: url(carddeck.jpg) -'+200+'px -'+600+'px;"></div>';
        $(toBeRendered).appendTo(".dealer");
    }, 1200);
}
/*----------------------------------------------------------------------------------------*/

/*--------------------------called by: resetInterface()------------------------------------
After dealStart() has executed, resetInterface() calls on this function, which includes two
even listeners for the hit and stand buttons. I had some initial trouble with not being able
to break out of the event listeners. Also had/might still have some overflow problems if
the user manages to spam the buttons, my conditionals inside the event listers was added
to try to prevent it. This is not pretty, and I should most likely refactor some of this 
function code.
-----------------------------------------------------------------------------------------*/
function playersTurn() {

    $("#hit").on("click", function(){
        if (evaluateHand(playerHand) > 21) {
            bust();
        } else if(evaluateHand(playerHand) < 21) {
            playerDraw();
            updateConsole();
            if (evaluateHand(playerHand) > 21) {
                bust();
            }
        }
    })  
    $("#stand").on("click", function(){
        $("#hit").off();
        $("#stand").off();
        $(".wrongside").remove();
        dealersTurn();
    })
}
/*----------------------------------------------------------------------------------------*/

/*--------------------------called by: playersTurn()----------------------------------
After user clicks stand, this function is called upon, which is a recursive function making
the dealer draw until it has a card hand value of 17 or more. Again, timeout used for making
the game feel more realistic.
-----------------------------------------------------------------------------------------*/
function dealersTurn(){
    if (evaluateHand(dealerHand) < 17){
        $("#console").text("...dealer drawing!");
        setTimeout(function(){dealerDraw()}, 600);
        setTimeout(function(){updateConsole()}, 600);
        setTimeout(function(){dealersTurn()}, 2000); 
    } else if (evaluateHand(dealerHand) > 21){
        $("#console").text("Dealer Busts, You win!");
        setTimeout(function(){
            resetInterface(false);
            restart();
        }, 2000); 
    } else {
        whoWon();
    }
}
/*----------------------------------------------------------------------------------------*/


/*--------------------------called by: dealersTurn()----------------------------------
This is where the blackjack rules are written, i decided to go with a long if conditional.
After evaluation, it waits 2 seconds, then restarts the game chain loop.
-----------------------------------------------------------------------------------------*/
function whoWon(){
    if(evaluateHand(playerHand) === 21 && playerHand.length === 2) {
        if (dealerHand.length === 2 && evaluateHand(dealerHand) === 21) {
            //Both has blackjack, game is even
            $("#console").text("Both has blackjack, game is even");
        } else {
            //BlackJack! You win!
            $("#console").text("BlackJack! You win!");
        }
    } else if(dealerHand.length === 2 && evaluateHand(dealerHand) === 21) {
        //Dealer wins with blackjack
        $("#console").text("Dealer wins with blackjack");
    } else if(evaluateHand(playerHand) === evaluateHand(dealerHand)) {
        //Game is even
        $("#console").text("Game is even");
    } else if(evaluateHand(playerHand) > evaluateHand(dealerHand)) {
        //You Win!
        $("#console").text("You Win!");
    } else {
        //Dealer wins
        $("#console").text("Dealer wins");
    }
    setTimeout(function(){
        resetInterface(false);
        restart();
    }, 2000); 

}

/*----------called by: playersTurn(), dealersTurn(), whoWon()------------------------------
when called upon, it returns  the total value of the hand in question using a foor loop. 
Perhaps the interesting part here was to get the Ace 1 or 11 value right. So all aces, 
are logged with a value of 11, BUT,  if the hand value excedes 21, it'll first change the 
value of the ace to 1. Notice the numberOfAces variable, it'll make it possible to change 
multiple aces values to 1.
-----------------------------------------------------------------------------------------*/
function evaluateHand(cardHand){
    let handValue = 0;
    let hasAce = false;
    let numberOfAces = 0;
    if (cardHand.length === 0) {
        return 0;
    }
    for(let i = 0; i < cardHand.length; i++){
        if(cardHand[i].value === 1){
            handValue += 11;
            numberOfAces++;
        } else {
            handValue += cardHand[i].value;
        }
        if(handValue > 21 && numberOfAces > 0) {
            handValue -= 10;
            numberOfAces--;
        } 
    }
    return handValue;
}
/*----------------------------------------------------------------------------------------*/

/*----------called by: playersTurn()------------------------------------------------------
I implemented this function intially, before writing the whoWin() function, and this is
still called from the playersTurn. Might refactor this one out in future.
-----------------------------------------------------------------------------------------*/
function bust() {
    $("#console").text("Bust! You loose...");
    $("#hit").off();
    $("#stand").off();
    setTimeout(function(){
        resetInterface(false);
        restart();
    }, 2000); 
}
/*----------------------------------------------------------------------------------------*/

/*----------called by: playersTurn(), dealerDraw()-----------------------------------------
Together with drawRandom, theese are one of the first lines of codes I wrote, and should
be refactored at some point. At the time of writing I didn't use any global variables.
However, they work well enough atm. Theese functions are responsive for generating a random
number between 0-51, then picking the that element from the card array. It also saves which
numbers have been picked, so only Unique cards are played. It also populates our player and 
dealer hand array. Which are used for calculating current hand values, winning conditions etc.
-----------------------------------------------------------------------------------------*/
function playerDraw() {
    drawRandom(currentRound.deckList, currentRound.cardsDrawn, currentRound.playerName);
}

function dealerDraw() {
    drawRandom(currentRound.deckList, currentRound.cardsDrawn, currentRound.dealerName);
}

function drawRandom(deckList,cardsDrawn,drawWhere){
    randomNumber = Math.floor(Math.random() * Math.floor(52)); //returns random number between 0 - 51. Should be uniform, but might be predictable. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    if(cardsDrawn.includes(randomNumber)) {
        console.log(deckList[randomNumber].number + " of " + deckList[randomNumber].suite + " has already been drawn.");
        drawRandom(deckList, cardsDrawn, drawWhere);
    } else {
        console.log(deckList[randomNumber].number + " of " + deckList[randomNumber].suite + " was drawn!");
        renderCard(deckList[randomNumber], drawWhere);
        cardsDrawn.push(randomNumber);
        if (drawWhere === ".player") {
            playerHand.push(deckList[randomNumber]);
        } else {
            dealerHand.push(deckList[randomNumber]);
        }
    }
    
}
/*----------------------------------------------------------------------------------------*/


/*----------called by: drawRandom--------------------------------------------------------
After draw random has drawn a valid card, it is rendered to the screen. I had to google
for a while on spritesheets, on how to actually pick a small portion of a picture and
rendering it. I didn't find any easy ways to crop pictures, this solution renders each card
as the whole picture, starting from a given cordinate, but since the css element is restricted
to a certain size, it only shows the portion we want. I used GIMP to modify my spritesheet
to fit the proportion desired.
-----------------------------------------------------------------------------------------*/
function renderCard(Card, drawWhere) {
    let toBeRendered = '<div class="card" style="background: url(carddeck.jpg) -'+Card.xSprite+'px -'+Card.ySprite+'px;"></div>';
    $(toBeRendered).appendTo(drawWhere);
    $(".card").on("mouseenter", function(){
        $(this).animate({"z-index":"10", "top":"-20px"}, 100);
    });
    $(".card").on("mouseleave", function(){
        $(this).animate({"z-index":"1", "top":"0px"}, 100);
    });
}
/*----------------------------------------------------------------------------------------*/

/*----------called by: almost all functions-------------------------------------------------
The main function for keeping the text flowing above the cards.
-----------------------------------------------------------------------------------------*/
function updateConsole() {
    $("#console").hide();
    $("#console").text("You got " + evaluateHand(playerHand) + ", dealer has " + evaluateHand(dealerHand));
    $("#console").fadeIn(1000);
}

function clearConsole() {
    $("#console").text("");
}
/*----------------------------------------------------------------------------------------*/



/*---------------------------------------------------------------------------------------
...JQuert tutorial said this is a must. :) I did try what happens if I don't implement this
in the start, and the first round got buggy sometimes. This is the first function, starts
the game chail loop.
-----------------------------------------------------------------------------------------*/
$(document).ready(function readysetgo(){
    carddeck = document.createElement("img");
    carddeck.src = "carddeck.jpg";
    restart();
});
/*----------------------------------------------------------------------------------------*/