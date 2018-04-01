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

function initializePlayer(i, inputName) {
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

function updatePlayerData(i, name, wins, losses) {
    $(`#player${i}-container > h3`).text(name);
    $(`#player${i}-container > p`).text(`Wins: ${wins} Losses: ${losses}`);
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

database.ref("/players").on("value", (snapshot) => {
    const players = snapshot.val();
    if (players) {
        numActivePlayers = Object.keys(players).length;
        if (numActivePlayers === 1) {
            $("#login-message").text("Player 1 is waiting for an opponent.");
            $("#name-submit").text("Sign in as Player 2");
        } else {
            $("#login-message").text("Game is full. Try again later.");
            $("form").hide();
            $(".card-action").hide();
            $(".page-footer").show();
        }
        for (let i = 1; i < 3; i++) {
            if (`player${i}` in players) {
                const playerData = players[`player${i}`];
                updatePlayerData(i, playerData.name, playerData.wins, playerData.losses);
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
        let player1choice;
        let player2choice;
        database.ref("/players").once("value", (playerSnapshot) => {
            player1choice = playerSnapshot.val().player1.choice;
            player2choice = playerSnapshot.val().player2.choice;
        });
        const result = checkResult(player1choice.toLowerCase(), player2choice.toLowerCase());
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
        $("#player1-container").append($("<h4>").text(player1choice));
        $("#player2-container").append($("<h4>").text(player2choice));
        $("#result-container").append($("<h4>").text(result));
        setTimeout(() => {
            $("#player1-container > h4").remove();
            $("#player2-container > h4").remove();
            $("#result-container > h4").remove();
            database.ref("/currentTurn").set(1);
        }, 3000);
    } else if (currentPlayerNum === newTurn) {
        $("#waiting-message").hide();
        $("#choice-buttons").show();
    } else if (currentPlayerNum) {
        $("#waiting-message .card-title").text("Waiting for other player to choose");
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
        initializePlayer(1, inputName);
        if (currentPlayer === "player1") {
            $("#waiting-message").show();
        }
    } else if (numActivePlayers === 1) {
        initializePlayer(2, inputName);
        database.ref("/currentTurn").set(1);
    } else {
        $("header").append($("<h2>").text("I'm sorry. This game is full. Try back later."));
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
    console.log("remove player", currentPlayer);
    if (currentPlayer) {
        database.ref("/players").child(currentPlayer).remove();
        // player 2 becomes player 1
    }
    console.log("remove current turn");
    database.ref("/currentTurn").remove();
    database.ref("/chat").remove();
    console.log("current turn removed");
});
