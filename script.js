const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();


// ==================================================
// MODE
// ==================================================

const TEST_MODE = false;


// ==================================================
// DATA
// ==================================================

let selectedSession = null;
let selectedSeats = [];

const PRICE_PER_SEAT = 300;


// ==================================================
// USER
// ==================================================

const user = tg.initDataUnsafe?.user;

if (user) {

    const username =
        document.getElementById("username");

    if (username) {
        username.textContent =
            user.first_name || "User";
    }
}


// ==================================================
// MOVIE
// ==================================================

function openMovie() {

    const section =
        document.getElementById("seats-section");

    if (section) {
        section.classList.remove("hidden");
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


    const section =
        document.getElementById("seats-section");

    if (section) {

        section.scrollIntoView({
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


        // Taken seats

        if (
            [5, 8, 17, 25].includes(i)
        ) {

            seat.classList.add("taken");

        } else {

            seat.onclick = function () {

                toggleSeat(
                    i,
                    seat
                );

            };
        }


        container.appendChild(seat);
    }
}


// ==================================================
// SELECT SEAT
// ==================================================

function toggleSeat(
    number,
    element
) {

    if (
        selectedSeats.includes(number)
    ) {

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
        document.getElementById(
            "total"
        );

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

    if (
        selectedSeats.length === 0
    ) {

        tg.showAlert(
            "💺 Նախ ընտրիր տեղերը։"
        );

        return;
    }


    if (!selectedSession) {

        tg.showAlert(
            "🕐 Նախ ընտրիր սեանսը։"
        );

        return;
    }


    const userId =
        tg.initDataUnsafe?.user?.id;


    if (!userId) {

        tg.showAlert(
            "Telegram user-ը չի գտնվել։"
        );

        return;
    }


    const total =
        selectedSeats.length *
        PRICE_PER_SEAT;


    const payButton =
        document.getElementById(
            "pay-button"
        );


    if (payButton) {

        payButton.disabled = true;

        payButton.textContent =
            "⏳ Processing...";
    }


    try {

        // ==================================================
        // TEST PAYMENT
        // ==================================================

        if (TEST_MODE) {

            const response =
                await fetch(
                    "/api/test-payment",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            user_id:
                                userId,

                            movie:
                                "Avatar",

                            session:
                                selectedSession,

                            seats:
                                selectedSeats,

                            amount:
                                total
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                tg.showAlert(
                    data.error ||
                    "Test payment error."
                );

                return;
            }


            tg.showAlert(
                "🧪 TEST PAYMENT\n\n" +
                "✅ Թեստը հաջողությամբ ավարտվեց։\n\n" +
                "⭐ Իրական Stars չեն գանձվել։"
            );


            return;
        }


        // ==================================================
        // REAL STARS PAYMENT
        // ==================================================

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

                        user_id:
                            userId,

                        movie:
                            "Avatar",

                        session:
                            selectedSession,

                        seats:
                            selectedSeats,

                        amount:
                            total
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            tg.showAlert(
                data.error ||
                "Invoice ստեղծելու սխալ։"
            );

            return;
        }


        if (!data.invoice_url) {

            tg.showAlert(
                "Invoice link չի ստացվել։"
            );

            return;
        }


        tg.openInvoice(
            data.invoice_url,
            function(status) {

                console.log(
                    "Payment status:",
                    status
                );


                if (
                    status === "paid"
                ) {

                    tg.showAlert(
                        "✅ Վճարումը հաջողությամբ կատարվեց!"
                    );

                } else if (
                    status === "cancelled"
                ) {

                    tg.showAlert(
                        "Վճարումը չեղարկվեց։"
                    );

                } else if (
                    status === "failed"
                ) {

                    tg.showAlert(
                        "❌ Վճարումը չհաջողվեց։"
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

        if (payButton) {

            payButton.disabled =
                selectedSeats.length === 0;

            payButton.textContent =
                `⭐ Pay ${total} Stars`;
        }
    }
}


// ==================================================
// INITIALIZE
// ==================================================

updateSummary();
