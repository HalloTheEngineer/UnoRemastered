let tag1 = "";
let tag2 = "";
let cardCount = 7;
let gameHandler;
let cardHandler;
let turnHandler;
let colorHandler;
let allCards = [];
let currentPlayer;
let shownCard;
let forcedColorCache;
let forcedColor;
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

    colorHandler = new ColorHandler();
    turnHandler = new TurnHandler();
    turnHandler.init();
    cardHandler = new CardHandler();
    gameHandler = new GameHandler();
    gameHandler.startGame();
}

//JQuery - Events
$(document).ready(() => {
    $("#deck1").on({
        click: () => {
            new bootstrap.Offcanvas("#offT").show();
        },
        dragover: (event) => {
            event.preventDefault();
            event.stopPropagation();
        },
        dragenter: (event) => {
            event.preventDefault();
            event.stopPropagation();
        },
        drop: (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (currentPlayer === 1) {
                cardHandler.drawCard(1);
                turnHandler.next();
            }
        }
    })
    $("#deck2").on({
        click: () => {
            new bootstrap.Offcanvas("#offB").show();
        },
        dragover: (event) => {
            event.preventDefault();
            event.stopPropagation();
        },
        dragenter: (event) => {
            event.preventDefault();
            event.stopPropagation();
        },
        drop: (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (currentPlayer === 2) {
                cardHandler.drawCard(2);
                turnHandler.next();
            }
        }
    })
    $("#chooseRed").on("click", () => {
        colorHandler.handleButton(Card.redColor);
    })
    $("#chooseYellow").on("click", () => {
        colorHandler.handleButton(Card.yellowColor);
    })
    $("#chooseGreen").on("click", () => {
        colorHandler.handleButton(Card.greenColor);
    })
    $("#chooseBlue").on("click", () => {
        colorHandler.handleButton(Card.blueColor);
    })

})

