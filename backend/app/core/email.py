import httpx

MAILERSEND_API_TOKEN = "mlsn.8a5ae005910d867b3f506a3275e412fae1cc1a8ce3f911449bffbd8fb77afb22"
MAILERSEND_SENDER_EMAIL = "noreply@test-3m5jgro9q0ogdpyo.mlsender.net"  # Тестовый домен MailerSend
MAILERSEND_SENDER_NAME = "ESTATE.TJ"

async def send_email_code(to_email: str, code: str):
    url = "https://api.mailersend.com/v1/email"
    headers = {
        "Authorization": f"Bearer {MAILERSEND_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Код подтверждения</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
            }}
            .code {{
                background: #f3f4f6;
                padding: 15px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                border-radius: 6px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #6b7280;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ESTATE.TJ</h1>
            </div>
            <div class="content">
                <h2>Код подтверждения</h2>
                <p>Здравствуйте!</p>
                <p>Для завершения регистрации на ESTATE.TJ, пожалуйста, используйте следующий код подтверждения:</p>
                <div class="code">{code}</div>
                <p>Этот код действителен в течение 5 минут.</p>
                <p>Если вы не запрашивали этот код, пожалуйста, проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
                <p>© 2024 ESTATE.TJ. Все права защищены.</p>
            </div>
        </div>
    </body>
    </html>
    """

    data = {
        "from": {
            "email": MAILERSEND_SENDER_EMAIL,
            "name": MAILERSEND_SENDER_NAME
        },
        "to": [
            {"email": to_email}
        ],
        "subject": "Код подтверждения регистрации на ESTATE.TJ",
        "text": f"Ваш код для регистрации на ESTATE.TJ: {code}\n\nВведите этот код на сайте для подтверждения регистрации.",
        "html": html_content
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        response.raise_for_status()
    return response.json() 