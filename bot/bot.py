```python
import os
import json
import asyncio

from aiohttp import web

from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)


# ============================================================
# SETTINGS
# ============================================================

TOKEN = os.getenv("BOT_TOKEN")

if not TOKEN:
    raise RuntimeError("BOT_TOKEN is not set")


WEB_APP_URL = "https://cinema-mini-app.vercel.app/"


# ============================================================
# BOT
# ============================================================

bot = Bot(token=TOKEN)

dp = Dispatcher(bot)


# ============================================================
# /START
# ============================================================

@dp.message_handler(commands=["start"])
async def start_handler(message: types.Message):

    keyboard = InlineKeyboardMarkup()

    keyboard.add(
        InlineKeyboardButton(
            text="🎬 Open CINEMA",
            web_app=WebAppInfo(
                url=WEB_APP_URL
            )
        )
    )

    await message.answer(
        "🎬 Բարի գալուստ CINEMA!\n\n"
        "🍿 Ընտրիր ֆիլմը, սեանսը և քո տեղը։\n\n"
        "🎟️ Տոմսը կարող ես գնել "
        "Telegram Stars-ով։",
        reply_markup=keyboard
    )


# ============================================================
# PRE-CHECKOUT
# ============================================================

@dp.pre_checkout_query_handler()
async def pre_checkout_handler(
    query: types.PreCheckoutQuery
):

    try:

        await bot.answer_pre_checkout_query(
            query.id,
            ok=True
        )

        print(
            "PRE-CHECKOUT APPROVED:",
            query.id
        )

    except Exception as error:

        print(
            "PRE-CHECKOUT ERROR:",
            error
        )


# ============================================================
# SUCCESSFUL PAYMENT
# ============================================================

@dp.message_handler(
    content_types=["successful_payment"]
)
async def successful_payment_handler(
    message: types.Message
):

    try:

        payment = message.successful_payment

        # ----------------------------------------------------
        # Basic payment information
        # ----------------------------------------------------

        user_id = message.from_user.id

        charge_id = (
            payment.telegram_payment_charge_id
        )

        total_stars = (
            payment.total_amount
        )

        payload = (
            payment.invoice_payload
        )


        # ----------------------------------------------------
        # Parse invoice payload
        # ----------------------------------------------------

        movie = "Cinema"
        session = "—"
        seats = []

        try:

            payload_data = json.loads(
                payload
            )

            movie = payload_data.get(
                "movie",
                "Cinema"
            )

            session = payload_data.get(
                "session",
                "—"
            )

            seats = payload_data.get(
                "seats",
                []
            )

        except Exception as error:

            print(
                "PAYLOAD PARSE ERROR:",
                error
            )


        # ----------------------------------------------------
        # Console log
        # ----------------------------------------------------

        print()
        print("=" * 50)
        print("PAYMENT SUCCESSFUL")
        print("=" * 50)

        print(
            "User:",
            user_id
        )

        print(
            "Movie:",
            movie
        )

        print(
            "Session:",
            session
        )

        print(
            "Seats:",
            seats
        )

        print(
            "Stars:",
            total_stars
        )

        print(
            "Charge ID:",
            charge_id
        )

        print(
            "Payload:",
            payload
        )

        print("=" * 50)
        print()


        # ----------------------------------------------------
        # Confirmation message
        # ----------------------------------------------------

        seats_text = (
            ", ".join(
                map(str, seats)
            )
            if seats
            else "—"
        )


        confirmation_text = (

            "✅ Ձեր վճարումը "
            "հաջողությամբ կատարվել է։\n\n"

            f"🎬 Ֆիլմ՝ {movie}\n"

            f"🕐 Սեանս՝ {session}\n"

            f"💺 Տեղեր՝ {seats_text}\n"

            f"⭐ Վճարված՝ "
            f"{total_stars} Stars\n\n"

            "🎟️ Ձեր տոմսը հաստատված է։"
        )


        await message.answer(
            confirmation_text
        )


        # ----------------------------------------------------
        # Send QR
        # ----------------------------------------------------

        qr_url = (
            "https://cinema-mini-app.vercel.app/qr.png"
        )


        await bot.send_photo(
            chat_id=message.chat.id,

            photo=qr_url,

            caption=(
                "🎟️ Ձեր տոմսի QR կոդը"
            )
        )


        print(
            "QR SENT TO USER:",
            user_id
        )


    except Exception as error:

        print(
            "PAYMENT HANDLER ERROR:",
            error
        )


# ============================================================
# HEALTH CHECK SERVER
# ============================================================

async def health_handler(request):

    return web.json_response(
        {
            "status": "ok",
            "bot": "running"
        }
    )


async def start_web_server():

    app = web.Application()

    app.router.add_get(
        "/",
        health_handler
    )

    app.router.add_get(
        "/health",
        health_handler
    )


    runner = web.AppRunner(
        app
    )

    await runner.setup()


    port = int(
        os.getenv(
            "PORT",
            "8080"
        )
    )


    site = web.TCPSite(
        runner,

        "0.0.0.0",

        port
    )


    await site.start()


    print(
        f"🌐 Health server running "
        f"on port {port}"
    )


# ============================================================
# STARTUP
# ============================================================

async def on_startup(
    dispatcher
):

    print(
        "🎬 CINEMA BOT STARTING..."
    )

    await start_web_server()

    print(
        "✅ Health server started"
    )

    print(
        "🤖 Telegram polling started"
    )


# ============================================================
# SHUTDOWN
# ============================================================

async def on_shutdown(
    dispatcher
):

    print(
        "🛑 CINEMA BOT STOPPING..."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    print(
        "🎬 CINEMA BOT STARTED"
    )

    executor.start_polling(

        dp,

        skip_updates=True,

        on_startup=on_startup,

        on_shutdown=on_shutdown
    )
```