//Classes
class GameHandler {
    constructor() {
    }
    startGame() {
        cardHandler.collectCards();
        cardHandler.distributeCards();
        cardHandler.chooseStarterCard();

        $("#offTTitle").html(`Player: ${tag1}`);
        $("#offBTitle").html(`Player: ${tag2}`);

        $("#startingPlayer").html(`<strong>${turnHandler.getPlayerTag(currentPlayer)}</strong> is going to start!`)
        new bootstrap.Modal("#startingInfo").show();
    }
}
class CardHandler {
    constructor() {
    }
    collectCards() {
        for (let i = 0; i < 14; i++) {
            for (let j = 0; j < 8; j++) {
                allCards.push(new Card(i, j));
            }
        }
        allCards.splice(4, 4);
    }
    distributeCards() {
        for (let i = 0; i < cardCount; i++) {
            moveItem(allCards, cardsPlayerOne, allCards[Math.floor(Math.random() * allCards.length)]);
            moveItem(allCards, cardsPlayerTwo, allCards[Math.floor(Math.random() * allCards.length)]);
        }
        cardsPlayerOne.forEach(value => this.addCardToPlayerDeck(value, value.uuid, 1));
        cardsPlayerTwo.forEach(value => this.addCardToPlayerDeck(value, value.uuid, 2));
    }
    addCardToPlayerDeck(card, uuid, player) {
        const html = `<li><div class='gallery-entry-pl2' id=${uuid} style='background-image: url("assets/uno_spritesheet.png"); background-position: -${card.x}px -${card.y}px'></div></li>`
        if (player === 1) {
            $("#deck1Cards").append(html);
            $(`#${uuid}`).on("click", ev => this.handleCardPick(ev, player));
        } else if (player === 2) {
            $("#deck2Cards").append(html);
            $(`#${uuid}`).on("click", ev => this.handleCardPick(ev, player));
        }
    }
    chooseStarterCard() {
        let card = allCards[Math.floor(Math.random() * allCards.length)];
        while (card.getType() !== "regular") {
            card = allCards[Math.floor(Math.random() * allCards.length)];
        }
        shownCard = card;
        $("#gameStack").css("background-position", "-"+card.x+"px -" + card.y + "px");
    }
    updateShownCard(card) {
        $("#gameStack").css("background-position", `-${card.x}px -${card.y}px`);
        shownCard = card;
    }
    drawCard(player) {
        let card = allCards[Math.floor(Math.random() * allCards.length)];
        if (player === 1) {
            moveItem(allCards, cardsPlayerOne, card);
            this.addCardToPlayerDeck(card, card.uuid, player);
        } else if (player === 2) {
            moveItem(allCards, cardsPlayerTwo, card);
            this.addCardToPlayerDeck(card, card.uuid, player);
        }
    }
    async handleCardPick(event, player) {
        let card;

        if (player !== currentPlayer) return;

        if (player === 1) card = cardsPlayerOne.filter(value => value.uuid === event.target.id)[0];
        else if (player === 2) card = cardsPlayerTwo.filter(value => value.uuid === event.target.id)[0];

        if (card.getType() === "special" || card.getType() === "drawFour") {
            new bootstrap.Modal("#colorPicker").show();
            await colorHandler.awaitColorPick().then(value => {
                forcedColor = value
                console.log(value)
            });
        }

        if (!this.validateAction(card, player, forcedColor)) return;

        this.updateShownCard(card);
        $(`#${card.uuid}`).parent().remove();
    }
    validateAction(card, player, forcedColor) {
        switch (shownCard.getType()) {
            case "regular":
                if ((!card.hasColor() || shownCard.getColor() === card.getColor()) || (shownCard.getNumber() === card.getNumber())) {
                    turnHandler.next();
                    return true;
                } else return false;
            case "skip":
                if (shownCard.getColor() === card.getColor() || !card.hasColor()) return true;
                break;
            case "mirror":
                if (shownCard.getColor() === card.getColor() || !card.hasColor()) return true;
                break;
            case "drawTwo":
                if (shownCard.getType() !== "drawTwo" || shownCard.getColor() !== card.getColor()) {
                    for (let i = 0; i < 2; i++) {
                        this.drawCard(turnHandler.getNextPlayer(player))
                    }
                    turnHandler.next();
                    return true;
                } else return false;
            case "drawFour":
                if (forcedColor !== undefined && card.getColor() === forcedColor) {
                    for (let i = 0; i < 4; i++) {
                        this.drawCard(turnHandler.getNextPlayer(player));
                        console.log("add")
                    }
                    turnHandler.next();
                    return true;
                } else return false;
            case "special":
                if (card.getColor() === forcedColor) {
                    turnHandler.next();
                    return true;
                } else return false;
        }
    }
}
class ColorHandler {
    handleButton(color) {
        forcedColorCache = color;
    }
    awaitColorPick() {
        return new Promise(resolve => {
            setInterval(()=>{
                if (forcedColorCache != null) {
                    resolve(forcedColorCache);
                    forcedColorCache = null;
                }
            }, 50); //20 TPS
        })
    }
}
class TurnHandler {
    static player1 = 1;
    static player2 = 2;
    randomPlayer() {
        if (Math.random() >= 0.5) return TurnHandler.player1;
        else return TurnHandler.player2;
    }
    init() {
        currentPlayer = this.randomPlayer();
        this.updateBorder();
    }
    next() {
        currentPlayer = this.getNextPlayer(currentPlayer);
        this.updateBorder();
    }
    getPlayerTag(player) {
        if (player === 1) return tag1;
        else if (player === 2) return tag2;
    }
    getNextPlayer(player) {
        if (player === 1) return 2;
        else if (player === 2) return 1;
    }
    updateBorder() {
        if (currentPlayer === 1) {
            $("#deck1").css("border-color", "slategray");
            $("#deck2").css("border-color", "transparent");
        } else if (currentPlayer === 2) {
            $("#deck1").css("border-color", "transparent");
            $("#deck2").css("border-color", "slategray");
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
        this.uuid = generateUUID();
        this.column = indexX;
        this.row = indexY;
        this.x = indexX * 137;
        this.y = indexY * 206;
        this.type = this.getType();
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
    hasColor() {
        return this.getColor() != null;
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
function generateUUID() {
    return crypto.randomUUID();
}
