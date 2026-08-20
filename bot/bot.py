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

    keyboard = InlineKeyboardMarkup(row_width=1)

    keyboard.add(
        InlineKeyboardButton(
            text="🎬 Բացել CINEMA",
            web_app=WebAppInfo(
                url=WEB_APP_URL
            )
        )
    )

    await message.answer(
        "🎬 Բարի գալուստ CINEMA!\n\n"
        "🍿 Ընտրիր ֆիլմը, սեանսը և քո տեղը։\n\n"
        "🎟️ Տոմսը կարող ես գնել Telegram Stars-ով։",
        reply_markup=keyboard
    )


# ============================================================
# WEB APP DATA
# ============================================================

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def web_app_data_handler(message: types.Message):

    try:

        data = json.loads(
            message.web_app_data.data
        )

        print()
        print("=" * 60)
        print("WEB APP DATA")
        print("=" * 60)
        print(data)
        print("=" * 60)
        print()

    except Exception as error:

        print(
            "WEB APP DATA ERROR:",
            error
        )


# ============================================================
# PRE-CHECKOUT
# ============================================================

@dp.pre_checkout_query_handler()
async def pre_checkout_handler(
    query: types.PreCheckoutQuery
):

    try:

        print()
        print("=" * 60)
        print("PRE-CHECKOUT QUERY")
        print("=" * 60)

        print("ID:", query.id)
        print("Currency:", query.currency)
        print("Amount:", query.total_amount)
        print("Payload:", query.invoice_payload)

        print("=" * 60)
        print()

        await bot.answer_pre_checkout_query(
            pre_checkout_query_id=query.id,
            ok=True
        )

        print(
            "PRE-CHECKOUT APPROVED"
        )

    except Exception as error:

        print(
            "PRE-CHECKOUT ERROR:",
            error
        )

        try:

            await bot.answer_pre_checkout_query(
                pre_checkout_query_id=query.id,
                ok=False,
                error_message=(
                    "Վճարումը հնարավոր չէ հաստատել։"
                )
            )

        except Exception as second_error:

            print(
                "PRE-CHECKOUT RESPONSE ERROR:",
                second_error
            )


# ============================================================
# SUCCESSFUL PAYMENT
# ============================================================

@dp.message_handler(
    content_types=types.ContentType.SUCCESSFUL_PAYMENT
)
async def successful_payment_handler(
    message: types.Message
):

    try:

        payment = message.successful_payment

        # ----------------------------------------------------
        # USER
        # ----------------------------------------------------

        user_id = message.from_user.id

        username = (
            message.from_user.username
            or "No username"
        )

        # ----------------------------------------------------
        # PAYMENT
        # ----------------------------------------------------

        charge_id = (
            payment.telegram_payment_charge_id
        )

        total_stars = (
            payment.total_amount
        )

        payload = (
            payment.invoice_payload
        )

        currency = (
            payment.currency
        )

        # ----------------------------------------------------
        # DEFAULT DATA
        # ----------------------------------------------------

        movie = "Cinema"
        session = "—"
        seats = []

        # ----------------------------------------------------
        # PARSE PAYLOAD
        # ----------------------------------------------------

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
        # SEATS
        # ----------------------------------------------------

        if isinstance(seats, list):

            seats_text = ", ".join(
                map(str, seats)
            )

        else:

            seats_text = str(seats)

        if not seats_text:

            seats_text = "—"

        # ----------------------------------------------------
        # LOG
        # ----------------------------------------------------

        print()
        print("=" * 70)
        print("PAYMENT SUCCESSFUL")
        print("=" * 70)

        print(
            "User ID:",
            user_id
        )

        print(
            "Username:",
            username
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
            seats_text
        )

        print(
            "Stars:",
            total_stars
        )

        print(
            "Currency:",
            currency
        )

        print(
            "Charge ID:",
            charge_id
        )

        print(
            "Payload:",
            payload
        )

        print("=" * 70)
        print()

        # ----------------------------------------------------
        # CONFIRMATION
        # ----------------------------------------------------

        confirmation_text = (
            "✅ Վճարումը հաջողությամբ կատարվել է։\n\n"

            f"🎬 Ֆիլմ՝ {movie}\n"
            f"🕐 Սեանս՝ {session}\n"
            f"💺 Տեղեր՝ {seats_text}\n\n"

            f"⭐ Վճարված՝ {total_stars} Stars\n\n"

            "🎟️ Ձեր տոմսը հաստատված է։"
        )

        await message.answer(
            confirmation_text
        )

        # ----------------------------------------------------
        # QR
        # ----------------------------------------------------

        qr_url = (
            "https://cinema-mini-app.vercel.app/qr.png"
        )

        try:

            await bot.send_photo(
                chat_id=message.chat.id,
                photo=qr_url,
                caption="🎟️ Ձեր տոմսի QR կոդը"
            )

            print(
                "QR SENT:",
                user_id
            )

        except Exception as qr_error:

            print(
                "QR ERROR:",
                qr_error
            )

            await message.answer(
                "⚠️ Վճարումը հաստատված է, "
                "բայց QR կոդը ուղարկել չհաջողվեց։"
            )

    except Exception as error:

        print(
            "PAYMENT HANDLER ERROR:",
            error
        )


# ============================================================
# HEALTH CHECK
# ============================================================

async def health_handler(
    request: web.Request
):

    return web.json_response(
        {
            "status": "ok",
            "bot": "running"
        }
    )


# ============================================================
# WEB SERVER
# ============================================================

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
        f"🌐 Health server running on port {port}"
    )


# ============================================================
# STARTUP
# ============================================================

async def on_startup(
    dispatcher: Dispatcher
):

    print()
    print("=" * 60)
    print("🎬 CINEMA BOT STARTING")
    print("=" * 60)

    await start_web_server()

    print(
        "✅ Health server started"
    )

    print(
        "🤖 Telegram polling started"
    )

    print("=" * 60)
    print()


# ============================================================
# SHUTDOWN
# ============================================================

async def on_shutdown(
    dispatcher: Dispatcher
):

    print(
        "🛑 CINEMA BOT STOPPING..."
    )

    await bot.close()


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
