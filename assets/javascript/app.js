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
// const connections = database.ref("/connections");
// const connectionsInfo = database.ref(".info/connected");
let numActivePlayers = 0;
let currentPlayer = "";

// connectionsInfo.on("value", (snapshot) => {
//     if (snapshot.val()) {
//         const newConnection = connections.push(true);
//         newConnection.onDisconnect().remove();
//     }
// });

// connections.on("value", (snapshot) => {
//     // numLiveUsers = snapshot.numChildren();
//     console.log(snapshot.numChildren());
// });

database.ref("/players").on("value", (snapshot) => {
    console.log(snapshot.val());
    Object.keys(snapshot.val()).forEach((key) => {
        console.log(key);
    });
    numActivePlayers = snapshot.numChildren();
    if (numActivePlayers === 2) {
        // start game play!
        console.log("start the game!");
    }
    // const currentPlayerDiv = $(`#${currentPlayer}-container`);
    // currentPlayerDiv.append($("<h3>").text(inputName));
    // currentPlayerDiv.append($("<p>").text("Wins: 0 Losses: 0"));
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

$("#name-submit").on("click", (e) => {
    e.preventDefault();
    const inputName = $("#name-input").val();
    const playerObj = {};
    playerObj[numActivePlayers] = {
        name: inputName,
        losses: 0,
        wins: 0,
    };
    $("#name-entry").remove();
    if (numActivePlayers < 2) {
        database.ref("/players").child(`player${numActivePlayers + 1}`).set({
            name: inputName,
            losses: 0,
            wins: 0,
        });
        currentPlayer = `player${numActivePlayers}`;
        $("header").append($("<h2>").text(`Welcome ${inputName}! You are player ${numActivePlayers}.`));
    } else {
        console.log("no more players allowed");
        $("header").append($("<h2>").text("I'm sorry. This game is full. Try back later."));
    }

    $("#name-input").val("");
});

window.addEventListener("unload", () => {
    database.ref("/players").child(currentPlayer).remove();
});
