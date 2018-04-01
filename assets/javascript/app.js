// Initialize Firebase
const config = {
    apiKey: "AIzaSyA-rzzLNb9FB4NScu03dsvE7hbPh4oisFk",
    authDomain: "rps-multiplayer-472f4.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-472f4.firebaseio.com",
    projectId: "rps-multiplayer-472f4",
    storageBucket: "rps-multiplayer-472f4.appspot.com",
    messagingSenderId: "902546356426",
};
firebase.initializeApp(config);

const database = firebase.database();
let numActivePlayers = 0;
let currentPlayer = "";

function initializePlayer(inputName) {
    let i = 1;
    database.ref("/players").once("value", (playerSnapshot) => {
        const players = playerSnapshot.val();
        if (players) {
            if (Object.keys(players).length === 1) {
                const activePlayerNum = parseInt(Object.keys(players)[0].slice(-1), 10);
                i = getOtherPlayerNum(activePlayerNum);
            }
        }
    });
    database.ref("/players").child(`player${i}`).set({
        name: inputName,
        losses: 0,
        wins: 0,
    });
    currentPlayer = `player${i}`;
    let iText;
    if (i === 1) {
        iText = "one";
    } else {
        iText = "two";
    }
    $("#player-name").html($("<i>").addClass("material-icons right").text(`looks_${iText}`)).append(inputName);
    if (currentPlayer === `player${i}`) {
        $("#waiting-message .card-title").text("Waiting for a second player");
        $("#waiting-message").show();
    }
}

function checkResult(choice1, choice2) {
    if (choice1 === "rock") {
        if (choice2 === "paper") {
            return "player 2 wins";
        } else if (choice2 === "scissors") {
            return "player 1 wins";
        }
    } else if (choice1 === "paper") {
        if (choice2 === "rock") {
            return "player 1 wins";
        } else if (choice2 === "scissors") {
            return "player 2 wins";
        }
    } else if (choice1 === "scissors") {
        if (choice2 === "rock") {
            return "player 2 wins";
        } else if (choice2 === "paper") {
            return "player 1 wins";
        }
    }
    return "tie game";
}

function updatePlayerData(player, name, wins, losses) {
    if (currentPlayer === player) {
        $("#wins-number").text(wins);
        $("#losses-number").text(losses);
    }
}

function removePlayerData(i) {
    $(`#player${i}-container > h3`).text(`Waiting for Player ${i}`);
    $(`#player${i}-container > p`).text("");
}

function getNextTurn(i) {
    if (i < 3) {
        return i + 1;
    }
    return 1;
}

function getOtherPlayerNum(i) {
    if (i === 1) {
        return 2;
    }
    return 1;
}

