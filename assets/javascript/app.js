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
const connections = database.ref("/connections");
const connectionsInfo = database.ref(".info/connected");
const rpsGame = {
    numLiveUsers: 0,
    printStatus() {
        if (this.numLiveUsers === 0) {
            console.log("waiting for player 1");
        } else if (this.numLiveUsers === 1) {
            console.log("waiting for player 2");
        } else {
            console.log("no more players allowed");
        }
    },
};

connectionsInfo.on("value", (snapshot) => {
    if (snapshot.val()) {
        const newConnection = connections.push(true);
        newConnection.onDisconnect().remove();
    }
});

connections.on("value", (snapshot) => {
    rpsGame.numLiveUsers = snapshot.numChildren();
    rpsGame.printStatus();
});
