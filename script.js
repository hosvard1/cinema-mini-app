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

let selectedMovie = null;
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
            user.first_name || "Օգտատեր";
    }
}


// ==================================================
// HERO SLIDESHOW
// (was missing entirely — slides existed in HTML
//  but nothing ever rotated or activated them)
// ==================================================

let heroSlideIndex = 0;
let heroSlides = [];
let heroDots = [];
let heroTimer = null;

const HERO_INTERVAL = 5000;


function initHeroSlideshow() {

    heroSlides =
        Array.from(
            document.querySelectorAll(".hero-slide")
        );

    const dotsContainer =
        document.getElementById("hero-dots");

    if (!heroSlides.length || !dotsContainer) {
        return;
    }


    // ==============================================
    // BUILD DOTS
    // ==============================================

    dotsContainer.innerHTML = "";

    heroSlides.forEach(function (slide, index) {

        const dot =
            document.createElement("button");

        dot.type = "button";

        dot.className =
            "hero-dot" + (index === 0 ? " active" : "");

        dot.setAttribute(
            "aria-label",
            `Սլայդ ${index + 1}`
        );

        dot.onclick = function () {
            goToHeroSlide(index);
            restartHeroTimer();
        };

        dotsContainer.appendChild(dot);

    });

    heroDots =
        Array.from(
            dotsContainer.querySelectorAll(".hero-dot")
        );


    restartHeroTimer();
}


function goToHeroSlide(index) {

    if (!heroSlides.length) {
        return;
    }

    heroSlideIndex =
        (index + heroSlides.length) % heroSlides.length;


    heroSlides.forEach(function (slide, i) {

        slide.classList.toggle(
            "active",
            i === heroSlideIndex
        );

    });


    heroDots.forEach(function (dot, i) {

        dot.classList.toggle(
            "active",
            i === heroSlideIndex
        );

    });
}


function nextHeroSlide() {
    goToHeroSlide(heroSlideIndex + 1);
}


function restartHeroTimer() {

    if (heroTimer) {
        clearInterval(heroTimer);
    }

    heroTimer =
        setInterval(nextHeroSlide, HERO_INTERVAL);
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

    updateSummary();
}


// ==================================================
// SESSION
// ==================================================

function selectSession(time, buttonElement) {

    selectedSession = time;

    selectedSeats = [];


    // ==============================================
    // GET MOVIE NAME FROM THE SELECTED MOVIE CARD
    // ==============================================

    const movieCard =
        buttonElement?.closest(".movie-card");

    if (movieCard) {

        const movieTitle =
            movieCard.querySelector(".movie-info h3");

        if (movieTitle) {

            selectedMovie =
                movieTitle.textContent.trim();
        }
    }


    // ==============================================
    // CREATE SEATS
    // ==============================================

    createSeats();

    updateSummary();


    // ==============================================
    // REMOVE ACTIVE FROM ALL SESSION BUTTONS
    // (was global — clicking a session on one movie
    //  card cleared the active state on every other
    //  movie card too; now scoped to this card)
    // ==============================================

    const scope =
        movieCard || document;

    scope
        .querySelectorAll(".sessions button")
        .forEach(function (btn) {

            btn.classList.remove("active");

        });


    // ==============================================
    // ADD ACTIVE TO CURRENT BUTTON
    // ==============================================

    if (buttonElement) {
        buttonElement.classList.add("active");
    }


    // ==============================================
    // SHOW SEATS
    // ==============================================

    const section =
        document.getElementById("seats-section");

    if (section) {

        section.classList.remove("hidden");

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


        // ==========================================
        // TAKEN SEATS
        // ==========================================

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

        payButton.textContent =
            `⭐ Վճարել ${total} Stars`;
    }
}


// ==================================================
// PAYMENT
// ==================================================

async function pay() {

    // ==============================================
    // CHECK SEATS
    // ==============================================

    if (
        selectedSeats.length === 0
    ) {

        tg.showAlert(
            "💺 Նախ ընտրիր տեղերը։"
        );

        return;
    }


    // ==============================================
    // CHECK MOVIE
    // ==============================================

    if (!selectedMovie) {

        tg.showAlert(
            "🎬 Նախ ընտրիր ֆիլմը։"
        );

        return;
    }


    // ==============================================
    // CHECK SESSION
    // ==============================================

    if (!selectedSession) {

        tg.showAlert(
            "🕐 Նախ ընտրիր սեանսը։"
        );

        return;
    }


    // ==============================================
    // USER ID
    // ==============================================

    const userId =
        tg.initDataUnsafe?.user?.id;


    if (!userId) {

        tg.showAlert(
            "Telegram օգտատերը չի գտնվել։"
        );

        return;
    }


    // ==============================================
    // TOTAL
    // ==============================================

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
            "⏳ Մշակվում է...";
    }


    try {

        // ==========================================
        // TEST PAYMENT
        // ==========================================

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
                                selectedMovie,

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
                    "Թեստային վճարման սխալ։"
                );

                return;
            }


            tg.showAlert(
                "🧪 ԹԵՍՏԱՅԻՆ ՎՃԱՐՈՒՄ\n\n" +
                `🎬 ${selectedMovie}\n` +
                `🕐 ${selectedSession}\n` +
                `💺 ${selectedSeats.join(", ")}\n\n` +
                "✅ Թեստը հաջողությամբ ավարտվեց։\n\n" +
                "⭐ Իրական Stars չեն գանձվել։"
            );


            return;
        }


        // ==========================================
        // REAL STARS PAYMENT
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

                        user_id:
                            userId,

                        movie:
                            selectedMovie,

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


        // ==========================================
        // OPEN TELEGRAM INVOICE
        // ==========================================

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

                    // ==================================
                    // RESET STATE AFTER SUCCESSFUL PAYMENT
                    // (was missing — seats stayed marked
                    //  "selected" and payable again after
                    //  a completed purchase)
                    // ==================================

                    selectedSeats = [];

                    createSeats();

                    updateSummary();

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
            "❌ Վճարման սերվերի սխալ։"
        );


    } finally {

        if (payButton) {

            payButton.disabled =
                selectedSeats.length === 0;

            payButton.textContent =
                `⭐ Վճարել ${total} Stars`;
        }
    }
}


// ==================================================
// INITIALIZE
// ==================================================

initHeroSlideshow();

updateSummary();
