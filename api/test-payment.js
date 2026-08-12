export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const token = process.env.BOT_TOKEN;

        if (!token) {
            return res.status(500).json({
                error: "BOT_TOKEN is not configured"
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
                error: "Telegram user ID is missing"
            });
        }

        if (!seats || seats.length === 0) {
            return res.status(400).json({
                error: "No seats selected"
            });
        }

        // TEST ONLY
        const message =
            "🧪 TEST PAYMENT\n\n" +
            "✅ Վճարման թեստը հաջողությամբ ավարտվեց։\n\n" +
            `🎬 Ֆիլմ՝ ${movie || "Avatar"}\n` +
            `🕐 Սեանս՝ ${session || "—"}\n` +
            `💺 Տեղեր՝ ${seats.join(", ")}\n` +
            `⭐ Գումար՝ ${amount || 0} Stars\n\n` +
            "🎟️ Սա թեստային վճարում է։ Իրական Stars չեն գանձվել։";

        // Send confirmation message
        const messageResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    chat_id: user_id,
                    text: message
                })
            }
        );

        const messageData =
            await messageResponse.json();

        if (!messageData.ok) {
            console.error(
                "sendMessage error:",
                messageData
            );

            return res.status(500).json({
                error: "Could not send Telegram message"
            });
        }

        // Send the same QR image
        const photoResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendPhoto`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    chat_id: user_id,

                    photo:
                        "https://cinema-mini-app.vercel.app/qr.png",

                    caption:
                        "🎟️ TEST QR\n\n" +
                        "Այս QR-ը թեստային է։"
                })
            }
        );

        const photoData =
            await photoResponse.json();

        if (!photoData.ok) {
            console.error(
                "sendPhoto error:",
                photoData
            );

            return res.status(500).json({
                error: "Could not send QR"
            });
        }

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
            error: "Test payment failed"
        });
    }
}
