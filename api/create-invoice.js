export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { movie, session, seats, amount } = req.body;

        if (!seats || seats.length === 0) {
            return res.status(400).json({
                error: "No seats selected"
            });
        }

        const response = await fetch(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/createInvoiceLink`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: "Cinema Ticket",

                    description:
                        `${movie} | ${session} | Seats: ${seats.join(", ")}`,

                    payload: JSON.stringify({
                        movie,
                        session,
                        seats
                    }),

                    provider_token: "",

                    currency: "XTR",

                    prices: [
                        {
                            label: "Cinema Ticket",
                            amount: amount
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!data.ok) {
            return res.status(400).json({
                error: data.description
            });
        }

        return res.status(200).json({
            invoice_url: data.result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });
    }
}
