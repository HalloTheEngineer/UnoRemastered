/*
WICHTIG: Für die Funktionalität des Leaderboards muss die Website auf einem Server gehostet werden,
da der lokale Speicher hier für alle auf dem Server geöffneten Seiten gilt.
Das Spielen ist auch ohne Server und somit ohne Leaderboard möglich.

Aufbau des Codes:
    1. Variablen
    2. Startvorbereitungen
    3. JQuery Events
    4. Classes und Logik
    5. Utility Funktionen
 */

//Parameters
let tag1 = "";
let tag2 = "";
let cardCount = 7;
//Handler Classes
let gameHandler;
let cardHandler;
let turnHandler;
let colorHandler;
//Values
let currentPlayer;
let shownCard;
let forcedColorCache;
let forcedColor;
//Arrays
let allCards = [];
let cardsPlayerOne = [];
let cardsPlayerTwo = [];
let currentLeaderboard = [];
//Style
let deckPlayer1;
let deckPlayer2;
//HardCoded Features
let memeMode = false;
//TODO: Winning/Loosing animation w/ forfeit impl; config gui > Stacking, meme mode, etc.;

window.onload = () => {
    const params = new URLSearchParams(document.location.search);
    if (params.has("tag1") && params.has("tag2") && params.has("cardcount") && isValidUsername(params.get("tag1")) && isValidUsername(params.get("tag2")) && params.get("tag1") !== params.get("tag2") && isNumeric(params.get("cardcount"))) {
        tag1 = params.get("tag1");
        tag2 = params.get("tag2");
        cardCount = params.get("cardcount");
    } else {
        window.location.href = "config.html?rejected=true";
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
    //deck registration
    deckPlayer1 = new bootstrap.Offcanvas("#offT");
    deckPlayer2 = new bootstrap.Offcanvas("#offB");
    //deck player 1 - card drawing, showing the deck
    $("#deck1").on({
        click: () => {
            deckPlayer1.show();
        },
        dragstart: (event) => {
            event.preventDefault();
            event.stopPropagation();
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
    });
    //deck player 2 - card drawing, showing the deck
    $("#deck2").on({
        click: () => {
            deckPlayer2.show();
        },
        dragstart: (event) => {
          event.preventDefault();
          event.stopPropagation();
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
    });
    //forfeit events
    $("#forfeit-p1").on("click", () => {
       gameHandler.endGame(2);
    });
    $("#forfeit-p2").on("click", () => {
        gameHandler.endGame(1);
    });
    //color picker events
    $("#chooseRed").on("click", () => {
        colorHandler.handleButton(Card.redColor);
    });
    $("#chooseYellow").on("click", () => {
        colorHandler.handleButton(Card.yellowColor);
    });
    $("#chooseGreen").on("click", () => {
        colorHandler.handleButton(Card.greenColor);
    });
    $("#chooseBlue").on("click", () => {
        colorHandler.handleButton(Card.blueColor);
    });
});

//Classes & Logic
/**
 *  Handles the startup and end logic
 */
class GameHandler {
    /**
     * Handles the card distribution and style customization
     */
    startGame() {
        cardHandler.collectCards();
        cardHandler.distributeCards();
        cardHandler.chooseStarterCard();

        $("#offTTitle").html(`Player: ${tag1}`);
        $("#offBTitle").html(`Player: ${tag2}`);
        if (memeMode) $("#soypoint").css("display", "block");

        $("#startingPlayer").html(`<strong>${fetchTag(currentPlayer)}</strong> is going to start!`)
        new bootstrap.Modal("#startingInfo").show();
    }

    /**
     * Handles the leaderboard editing and redirection to index.html
     * @param player The player who won.
     */
    endGame(player) {
        if (localStorage.getItem("leaderboard") == null) {
            const noPlayers = {
                "players": []
            }
            localStorage.setItem("leaderboard", JSON.stringify(noPlayers));
        }
        const listValue = JSON.parse(localStorage.getItem("leaderboard"));
        listValue["players"].forEach(value => currentLeaderboard.push(LeaderboardEntry.from(value)));
        let winner = fetchTag(player);
        let existing = false;
        for (let entry of currentLeaderboard) {
            if (entry.tag === winner) {
                entry.score = parseInt(entry.score) + 1;
                entry.date = Date.now();
                existing = true;
                break;
            }
        }
        if (!existing) {
            currentLeaderboard.push(new LeaderboardEntry(winner, 1, Date.now()));
        }
        let newList = {
            "players": []
        }
        currentLeaderboard.sort((a, b) => b.score - a.score);
        currentLeaderboard.forEach(value => newList["players"].push({
            "tag": value.tag,
            "score": value.score,
            "date": value.date
        }));

        localStorage.setItem("leaderboard", JSON.stringify(newList));

        window.location.href = "index.html";
    }
}

/**
 * Handles all actions based around cards
 */
class CardHandler {
    /**
     * Appends all sprite-sheet coordinates as Card instances to list
     */
    collectCards() {
        for (let i = 0; i < 14; i++) {
            for (let j = 0; j < 8; j++) {
                allCards.push(new Card(i, j));
            }
        }
        allCards.splice(4, 4);
    }
    /**
     * Moves *x* cards from general card list to player deck lists
     */
    distributeCards() {
        for (let i = 0; i < cardCount; i++) {
            moveItem(allCards, cardsPlayerOne, allCards[Math.floor(Math.random() * allCards.length)]);
            moveItem(allCards, cardsPlayerTwo, allCards[Math.floor(Math.random() * allCards.length)]);
        }
        cardsPlayerOne.forEach(value => this.addCardToPlayerDeck(value, value.uuid, 1));
        cardsPlayerTwo.forEach(value => this.addCardToPlayerDeck(value, value.uuid, 2));
    }
    /**
     * Draws a random card for the given player and appends it to their deck
     * @param player
     */
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
    /**
     * Logic for appending a card to deck
     * @param card Instance of a Sprite
     * @param uuid Unique id of card
     * @param player Target player
     */
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
    /**
     * Chooses a random card to be displayed at game start
     */
    chooseStarterCard() {
        let card = allCards[Math.floor(Math.random() * allCards.length)];
        while (card.getType() !== "regular") {
            card = allCards[Math.floor(Math.random() * allCards.length)];
        }
        shownCard = card;
        $("#gameStack").css("background-position", "-"+card.x+"px -" + card.y + "px");
    }
    /**
     * Sets the current relevant card
     * @param card New card
     */
    updateShownCard(card) {
        this.updateShownDisplay(card);
        shownCard = card;
    }

    /**
     * Sets the current card to display
     * @param card Card to display
     */
    updateShownDisplay(card) {
        $("#gameStack").css("background-position", `-${card.x}px -${card.y}px`);
    }

    /**
     * Event handler for all present cards in decks
     * @param event Click event
     * @param player Player who clicked the card
     * @returns {Promise<void>} Promise of pending color pick action
     */
    async handleCardPick(event, player) {
        let card;

        if (player !== currentPlayer) return;

        if (player === 1) card = cardsPlayerOne.filter(value => value.uuid === event.target.id)[0];
        else if (player === 2) card = cardsPlayerTwo.filter(value => value.uuid === event.target.id)[0];

        if (card.getType() === "special" || card.getType() === "drawFour") {
            new bootstrap.Modal("#colorPicker").show();
            await colorHandler.awaitColorPick().then(value => {
                forcedColor = value;
                console.log(`${value} was force-picked by player ${player}`);
            });
        }

        if (!this.validateAction(card, player, forcedColor)) return;

        player === 1 ? deckPlayer1.hide() : deckPlayer2.hide();
        this.updateShownCard(card);
        if (card.getType() === "drawFour" || card.getType() === "special") {
            switch (forcedColor) {
                case "red":
                    this.updateShownDisplay(Card.redTemplateCard);
                    break;
                case "yellow":
                    this.updateShownDisplay(Card.yellowTemplateCard);
                    break;
                case "green":
                    this.updateShownDisplay(Card.greenTemplateCard);
                    break;
                case "blue":
                    this.updateShownDisplay(Card.blueTemplateCard);
                    break;
            }
        }
        $(`#${card.uuid}`).parent().remove();
        allCards.push(card); //Anti-Empty protection > Adds all played cards back to draw stack

        if (this.getCardCountOfPlayer(player) === 0) {
            gameHandler.endGame(player);
        }
    }

    /**
     * Handles the main game logic of cards
     * @param card Clicked card
     * @param player Player who clicked the card
     * @param forcedColor Forced color specified in color pick action
     * @returns {boolean} Clicked card is valid
     */
    validateAction(card, player, forcedColor) {
        switch (shownCard.getType()) {
            case "regular":
                if ((!card.hasColor() || shownCard.getColor() === card.getColor()) || (shownCard.getNumber() === card.getNumber())) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
            case "skip":
                if (shownCard.getColor() === card.getColor() || !card.hasColor() || shownCard.getType() === card.getType()) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
            case "mirror":
                if (shownCard.getColor() === card.getColor() || !card.hasColor() || shownCard.getType() === card.getType()) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
            case "drawTwo":
                if (shownCard.getColor() === card.getColor() || !card.hasColor() || card.getType() === shownCard.getType()) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
            case "drawFour":
                if (forcedColor !== undefined && card.getColor() === forcedColor) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
            case "special":
                if (card.getColor() === forcedColor) {
                    if (this.handleCardType(card, player)) turnHandler.next();
                    return true;
                } else return false;
        }
    }

    /**
     * Actions of the valid clicked card
     * @param card Clicked card
     * @param player Player who clicked the card
     * @returns {boolean} Do turn switch and continue with next player
     */
    handleCardType(card, player) {
        switch (card.getType()) {
            case "mirror":
                return false;
            case "skip":
                return false;
            case "drawTwo":
                for (let i = 0; i < 2; i++) {
                    this.drawCard(turnHandler.getNextPlayer(player))
                }
                return true;
            case "drawFour":
                for (let i = 0; i < 4; i++) {
                    this.drawCard(turnHandler.getNextPlayer(player))
                }
                return true;
            default:
                return true;
        }
    }

    /**
     *
     * @param player Player to check
     * @returns {jQuery|null} Count of cards of player
     */
    getCardCountOfPlayer(player) {
        if (player === 1) return $("#deck1Cards li").length;
        else if (player === 2) return $("#deck2Cards li").length;
        else return null;
    }
}

/**
 * Handles the color picker with asynchronous events
 */
class ColorHandler {
    /**
     * Endpoint of chosen color event
     * @param color Picked color
     */
    handleButton(color) {
        forcedColorCache = color;
    }

    /**
     * Awaits the players color picker action
     * @returns {Promise<unknown>} Picked color
     */
    awaitColorPick() {
        return new Promise(resolve => {
            setInterval(()=>{
                if (forcedColorCache != null) {
                    resolve(forcedColorCache);
                    forcedColorCache = null;
                }
            }, 50); //20 TPS - Ticks/Checks per second
        })
    }
}

/**
 * Handles the current turn
 */
class TurnHandler {
    static player1 = 1;
    static player2 = 2;

    /**
     * @returns {number} Random player
     */
    randomPlayer() {
        if (Math.random() >= 0.5) return TurnHandler.player1;
        else return TurnHandler.player2;
    }

    /**
     * Chooses random player to begin
     */
    init() {
        currentPlayer = this.randomPlayer();
        this.updateBorder();
    }

    /**
     * Passes turn to next player
     */
    next() {
        currentPlayer = this.getNextPlayer(currentPlayer);
        this.updateBorder();
    }
    /**
     * @param player Current player
     * @returns {number} Next player
     */
    getNextPlayer(player) {
        if (player === 1) return 2;
        else if (player === 2) return 1;
    }

    /**
     * Highlights curren player
     */
    updateBorder() {
        if (currentPlayer === 1) {
            if (memeMode) {
                $("#soypointimg").css("transform", "scaleX(1)");
            } else {
                $("#deck1").css("border-color", "slategray");
                $("#deck2").css("border-color", "transparent");
            }
        } else if (currentPlayer === 2) {
            if (memeMode) {
                $("#soypointimg").css("transform", "scaleX(-1)");
            } else {
                $("#deck1").css("border-color", "transparent");
                $("#deck2").css("border-color", "slategray");
            }
        }
    }
}

/**
 * Class representation of a card
 */
class Card {
    static regularCard = "regular";
    static skipCard = "skip";
    static mirrorCard = "mirror";
    static drawTwoCard = "drawTwo";
    static drawFourCard = "drawFour";
    static specialCard = "special";

    static redTemplateCard = new Card(0, 4);
    static yellowTemplateCard = new Card (0, 5);
    static greenTemplateCard = new Card (0, 6);
    static blueTemplateCard = new Card (0, 7);

    static redColor = "red";
    static yellowColor = "yellow";
    static greenColor = "green";
    static blueColor = "blue";

    /**
     * Creates a Card representation with calculated position
     * @param indexX Column in sprite-sheet
     * @param indexY Row in sprite-sheet
     */
    constructor(indexX, indexY) {
        this.uuid = generateUUID();
        this.column = indexX;
        this.row = indexY;
        this.x = indexX * 137;
        this.y = indexY * 206;
    }

    /**
     * @returns {string} Type of card
     */
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

    /**
     * @returns {null|string} Color of card
     */
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

    /**
     * @returns {boolean} Card has color
     */
    hasColor() {
        return this.getColor() != null;
    }

    /**
     * @returns {*|null} Number value of card
     */
    getNumber() {
        if (this.column < 10) {
            return this.column;
        } else return null;
    }
}

/**
 * Class representation of leaderboard entry
 */
class LeaderboardEntry {
    /**
     * Creates a representation of a leaderboard entry
     * @param tag Player TAG
     * @param score Player score
     * @param unix Last edit unix
     */
    constructor(tag, score, unix) {
        this.tag = tag;
        this.score = score;
        this.date = unix;
    }

    /**
     * Creates a representation of a leaderboard entry from json
     * @param json Json representation of element
     * @returns {any} Class representation of entry
     */
    static from(json){
        return Object.assign(new LeaderboardEntry(), json);
    }
}
//Helper functions
/**
 * Validates the chosen username
 * @param str Username to check
 * @returns {boolean} Valid username
 */
function isValidUsername(str) {
    return /^[a-zA-Z0-9]+([a-zA-Z0-9]([_\- ])[a-zA-Z0-9])*[a-zA-Z0-9]+$/.test(str)
}

function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) &&
        !isNaN(parseFloat(str))
}

/**
 * Moves element between lists
 * @param source Source array list
 * @param target Target array list
 * @param item Element to move
 */
function moveItem(source, target, item) {
    source.splice(allCards.indexOf(item), 1);
    target.push(item);
}

/**
 * Generates random uuid
 * @returns {`${string}-${string}-${string}-${string}-${string}`} Random UUID
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Fetches
 * @param player
 * @returns {null|string}
 */
function fetchTag(player) {
    if (player === 1) return tag1;
    else if (player === 2) return tag2;
    else return null;
}