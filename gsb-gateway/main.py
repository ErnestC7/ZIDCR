from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import time
from datetime import datetime

app = FastAPI(title="ZIDCR GSB Transaction Orchestrator Sandbox", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# MOCK DATABASE FOR DASHBOARD MONITORING
# ---------------------------------------------------------
transaction_logs = []

def log_transaction(service: str, status: str, details: str, amount: float = 0.0):
    log_entry = {
        "id": f"TXN-{str(uuid.uuid4())[:8].upper()}",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "service": service,
        "status": status,
        "details": details,
        "amount": amount
    }
    transaction_logs.insert(0, log_entry)
    if len(transaction_logs) > 100:
        transaction_logs.pop()

# Generate some initial dummy data for the dashboard to look populated
log_transaction("ZRA_TAX", "SUCCESS", "Tax clearance verified via KYC consent")
log_transaction("RTSA_LICENSING", "SUCCESS", "Driver license renewal ID verified")
log_transaction("MTN_MOMO", "SUCCESS", "Disbursed farmer subsidy", 1500.00)

# ---------------------------------------------------------
# KYC & CONSENT MANAGEMENT
# ---------------------------------------------------------
class KYCVerificationRequest(BaseModel):
    citizenUci: str
    consentToken: str
    requestingAgency: str

@app.post("/api/v1/gsb/kyc/verify")
async def verify_kyc_consent(req: KYCVerificationRequest):
    """
    Verifies citizen identity and explicit consent before sharing data across GSB.
    """
    log_transaction("KYC_GATEWAY", "PENDING", f"Verifying consent for {req.requestingAgency}")
    
    if not req.consentToken or not req.citizenUci:
        log_transaction("KYC_GATEWAY", "FAILED", "Missing UCI or Consent Token")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
        
    # Simulate cryptographic verification of consent token
    kyc_success_token = f"kyc_auth_{uuid.uuid4().hex}"
    
    log_transaction(req.requestingAgency, "SUCCESS", f"KYC data access granted for {req.citizenUci}")
    
    return {
        "status": "CONSENT_VERIFIED",
        "kycAuthToken": kyc_success_token,
        "citizenData": {
            "kycLevel": "TIER_3_BIOMETRIC",
            "amlStatus": "CLEARED"
        }
    }

# ---------------------------------------------------------
# TRANSACTION ORCHESTRATION ENGINE (MOBILE MONEY / CARDS)
# ---------------------------------------------------------
class FinancialTransaction(BaseModel):
    citizenUci: str
    network: str # MTN_MOMO, AIRTEL_MONEY, ZAMTEL_MONEY, VISA, MASTERCARD
    amount: float
    currency: str = "ZMW"
    transactionType: str # SUBSIDY_PAYMENT, FEE_COLLECTION
    isoMessageSupport: bool = False

@app.post("/api/v1/gsb/orchestrate/transaction")
async def route_transaction(req: FinancialTransaction, bg_tasks: BackgroundTasks):
    """
    Orchestrates financial transactions between government agencies and payment gateways.
    Supports API translation for Mobile Money and ISO 8583/20022 for Card Networks.
    """
    log_transaction("GSB_ORCHESTRATOR", "ROUTING", f"Routing {req.amount} {req.currency} via {req.network}")
    
    if req.network in ["MTN_MOMO", "AIRTEL_MONEY", "ZAMTEL_MONEY"]:
        # Simulate Mobile Money REST API Integration
        log_transaction(req.network, "PROCESSING", f"Initiating Mobile Money API call...")
        time.sleep(0.5) # Simulate latency
        log_transaction(req.network, "SUCCESS", f"Transaction complete", req.amount)
        return {"status": "COMPLETED", "gateway": req.network, "reference": str(uuid.uuid4())}
        
    elif req.network in ["VISA", "MASTERCARD"]:
        # Simulate ISO 8583 packed message conversion for bank switches
        if req.isoMessageSupport:
            iso_payload = f"0200{req.citizenUci[:10].replace('-','0').zfill(16)}000000{int(req.amount*100)}"
            log_transaction(req.network, "PROCESSING", f"Translated to ISO 8583: [{iso_payload}]")
        else:
            log_transaction(req.network, "PROCESSING", f"Initiating Card Network API call...")
            
        time.sleep(0.5)
        log_transaction(req.network, "SUCCESS", "Card transaction cleared", req.amount)
        return {"status": "COMPLETED", "gateway": req.network, "reference": str(uuid.uuid4())}
        
    else:
        log_transaction(req.network, "FAILED", f"Unsupported payment gateway")
        raise HTTPException(status_code=400, detail="Unsupported payment gateway")

# ---------------------------------------------------------
# MONITORING DASHBOARD API
# ---------------------------------------------------------
@app.get("/api/v1/gsb/monitoring/logs")
async def get_monitoring_logs():
    return {
        "status": "LIVE",
        "totalTransactions": len(transaction_logs),
        "logs": transaction_logs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