database.ref("/players").on("value", (snapshot) => {
    const players = snapshot.val();
    if (players) {
        numActivePlayers = Object.keys(players).length;
        if (numActivePlayers === 1) {
            const activePlayerNum = Object.keys(players)[0].slice(-1);
            const otherPlayerNum = getOtherPlayerNum(activePlayerNum);
            $("#login-message").text(`Player ${activePlayerNum} is waiting for an opponent.`);
            $("#name-submit").text(`Sign in as Player ${otherPlayerNum}`);
            $("#waiting-message .card-title").text("Waiting for a second player");
            if (currentPlayer === `player${activePlayerNum}`) {
                $("#waiting-message").show();
            }
        } else {
            $("#login-message").text("Game is full. Try again later.");
            $("form").hide();
            $(".card-action").hide();
            $(".page-footer").show();
        }
        for (let i = 1; i < 3; i++) {
            if (`player${i}` in players) {
                const playerData = players[`player${i}`];
                updatePlayerData(`player${i}`, playerData.name, playerData.wins, playerData.losses);
            } else {
                removePlayerData(i);
            }
        }
    } else {
        numActivePlayers = 0;
        removePlayerData(1);
        removePlayerData(2);
    }
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

database.ref("/currentTurn").on("value", (snapshot) => {
    const newTurn = parseInt(snapshot.val(), 10);
    const currentPlayerNum = parseInt(currentPlayer.slice(-1), 10);
    if (newTurn === 3) {
        $("#waiting-message").show();
        let player1choice;
        let player2choice;
        let player1name;
        let player2name;
        database.ref("/players").once("value", (playerSnapshot) => {
            player1choice = playerSnapshot.val().player1.choice;
            player2choice = playerSnapshot.val().player2.choice;
            player1name = playerSnapshot.val().player1.name;
            player2name = playerSnapshot.val().player2.name;
        });
        const result = checkResult(player1choice, player2choice);
        if (currentPlayerNum === 1) { // only transact for a single client...better way?
            if (result === "player 1 wins") {
                database.ref("/players").transaction((playerSnapshot) => {
                    const newPlayerData = playerSnapshot;
                    newPlayerData.player1.wins++;
                    newPlayerData.player2.losses++;
                    return newPlayerData;
                });
            } else if (result === "player 2 wins") {
                database.ref("/players").transaction((playerSnapshot) => {
                    const newPlayerData = playerSnapshot;
                    newPlayerData.player2.wins++;
                    newPlayerData.player1.losses++;
                    return newPlayerData;
                });
            }
        }
        $(`#${player1choice}`).clone().addClass("temp").prependTo("#waiting-message .col");
        $(`#waiting-message #${player1choice} .card-title`).text(`${player1name} chooses ${player1choice}`);
        $(`#${player2choice}`).clone().addClass("temp").appendTo("#waiting-message .col");
        $(`#waiting-message #${player2choice} .card-title`).text(`${player2name} chooses ${player2choice}`);
        $(".progress").hide();
        $("#waiting-message .card-content .card-title").text(`${result}`);
        setTimeout(() => {
            $("#waiting-message .temp").remove();
            $(".progress").show();
            database.ref("/currentTurn").set(1);
        }, 5000);
    } else if (currentPlayerNum === newTurn) {
        $("#waiting-message").hide();
        $("#choice-buttons").show();
    } else if (currentPlayerNum && !isNaN(newTurn)) {
        const otherPlayerNum = getOtherPlayerNum(currentPlayerNum);
        $("#waiting-message .card-title").text(`Waiting for player ${otherPlayerNum} to choose`);
        $("#waiting-message").show();
    }
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

database.ref("/chat").orderByChild("dateAdded").limitToLast(1).on("child_added", (snapshot) => {
    const chats = snapshot.val();
    console.log(chats);
    $("#chat").append($("<p>").text(snapshot.val().message));
}, (errorObject) => {
    console.log(`Errors handled: ${errorObject.code}`);
});

$("#name-submit").on("click", (e) => {
    e.preventDefault();
    const inputName = $("#name-input").val();
    $("#name-entry").hide();
    if (numActivePlayers === 0) {
        initializePlayer(inputName);
    } else if (numActivePlayers === 1) {
        initializePlayer(inputName);
        database.ref("/currentTurn").set(1);
    }
    $("#name-input").val("");
});

$("#send-chat").on("click", (e) => {
    e.preventDefault();
    const chatMessage = $("#chat-input").val();
    database.ref("/chat").push({
        message: chatMessage,
        dateAdded: firebase.database.ServerValue.TIMESTAMP,
    });
    $("#chat-input").val("");
});

$(".rps-button").on("click", function () {
    database.ref(`/players/${currentPlayer}`).child("choice").set($(this).attr("id"));
    $("#choice-buttons").hide();
    database.ref("/currentTurn").transaction(currentTurn => getNextTurn(currentTurn));
});

window.addEventListener("unload", () => {
    if (currentPlayer) {
        database.ref("/players").child(currentPlayer).remove();
    }
    database.ref("/currentTurn").remove();
    database.ref("/chat").remove();
});
