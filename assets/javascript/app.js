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
    $("header").append($("<h2>").text(`Welcome ${inputName}! You are player ${i}.`));
}

function checkResult(choice1, choice2) {
    console.log("check result");
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
    console.log("updating player data. wins:", wins);
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
        console.log("if");
        let player1choice;
        let player2choice;
        database.ref("/players").once("value", (playerSnapshot) => {
            console.log("get choices");
            player1choice = playerSnapshot.val().player1.choice;
            player2choice = playerSnapshot.val().player2.choice;
        });
        let result = checkResult(player1choice.toLowerCase(), player2choice.toLowerCase());
        if (currentPlayerNum === 1) { // only transact for a single client. is there a better way to do this?
            if (result === "player 1 wins") {
                database.ref("/players").transaction((playerSnapshot) => {
                    let newPlayerData = playerSnapshot;
                    newPlayerData.player1.wins++;
                    newPlayerData.player2.losses++;
                    return newPlayerData;
                });
            } else if (result === "player 2 wins") {
                database.ref("/players").transaction((playerSnapshot) => {
                    let newPlayerData = playerSnapshot;
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
        $("#choice-buttons").appendTo(`#player${currentPlayerNum}-container`).show();
    }
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

$("#name-submit").on("click", (e) => {
    e.preventDefault();
    const inputName = $("#name-input").val();
    $("#name-entry").hide();
    if (numActivePlayers === 0) {
        initializePlayer(1, inputName);
    } else if (numActivePlayers === 1) {
        initializePlayer(2, inputName);
        database.ref("/currentTurn").set(1);
    } else {
        $("header").append($("<h2>").text("I'm sorry. This game is full. Try back later."));
    }
    $("#name-input").val("");
});

$("#choice-buttons").on("click", "button", function () {
    console.log("clicked on choice buttons");
    database.ref(`/players/${currentPlayer}`).child("choice").set($(this).text());
    $("#choice-buttons").hide();
    database.ref("/currentTurn").transaction((currentTurn) => {
        return getNextTurn(currentTurn);
    });
});

window.addEventListener("unload", () => {
    console.log("remove player", currentPlayer);
    if (currentPlayer) {
        database.ref("/players").child(currentPlayer).remove();
    }
    console.log("remove current turn");
    database.ref("/currentTurn").remove();
    console.log("current turn removed");
});
