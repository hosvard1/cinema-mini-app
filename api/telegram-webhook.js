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


        const update =
            req.body || {};


        const payment =
            update.message?.successful_payment;


        // Եթե payment update չէ
        if (!payment) {

            return res.status(200).json({
                ok: true
            });
        }


        const chatId =
            update.message.chat.id;


        // ==================================================
        // PAYMENT DATA
        // ==================================================

        const payload =
            payment.invoice_payload;


        let ticket = {};

        try {

            ticket =
                JSON.parse(payload);

        } catch {

            ticket = {};
        }


        const movie =
            ticket.movie ||
            "Cinema Ticket";


        const session =
            ticket.session ||
            "—";


        const seats =
            Array.isArray(ticket.seats)
                ? ticket.seats
                : [];


        const stars =
            payment.total_amount ||
            0;


        // ==================================================
        // SUCCESS MESSAGE
        // ==================================================

        const message =

            "✅ Ձեր վճարումը հաջողությամբ կատարվել է։\n\n" +

            `🎬 Ֆիլմ՝ ${movie}\n` +

            `🕐 Սեանս՝ ${session}\n` +

            `💺 Տեղեր՝ ${
                seats.length
                    ? seats.join(", ")
                    : "—"
            }\n` +

            `⭐ Վճարված՝ ${stars} Stars\n\n` +

            "🎟️ Ձեր տոմսը հաստատված է։";


        // ==================================================
        // SEND MESSAGE
        // ==================================================

        const messageResponse =
            await fetch(
                `https://api.telegram.org/bot${token}/sendMessage`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        chat_id:
                            chatId,

                        text:
                            message
                    })
                }
            );


        const messageData =
            await messageResponse.json();


        if (!messageData.ok) {

            console.error(
                "Message error:",
                messageData
            );
        }


        // ==================================================
        // SEND QR
        // ==================================================

        const photoResponse =
            await fetch(
                `https://api.telegram.org/bot${token}/sendPhoto`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        chat_id:
                            chatId,

                        photo:
                            "https://cinema-mini-app.vercel.app/qr.png",

                        caption:
                            "🎟️ Ձեր տոմսի QR կոդը"
                    })
                }
            );


        const photoData =
            await photoResponse.json();


        if (!photoData.ok) {

            console.error(
                "QR error:",
                photoData
            );
        }


        return res.status(200).json({
            ok: true
        });


    } catch (error) {

        console.error(
            "Webhook error:",
            error
        );


        return res.status(500).json({

            error:
                "Webhook error"
        });
    }
}
