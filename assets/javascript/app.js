/*-------------------------------------------------------------------------
/ INITIALIZE FIREBASE
/-------------------------------------------------------------------------*/
const config = {
    apiKey: "AIzaSyA-rzzLNb9FB4NScu03dsvE7hbPh4oisFk",
    authDomain: "rps-multiplayer-472f4.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-472f4.firebaseio.com",
    projectId: "rps-multiplayer-472f4",
    storageBucket: "rps-multiplayer-472f4.appspot.com",
    messagingSenderId: "902546356426",
};
firebase.initializeApp(config);

/*-------------------------------------------------------------------------
/ GLOBAL VARIABLES
/-------------------------------------------------------------------------*/
const database = firebase.database();
let numActivePlayers = 0;
let currentPlayer = "";

/*-------------------------------------------------------------------------
/ FUNCTIONS
/-------------------------------------------------------------------------*/
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

function initializePlayer(inputName) {
    let newPlayerNum;
    database.ref("/players").once("value", (playerSnapshot) => {
        const players = playerSnapshot.val();
        if (players) {
            const activePlayerNum = parseInt(Object.keys(players)[0].slice(-1), 10);
            newPlayerNum = getOtherPlayerNum(activePlayerNum);
        } else {
            newPlayerNum = 1;
        }
    });
    currentPlayer = `player${newPlayerNum}`;
    database.ref("/players").child(`player${newPlayerNum}`).set({
        name: inputName,
        losses: 0,
        wins: 0,
    });
    let numText;
    if (newPlayerNum === 1) {
        numText = "one";
    } else {
        numText = "two";
    }
    $("#player-name").html($("<i>").addClass("material-icons right").text(`looks_${numText}`)).append(inputName);
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

function updateWinsLosses(result) {
    const currentPlayerNum = playerTextToNum(currentPlayer);
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
}

function playerTextToNum(playerText) {
    return parseInt(playerText.slice(-1), 10);
}

/*-------------------------------------------------------------------------
/ FIREBASE LISTENERS
/-------------------------------------------------------------------------*/
database.ref().on("value", (snapshot) => {
    if (snapshot.val()) {
        const playerData = snapshot.val().players;
        const currentTurn = snapshot.val().currentTurn;
        numActivePlayers = Object.keys(playerData).length;
        if (numActivePlayers === 1) {
            $("#choice-buttons").hide();
            const activePlayer = Object.keys(playerData)[0];
            const activePlayerNum = playerTextToNum(Object.keys(playerData)[0]);
            const otherPlayerNum = getOtherPlayerNum(activePlayerNum);
            if (currentPlayer === activePlayer) {
                $("#waiting-message .card-title").text("Waiting for a second player");
                $("#waiting-message").show();
            } else {
                $("#login-message").text(`Player ${activePlayerNum} is waiting for an opponent.`);
                $("#name-submit").text(`Sign in as player ${otherPlayerNum}`);
            }
        } else if (numActivePlayers === 2) {
            if (currentPlayer) {
                const currentPlayerNum = playerTextToNum(currentPlayer);
                $(".page-footer,.nav-content").show();
                $("ul.tabs").tabs();
                $("#wins-number").text(playerData[currentPlayer].wins);
                $("#losses-number").text(playerData[currentPlayer].losses);
                if (currentTurn === 3) {
                    const player1choice = playerData.player1.choice;
                    const player2choice = playerData.player2.choice;
                    const player1name = playerData.player1.name;
                    const player2name = playerData.player2.name;
                    const result = checkResult(player1choice, player2choice);
                    $(`#${player1choice}`).clone().addClass("temp").prependTo("#waiting-message .col");
                    $(`#waiting-message #${player1choice} .card-title`).text(`${player1name} chooses ${player1choice}`);
                    $(`#${player2choice}`).clone().addClass("temp").appendTo("#waiting-message .col");
                    $(`#waiting-message #${player2choice} .card-title`).text(`${player2name} chooses ${player2choice}`);
                    $(".progress").hide();
                    $("#waiting-message").show();
                    $("#waiting-message .card-content .card-title").text(`${result}`);
                    setTimeout(() => {
                        $("#waiting-message .temp").remove();
                        $(".progress").show();
                        database.ref("/currentTurn").set(1);
                        updateWinsLosses(result);
                    }, 5000);
                } else {
                    if (currentPlayerNum === currentTurn) {
                        $("#waiting-message").hide();
                        $("#choice-buttons").show();
                    } else {
                        $("#waiting-message .card-title").text(`Waiting for player ${currentTurn} to choose`);
                        $("#waiting-message").show();
                    }
                }
            } else {
                $("#login-message").text("Game is full. Try again later.");
                $("#name-form").hide();
                $("#sign-in-link").hide();
            }
        }
    } else {
        $("#login-message").text("No players here yet.");
        $("#name-submit").text("Sign in as player 1");
    }
});
// database.ref("/players").on("value", (snapshot) => {
//     console.log("player db chang");
//     const players = snapshot.val();
//     if (players) {
//         numActivePlayers = Object.keys(players).length;
//         if (numActivePlayers === 1) {
//             const activePlayerNum = parseInt(Object.keys(players)[0].slice(-1), 10);
//             const otherPlayerNum = getOtherPlayerNum(activePlayerNum);
//             console.log("Active Player Num", activePlayerNum);
//             console.log("Other Player Num", otherPlayerNum);
//             $("#login-message").text(`Player ${activePlayerNum} is waiting for an opponent.`);
//             $("#name-submit").text(`Sign in as Player ${otherPlayerNum}`);
//             $("#waiting-message .card-title").text("Waiting for a second player");
//             if (currentPlayer === `player${activePlayerNum}`) {
//                 $("#choice-buttons").hide();
//                 $(".page-footer").hide();
//                 $(".nav-content").hide();
//                 $("#waiting-message").show();
//             }
//         } else {
//             $("#login-message").text("Game is full. Try again later.");
//             $("form").hide();
//             $(".card-action").hide();
//             if (currentPlayer) {
//                 $(".page-footer").show();
//                 $(".nav-content").show();
//             }
//         }
//         for (let i = 1; i < 3; i++) {
//             if (`player${i}` in players) {
//                 const playerData = players[`player${i}`];
//                 updatePlayerData(`player${i}`, playerData.wins, playerData.losses);
//             }
//         }
//     } else {
//         numActivePlayers = 0;
//         $("#waiting-message .card-title").text("No players here yet.");
//     }
//     $("ul.tabs").tabs();
// }, (errorObject) => {
//     console.log(`The read failed: ${errorObject.code}`);
// });

// database.ref("/currentTurn").on("value", (snapshot) => {
//     console.log("current turn db change");
//     const newTurn = parseInt(snapshot.val(), 10);
//     const currentPlayerNum = parseInt(currentPlayer.slice(-1), 10);
//     if (newTurn === 3) {
//         $("#waiting-message").show();
//         let player1choice;
//         let player2choice;
//         let player1name;
//         let player2name;
//         database.ref("/players").once("value", (playerSnapshot) => {
//             player1choice = playerSnapshot.val().player1.choice;
//             player2choice = playerSnapshot.val().player2.choice;
//             player1name = playerSnapshot.val().player1.name;
//             player2name = playerSnapshot.val().player2.name;
//         });
//         const result = checkResult(player1choice, player2choice);
//         if (currentPlayerNum === 1) { // only transact for a single client...better way?
//             if (result === "player 1 wins") {
//                 database.ref("/players").transaction((playerSnapshot) => {
//                     const newPlayerData = playerSnapshot;
//                     newPlayerData.player1.wins++;
//                     newPlayerData.player2.losses++;
//                     return newPlayerData;
//                 });
//             } else if (result === "player 2 wins") {
//                 database.ref("/players").transaction((playerSnapshot) => {
//                     const newPlayerData = playerSnapshot;
//                     newPlayerData.player2.wins++;
//                     newPlayerData.player1.losses++;
//                     return newPlayerData;
//                 });
//             }
//         }
//         $(`#${player1choice}`).clone().addClass("temp").prependTo("#waiting-message .col");
//         $(`#waiting-message #${player1choice} .card-title`).text(`${player1name} chooses ${player1choice}`);
//         $(`#${player2choice}`).clone().addClass("temp").appendTo("#waiting-message .col");
//         $(`#waiting-message #${player2choice} .card-title`).text(`${player2name} chooses ${player2choice}`);
//         $(".progress").hide();
//         $("#waiting-message .card-content .card-title").text(`${result}`);
//         setTimeout(() => {
//             $("#waiting-message .temp").remove();
//             $(".progress").show();
//             database.ref("/currentTurn").set(1);
//         }, 5000);
//     } else if (currentPlayerNum === newTurn) {
//         $("#waiting-message").hide();
//         $("#choice-buttons").show();
//     } else if (currentPlayerNum && !isNaN(newTurn)) {
//         const otherPlayerNum = getOtherPlayerNum(currentPlayerNum);
//         $("#waiting-message .card-title").text(`Waiting for player ${otherPlayerNum} to choose`);
//         $("#waiting-message").show();
//     }
// }, (errorObject) => {
//     console.log(`The read failed: ${errorObject.code}`);
// });

// database.ref("/chat").orderByChild("dateAdded").limitToLast(1).on("child_added", (snapshot) => {
//     console.log("chats db change");
//     const chats = snapshot.val();
//     $("#chats").append($("<p>").text(snapshot.val().message));
// }, (errorObject) => {
//     console.log(`Errors handled: ${errorObject.code}`);
// });

/*-------------------------------------------------------------------------
/ CLICK EVENTS & LISTENERS
/-------------------------------------------------------------------------*/
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
        player: currentPlayer,
        dateAdded: firebase.database.ServerValue.TIMESTAMP,
    });
    $("#chat-input").val("");
});

$(".rps-button").on("click", function () {
    database.ref(`/players/${currentPlayer}`).child("choice").set($(this).attr("id"));
    $("#choice-buttons").hide();
    database.ref("/currentTurn").transaction(currentTurn => getNextTurn(currentTurn));
});

$("#chat-tab").on("click", () => {
    $("#game-container").hide();
    $("#chat-container").toggle();
});

$("#game-tab").on("click", () => {
    $("#game-container").toggle();
    $("#chat-container").toggle();
});

window.addEventListener("unload", () => {
    if (currentPlayer) {
        database.ref("/players").child(currentPlayer).remove();
        database.ref("/currentTurn").remove();
        database.ref("/chat").remove();
    }
});
