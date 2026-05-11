from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI(title="ZIDCR Notification Gateway")

# Allow the React frontend to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class NotificationRequest(BaseModel):
    contact: str
    uci: str
    type: str # 'email' or 'sms'

def send_real_email(recipient_email: str, uci: str):
    print(f"Attempting to dispatch email to {recipient_email}...")
    
    # -------------------------------------------------------------------
    # REAL SMTP CREDENTIALS
    # -------------------------------------------------------------------
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = "ernestchungu7@gmail.com" # <--- IMPORTANT: Change this to the Gmail address you generated the password for!
    SENDER_PASSWORD = "fufc aekb hbbc gwoh"

    msg = MIMEMultipart()
    msg['From'] = "ZIDCR e-Registry"
    msg['To'] = recipient_email
    msg['Subject'] = "Official ZIDCR Digital Identity Issued"

    body = f"""
    Dear Citizen,
    
    Your biometric registration was successful.
    Your new 13-digit Unique Citizen Identifier (ZIDCR eNRC) is: {uci}
    
    Please keep this number highly secure. Do not share it with unauthorized personnel.
    
    Ministry of Home Affairs and Internal Security
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ SUCCESS: Official email physically sent to {recipient_email}")
    except Exception as e:
        print(f"❌ FAILED to send email. Did you enter your SMTP credentials? Error: {e}")

def send_real_sms(phone_number: str, uci: str):
    print(f"==================================================")
    print(f"📱 MOCK SMS GATEWAY INTERCEPT")
    print(f"==================================================")
    print(f"To: {phone_number}")
    print(f"Message: Dear Citizen, your biometric registration is complete. Your official ZIDCR eNRC is: {uci}")
    print(f"Status: DELIVERED (Simulated)")
    print(f"==================================================")


@app.post("/api/notify")
def dispatch_notification(req: NotificationRequest, bg_tasks: BackgroundTasks):
    if req.type == "email":
        bg_tasks.add_task(send_real_email, req.contact, req.uci)
        return {"status": "success", "message": f"Email dispatch initiated for {req.contact}"}
    elif req.type == "sms":
        bg_tasks.add_task(send_real_sms, req.contact, req.uci)
        return {"status": "success", "message": f"SMS dispatch initiated for {req.contact}"}
    else:
        raise HTTPException(status_code=400, detail="Invalid notification type")

if __name__ == "__main__":
    import uvicorn
    print("Starting ZIDCR Notification Gateway on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
