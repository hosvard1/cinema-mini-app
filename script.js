const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

let selectedSession = null;
let selectedSeats = [];

const PRICE_PER_SEAT = 300;


// ==================================================
// USER
// ==================================================

const user = tg.initDataUnsafe?.user;

if (user) {
    const usernameElement =
        document.getElementById("username");

    if (usernameElement) {
        usernameElement.textContent =
            user.first_name || "User";
    }
}


// ==================================================
// MOVIE
// ==================================================

function openMovie() {

    const seatsSection =
        document.getElementById("seats-section");

    if (seatsSection) {
        seatsSection.classList.remove("hidden");
    }

    createSeats();
}


// ==================================================
// SESSION
// ==================================================

function selectSession(time) {

    selectedSession = time;

    selectedSeats = [];

    createSeats();

    updateSummary();

    const seatsSection =
        document.getElementById("seats-section");

    if (seatsSection) {
        seatsSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}


// ==================================================
// CREATE SEATS
// ==================================================

function createSeats() {

    const container =
        document.getElementById("seats");

    if (!container) {
        return;
    }

    container.innerHTML = "";


    for (let i = 1; i <= 36; i++) {

        const seat =
            document.createElement("div");

        seat.className = "seat";

        seat.textContent = i;


        // Demo taken seats

        if ([5, 8, 17, 25].includes(i)) {

            seat.classList.add("taken");

        } else {

            seat.onclick = function () {
                toggleSeat(i, seat);
            };

        }


        container.appendChild(seat);
    }
}


// ==================================================
// SELECT SEAT
// ==================================================

function toggleSeat(number, element) {

    if (selectedSeats.includes(number)) {

        selectedSeats =
            selectedSeats.filter(
                seat => seat !== number
            );

        element.classList.remove(
            "selected"
        );

    } else {

        selectedSeats.push(number);

        element.classList.add(
            "selected"
        );
    }


    updateSummary();
}


// ==================================================
// SUMMARY
// ==================================================

function updateSummary() {

    const seatsElement =
        document.getElementById(
            "selected-seats"
        );

    if (seatsElement) {

        seatsElement.textContent =
            selectedSeats.length
                ? selectedSeats.join(", ")
                : "—";
    }


    const total =
        selectedSeats.length *
        PRICE_PER_SEAT;


    const totalElement =
        document.getElementById("total");

    if (totalElement) {

        totalElement.textContent =
            `${total} ⭐`;
    }


    const payButton =
        document.getElementById(
            "pay-button"
        );

    if (payButton) {

        payButton.disabled =
            selectedSeats.length === 0;
    }
}


// ==================================================
// PAYMENT
// ==================================================

async function pay() {

    // ----------------------------------------------
    // CHECK SEATS
    // ----------------------------------------------

    if (selectedSeats.length === 0) {

        tg.showAlert(
            "💺 Նախ ընտրիր տեղերը։"
        );

        return;
    }


    // ----------------------------------------------
    // CHECK SESSION
    // ----------------------------------------------

    if (!selectedSession) {

        tg.showAlert(
            "🕐 Նախ ընտրիր սեանսը։"
        );

        return;
    }


    // ----------------------------------------------
    // USER
    // ----------------------------------------------

    const userId =
        tg.initDataUnsafe?.user?.id;


    if (!userId) {

        tg.showAlert(
            "Telegram user-ը չի գտնվել։"
        );

        return;
    }


    // ----------------------------------------------
    // TOTAL
    // ----------------------------------------------

    const total =
        selectedSeats.length *
        PRICE_PER_SEAT;


    // ----------------------------------------------
    // DISABLE BUTTON
    // ----------------------------------------------

    const payButton =
        document.getElementById(
            "pay-button"
        );

    if (payButton) {

        payButton.disabled = true;

        payButton.textContent =
            "⏳ Պատրաստվում է...";
    }


    try {

        // ==========================================
        // REQUEST VERCEL API
        // ==========================================

        const response =
            await fetch(
                "/api/create-invoice",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id: userId,

                        movie: "Avatar",

                        session:
                            selectedSession,

                        seats:
                            selectedSeats,

                        amount:
                            total
                    })
                }
            );


        // ==========================================
        // READ RESPONSE
        // ==========================================

        const data =
            await response.json();


        // ==========================================
        // ERROR
        // ==========================================

        if (!response.ok) {

            console.error(
                "Payment API error:",
                data
            );

            tg.showAlert(
                data.error ||
                "❌ Invoice ստեղծելու սխալ։"
            );

            return;
        }


        // ==========================================
        // INVOICE URL
        // ==========================================

        if (!data.invoice_url) {

            console.error(
                "Invoice URL missing:",
                data
            );

            tg.showAlert(
                "❌ Invoice link չի ստացվել։"
            );

            return;
        }


        console.log(
            "Invoice:",
            data.invoice_url
        );


        // ==========================================
        // OPEN TELEGRAM STARS PAYMENT
        // ==========================================

        tg.openInvoice(
            data.invoice_url,
            function(status) {

                console.log(
                    "Payment status:",
                    status
                );


                // ----------------------------------
                // PAID
                // ----------------------------------

                if (status === "paid") {

                    tg.showAlert(
                        "✅ Վճարումը հաջողությամբ կատարվեց!"
                    );

                }


                // ----------------------------------
                // CANCELLED
                // ----------------------------------

                else if (
                    status === "cancelled"
                ) {

                    tg.showAlert(
                        "Վճարումը չեղարկվեց։"
                    );

                }


                // ----------------------------------
                // FAILED
                // ----------------------------------

                else if (
                    status === "failed"
                ) {

                    tg.showAlert(
                        "❌ Վճարումը չհաջողվեց։"
                    );

                }


                // ----------------------------------
                // PENDING
                // ----------------------------------

                else {

                    console.log(
                        "Payment status:",
                        status
                    );
                }
            }
        );


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );


        tg.showAlert(
            "❌ Payment server error."
        );


    } finally {

        // ==========================================
        // RESTORE BUTTON
        // ==========================================

        if (payButton) {

            payButton.disabled =
                selectedSeats.length === 0;

            payButton.textContent =
                `⭐ Pay ${total} Stars`;
        }
    }
}


// ==================================================
// INITIAL SUMMARY
// ==================================================

updateSummary();
