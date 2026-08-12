const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();


let selectedSession = null;
let selectedSeats = [];

const PRICE_PER_SEAT = 300;


document.getElementById("username").textContent =
    tg.initDataUnsafe?.user?.first_name || "User";


function openMovie() {

    document
        .getElementById("seats-section")
        .classList.remove("hidden");

    createSeats();

}


function selectSession(time) {

    selectedSession = time;

    selectedSeats = [];

    createSeats();

    document
        .getElementById("seats-section")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function createSeats() {

    const container =
        document.getElementById("seats");

    container.innerHTML = "";

    for (let i = 1; i <= 36; i++) {

        const seat =
            document.createElement("div");

        seat.className = "seat";

        seat.textContent = i;

        // demo taken seats
        if ([5, 8, 17, 25].includes(i)) {

            seat.classList.add("taken");

        } else {

            seat.onclick = () =>
                toggleSeat(i, seat);

        }

        container.appendChild(seat);

    }

}


function toggleSeat(number, element) {

    if (selectedSeats.includes(number)) {

        selectedSeats =
            selectedSeats.filter(
                seat => seat !== number
            );

        element.classList.remove("selected");

    } else {

        selectedSeats.push(number);

        element.classList.add("selected");

    }

    updateSummary();

}


function updateSummary() {

    document.getElementById(
        "selected-seats"
    ).textContent =
        selectedSeats.length
            ? selectedSeats.join(", ")
            : "—";


    const total =
        selectedSeats.length * PRICE_PER_SEAT;

    document.getElementById(
        "total"
    ).textContent =
        `${total} ⭐`;


    document.getElementById(
        "pay-button"
    ).disabled =
        selectedSeats.length === 0;

}


function pay() {

    if (!selectedSeats.length) {
        return;
    }

    const total =
        selectedSeats.length * PRICE_PER_SEAT;


    // Հետագայում այստեղ
    // Telegram Stars invoice կստեղծենք

    tg.showAlert(
        `Payment: ${total} ⭐`
    );

}