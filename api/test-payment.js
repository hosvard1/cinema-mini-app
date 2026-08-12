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
            user_id,
            movie,
            session,
            seats,
            amount
        } = req.body || {};


        if (!user_id) {

            return res.status(400).json({
                error:
                    "Telegram user ID is missing"
            });
        }


        if (
            !Array.isArray(seats) ||
            seats.length === 0
        ) {

            return res.status(400).json({
                error:
                    "No seats selected"
            });
        }


        // ==================================================
        // TEST MESSAGE
        // ==================================================

        const message =
            "🧪 TEST PAYMENT\n\n" +

            "✅ Վճարման թեստը հաջողությամբ ավարտվեց։\n\n" +

            `🎬 Ֆիլմ՝ ${movie || "Avatar"}\n` +

            `🕐 Սեանս՝ ${session || "—"}\n` +

            `💺 Տեղեր՝ ${seats.join(", ")}\n` +

            `⭐ Գումար՝ ${amount || 0} Stars\n\n` +

            "🎟️ Սա թեստային վճարում է։\n" +

            "Իրական Stars չեն գանձվել։";


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
                            user_id,

                        text:
                            message
                    })
                }
            );


        const messageData =
            await messageResponse.json();


        if (!messageData.ok) {

            console.error(
                "Telegram message error:",
                messageData
            );

            return res.status(500).json({

                error:
                    messageData.description ||
                    "Could not send Telegram message"
            });
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
                            user_id,

                        photo:
                            "https://cinema-mini-app.vercel.app/qr.png",

                        caption:
                            "🎟️ Ձեր տոմսի QR կոդը\n\n" +
                            "🧪 TEST QR"
                    })
                }
            );


        const photoData =
            await photoResponse.json();


        if (!photoData.ok) {

            console.error(
                "Telegram photo error:",
                photoData
            );

            return res.status(500).json({

                error:
                    photoData.description ||
                    "Could not send QR"
            });
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        return res.status(200).json({

            ok: true,

            test: true
        });


    } catch (error) {

        console.error(
            "Test payment error:",
            error
        );


        return res.status(500).json({

            error:
                "Test payment failed"
        });
    }
}
