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
let currentTurn = 1;


function initializePlayer(i, inputName) {
    database.ref("/players").child(`player${i}`).set({
        name: inputName,
        losses: 0,
        wins: 0,
    });
    currentPlayer = `player${i}`;
    $("header").append($("<h2>").text(`Welcome ${inputName}! You are player ${i}.`));
}

database.ref("/players").on("value", (snapshot) => {
    console.log("db change");
    numActivePlayers = snapshot.numChildren();
    if (snapshot.val()) {
        for (let i = 1; i < 3; i++) {
            if (`player${i}` in snapshot.val()) {
                const playerData = snapshot.val()[`player${i}`];
                $(`#player${i}-container > h3`).text(playerData.name);
                $(`#player${i}-container > p`).text(`Wins: ${playerData.wins} Losses: ${playerData.losses}`);
            } else {
                $(`#player${i}-container > h3`).text(`Waiting for Player ${i}`);
                $(`#player${i}-container > p`).text("");
            }
        }
    } else {
        $("#player1-container > h3").text("Waiting for Player 1");
        $("#player2-container > h3").text("Waiting for Player 2");
        $("#player1-container > p").text("");
        $("#player2-container > p").text("");
    }
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

database.ref("/currentTurn").on("value", (snapshot) => {
    console.log("currentTurn", snapshot.val());
    if (parseInt(currentPlayer.slice(-1), 10) === currentTurn) {
        $(`#player${snapshot.val()}-buttons`).show();
    }
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

$("#name-submit").on("click", (e) => {
    e.preventDefault();
    const inputName = $("#name-input").val();
    $("#name-entry").remove();
    if (numActivePlayers === 0) {
        initializePlayer(1, inputName);
    } else if (numActivePlayers === 1) {
        console.log("hello");
        initializePlayer(2, inputName);
        database.ref("/currentTurn").set(currentTurn);
    } else {
        console.log("no more players allowed");
        $("header").append($("<h2>").text("I'm sorry. This game is full. Try back later."));
    }
    $("#name-input").val("");
});

$("#player1-buttons").on("click", "button", function () {
    console.log($(this).text());
    database.ref(`/players/${currentPlayer}`).child("choice").set($(this).text());
});

window.addEventListener("unload", () => {
    console.log("exiting");
    if (currentPlayer) {
        database.ref("/players").child(currentPlayer).remove();
        database.ref("/currentTurn").remove();
    }
});
