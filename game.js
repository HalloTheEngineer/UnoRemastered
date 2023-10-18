let tag1 = "";
let tag2 = "";
let cardCount = 7;
let gameHandler;
let cardHandler;
let allCards = [];
let currentPlayer;
let shownCard;
let cardsPlayerOne = [];
let cardsPlayerTwo = [];

window.onload = () => {
    const params = new URLSearchParams(document.location.search);
    if (params.has("tag1") && params.has("tag2") && params.has("cardcount") && isValidUsername(params.get("tag1")) && isValidUsername(params.get("tag2")) && params.get("tag1") !== params.get("tag2") && isNumeric(params.get("cardcount"))) {
        tag1 = params.get("tag1");
        tag2 = params.get("tag2");
        cardCount = params.get("cardcount");
    } else {
        window.location.href = "config.html?rejected=true"
    }

    $("#loader").fadeOut("center");

    cardHandler = new CardHandler();
    gameHandler = new GameHandler();
    gameHandler.startGame();
}

//JQuery - Events
$(document).ready(() => {
    $("#deck1").on("click", () => {
        new bootstrap.Offcanvas("#offcanvasTop").show();
    })
    $("#deck2").on("click", () => {
        new bootstrap.Offcanvas("#offcanvasBottom").show();
    })
})

//Classes
class GameHandler {
    constructor() {
    }
    startGame() {
        cardHandler.collectCards();
        cardHandler.distributeCards();
        console.log(cardsPlayerOne, cardsPlayerTwo)
        console.log(allCards)
    }
}
class CardHandler {
    constructor() {
    }
    distributeCards() {
        for (let i = 0; i < cardCount; i++) {
            moveItem(allCards, cardsPlayerOne, allCards[Math.floor(Math.random() * allCards.length)]);
            moveItem(allCards, cardsPlayerTwo, allCards[Math.floor(Math.random() * allCards.length)]);
        }
    }
    updateShownCard() {
        //$("#gameStack").style.top = "-"+shownCard.
    }
    collectCards() {
        for (let i = 0; i < 14; i++) {
            for (let j = 0; j < 8; j++) {
                allCards.push(new Card(i, j))
            }
        }
        allCards.splice(4, 4)
        console.log(allCards)
    }
    chooseStarterCard() {

    }
    drawCard(player) {
        if (player === 1) {
            moveItem(allCards, cardsPlayerOne, allCards[Math.floor(Math.random() * allCards.length)]);
        } else if (player === 2) {
            moveItem(allCards, cardsPlayerTwo, allCards[Math.floor(Math.random() * allCards.length)]);
        }
    }

}
class Card {
    static regularCard = "regular";
    static skipCard = "skip";
    static mirrorCard = "mirror";
    static drawTwoCard = "drawTwo";
    static drawFourCard = "drawFour";
    static specialCard = "special";

    static redColor = "red";
    static yellowColor = "yellow";
    static greenColor = "green";
    static blueColor = "blue";
    constructor(indexX, indexY) {
        this.column = indexX;
        this.row = indexY;
        this.x = indexX * 137;
        this.y = indexY * 206;
        this.width = 137;
        this.height = 206;
    }
    getType() {
        switch (this.column) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                return Card.regularCard;
            case 10:
                return Card.skipCard;
            case 11:
                return Card.mirrorCard;
            case 12:
                return Card.drawTwoCard;
            case 13:
                if (this.row < 5) return Card.specialCard;
                else return Card.drawFourCard;

        }
    }
    getColor() {
        if (this.column < 13) {
            switch (this.row) {
                case 0:
                case 4:
                    return Card.redColor;
                case 1:
                case 5:
                    return Card.yellowColor;
                case 2:
                case 6:
                    return Card.greenColor;
                case 3:
                case 7:
                    return Card.blueColor;
            }
        } else return null;

    }
    getNumber() {
        if (this.column < 10) {
            return this.column;
        } else return null;
    }
}
//Helper functions
function isValidUsername(str) {
    return /^[a-zA-Z0-9]+([a-zA-Z0-9]([_\- ])[a-zA-Z0-9])*[a-zA-Z0-9]+$/.test(str)
}

function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) &&
        !isNaN(parseFloat(str))
}
function moveItem(source, target, item) {
    source.splice(allCards.indexOf(item), 1);
    target.push(item);
}
