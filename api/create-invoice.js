export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });
    }


    try {

        const token =
            process.env.BOT_TOKEN;


        if (!token) {

            return res.status(500).json({
                error:
                    "BOT_TOKEN is not configured"
            });
        }


        const {
            movie,
            session,
            seats,
            amount
        } = req.body || {};


        if (
            !Array.isArray(seats) ||
            seats.length === 0
        ) {

            return res.status(400).json({
                error:
                    "No seats selected"
            });
        }


        if (!amount || amount <= 0) {

            return res.status(400).json({
                error:
                    "Invalid amount"
            });
        }


        const response =
            await fetch(
                `https://api.telegram.org/bot${token}/createInvoiceLink`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            "Cinema Ticket",

                        description:
                            `${movie || "Avatar"} | ` +
                            `${session || "—"} | ` +
                            `Seats: ${seats.join(", ")}`,

                        payload:
                            JSON.stringify({

                                movie:
                                    movie ||
                                    "Avatar",

                                session:
                                    session ||
                                    "—",

                                seats:
                                    seats
                            }),

                        provider_token:
                            "",

                        currency:
                            "XTR",

                        prices: [
                            {
                                label:
                                    "Cinema Ticket",

                                amount:
                                    amount
                            }
                        ]
                    })
                }
            );


        const data =
            await response.json();


        if (!data.ok) {

            console.error(
                "Telegram invoice error:",
                data
            );

            return res.status(400).json({

                error:
                    data.description ||
                    "Could not create invoice"
            });
        }


        return res.status(200).json({

            invoice_url:
                data.result
        });


    } catch (error) {

        console.error(
            "Invoice error:",
            error
        );


        return res.status(500).json({

            error:
                "Server error"
        });
    }
}
