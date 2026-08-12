export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const update = req.body;

        // Ստուգում ենք՝ payment եղե՞լ է
        const payment =
            update.message?.successful_payment;

        if (!payment) {
            return res.status(200).json({
                ok: true
            });
        }

        const chatId =
            update.message.chat.id;

        const token =
            process.env.BOT_TOKEN;

        // 1. Ուղարկում ենք հաստատման տեքստը
        await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    chat_id: chatId,

                    text:
                        "✅ Ձեր վճարումը հաջողությամբ կատարվել է։\n\n" +
                        "🎬 Cinema Ticket\n" +
                        "⭐ Վճարումը՝ հաստատված\n\n" +
                        "🎟️ Ձեր տոմսը պատրաստ է։"
                })
            }
        );


        // 2. Ուղարկում ենք QR նկարը
        await fetch(
            `https://api.telegram.org/bot${token}/sendPhoto`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    chat_id: chatId,

                    photo:
                        "https://cinema-mini-app.vercel.app/qr.png",

                    caption:
                        "🎟️ Ձեր տոմսի QR կոդը"
                })
            }
        );


        return res.status(200).json({
            ok: true
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Webhook error"
        });
    }
}
