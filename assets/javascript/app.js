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

database.ref().on("value", (snapshot) => {
    console.log(snapshot.numChildren());
    numActivePlayers = snapshot.numChildren();
}, (errorObject) => {
    console.log(`The read failed: ${errorObject.code}`);
});

$("#name-submit").on("click", (e) => {
    e.preventDefault();
    console.log("submitting name");
    const inputName = $("#name-input").val();
    const playerObj = {};
    playerObj[numActivePlayers] = {
        name: inputName,
        losses: 0,
        wins: 0,
    };
    console.log(playerObj);
    if (numActivePlayers < 2) {
        database.ref().child(`player${numActivePlayers + 1}`).set({
            name: inputName,
            losses: 0,
            winds: 0,
        });
        currentPlayer = `player${numActivePlayers}`;
    } else {
        console.log("no more players allowed");
    }
    numActivePlayers++;

    $("#name-input").val("");
});
