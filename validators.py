"""
ZIDCR Shared Validation Library
================================
Centralised validation rules for all Python microservices.
Used by: notification_gateway.py, gsb-gateway/main.py, biometric-service/main.py
"""

import re
from datetime import date, datetime
from typing import Optional

# ─────────────────────────────────────────────────────────────
# 1. NATIONAL REGISTRATION NUMBER VALIDATORS
# ─────────────────────────────────────────────────────────────

def validate_uci_13(uci: str) -> tuple[bool, str]:
    """Validates a 13-digit INRIS eNRC / UCI number."""
    if not uci:
        return False, "UCI is required."
    if not uci.isdigit():
        return False, "UCI must contain digits only (no dashes or spaces)."
    if len(uci) != 13:
        return False, f"UCI must be exactly 13 digits. Got {len(uci)}."
    # Luhn-style basic check: first digit cannot be 0
    if uci[0] == '0':
        return False, "UCI cannot begin with a leading zero."
    return True, "Valid"

def validate_legacy_nrc(nrc: str) -> tuple[bool, str]:
    """Validates old Zambian NRC format: NNNNNN/YY/N (e.g. 123456/10/1)."""
    if not nrc:
        return True, "Optional field — skipped."  # NRC is optional
    pattern = r'^\d{6}/\d{2}/\d{1}$'
    if not re.match(pattern, nrc):
        return False, "Invalid NRC format. Expected format: 123456/10/1"
    return True, "Valid"

def validate_passport(passport: str) -> tuple[bool, str]:
    """Validates Zambia passport number format (e.g. ZM123456 or AB123456)."""
    if not passport:
        return True, "Optional field — skipped."
    pattern = r'^[A-Z]{2}\d{6}$'
    if not re.match(pattern, passport.upper()):
        return False, "Invalid passport format. Expected: 2 letters + 6 digits (e.g. ZM123456)"
    return True, "Valid"

# ─────────────────────────────────────────────────────────────
# 2. PERSONAL DATA VALIDATORS
# ─────────────────────────────────────────────────────────────

def validate_name(name: str, field: str = "Name") -> tuple[bool, str]:
    """Validates a legal name — letters, spaces, hyphens only."""
    if not name or not name.strip():
        return False, f"{field} is required."
    if len(name.strip()) < 2:
        return False, f"{field} must be at least 2 characters."
    if len(name.strip()) > 100:
        return False, f"{field} cannot exceed 100 characters."
    pattern = r"^[A-Za-z\s\-']+$"
    if not re.match(pattern, name.strip()):
        return False, f"{field} can only contain letters, spaces, hyphens, or apostrophes."
    return True, "Valid"

def validate_dob(dob_str: str) -> tuple[bool, str]:
    """Validates date of birth — must be a real past date, not more than 150 years ago."""
    if not dob_str:
        return False, "Date of birth is required."
    try:
        dob = date.fromisoformat(dob_str)
    except ValueError:
        return False, "Invalid date format. Expected YYYY-MM-DD."
    
    today = date.today()
    if dob >= today:
        return False, "Date of birth must be in the past."
    age_years = (today - dob).days / 365.25
    if age_years > 150:
        return False, "Date of birth cannot be more than 150 years ago."
    return True, f"Valid — Age: {int(age_years)} years"

def validate_gender(gender: str) -> tuple[bool, str]:
    allowed = {'Male', 'Female', 'Intersex'}
    if gender not in allowed:
        return False, f"Gender must be one of: {', '.join(allowed)}"
    return True, "Valid"

# ─────────────────────────────────────────────────────────────
# 3. CONTACT VALIDATORS
# ─────────────────────────────────────────────────────────────

def validate_phone(phone: str) -> tuple[bool, str]:
    """Validates Zambian phone number — +260 or 0 prefix, 9-10 digits."""
    if not phone:
        return True, "Optional field — skipped."
    # Strip spaces and dashes
    clean = re.sub(r'[\s\-]', '', phone)
    # Support: +2609XXXXXXXX, 09XXXXXXXX, 9XXXXXXXX
    pattern = r'^(\+260|0)?[679]\d{8}$'
    if not re.match(pattern, clean):
        return False, "Invalid Zambian phone. Expected format: +260 97X XXX XXX or 097XXXXXXX"
    return True, "Valid"

def validate_email(email: str) -> tuple[bool, str]:
    """Validates email address."""
    if not email:
        return True, "Optional field — skipped."
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email.strip()):
        return False, "Invalid email address format."
    return True, "Valid"

# ─────────────────────────────────────────────────────────────
# 4. VITAL EVENTS / CRVS VALIDATORS
# ─────────────────────────────────────────────────────────────

def validate_icd11_code(code: str) -> tuple[bool, str]:
    """
    Validates ICD-11 code format (e.g. '1B13', 'BA00', 'XY7Z').
    Format: 1-2 letters/digits prefix + 2-3 alphanumeric suffix.
    """
    if not code:
        return False, "ICD-11 Cause of Death code is required for death registration."
    pattern = r'^[A-Z0-9]{1,3}[A-Z0-9]{1,4}(\.[A-Z0-9]+)?$'
    if not re.match(pattern, code.upper()):
        return False, f"Invalid ICD-11 code '{code}'. Example valid codes: 1B13, BA00, 5A11.0"
    return True, "Valid"

def validate_event_date(event_date_str: str, field: str = "Event date") -> tuple[bool, str]:
    """Validates that a vital event date is not in the future."""
    if not event_date_str:
        return False, f"{field} is required."
    try:
        event_dt = datetime.fromisoformat(event_date_str.replace('Z', '+00:00'))
        if event_dt.date() > date.today():
            return False, f"{field} cannot be in the future."
    except ValueError:
        return False, f"Invalid datetime format for {field}."
    return True, "Valid"

# ─────────────────────────────────────────────────────────────
# 5. GSB / FINANCIAL VALIDATORS
# ─────────────────────────────────────────────────────────────

SUPPORTED_NETWORKS = {'MTN_MOMO', 'AIRTEL_MONEY', 'ZAMTEL_MONEY', 'VISA', 'MASTERCARD'}
SUPPORTED_CURRENCIES = {'ZMW', 'USD', 'GBP', 'EUR', 'ZAR'}

def validate_transaction_amount(amount: float) -> tuple[bool, str]:
    if amount is None:
        return False, "Transaction amount is required."
    if amount <= 0:
        return False, "Transaction amount must be greater than zero."
    if amount > 10_000_000:
        return False, "Transaction exceeds single-transaction limit of ZMW 10,000,000."
    return True, f"Valid — Amount: {amount:.2f}"

def validate_payment_network(network: str) -> tuple[bool, str]:
    if network not in SUPPORTED_NETWORKS:
        return False, f"Unsupported network '{network}'. Supported: {', '.join(SUPPORTED_NETWORKS)}"
    return True, "Valid"

# ─────────────────────────────────────────────────────────────
# 6. COMPOSITE VALIDATOR — Run all checks for citizen enrollment
# ─────────────────────────────────────────────────────────────

def validate_citizen_enrollment(data: dict) -> dict:
    """
    Runs all enrollment validations in one call.
    Returns: { "is_valid": bool, "errors": [str], "warnings": [str] }
    """
    errors = []
    warnings = []

    checks = [
        validate_name(data.get('first_name', ''), 'First Name'),
        validate_name(data.get('last_name', ''), 'Last Name'),
        validate_dob(data.get('date_of_birth', '')),
        validate_gender(data.get('gender', '')),
        validate_phone(data.get('phone', '')),
        validate_email(data.get('email', '')),
        validate_legacy_nrc(data.get('legacy_nrc_number', '')),
        validate_passport(data.get('passport_number', '')),
    ]

    for is_valid, message in checks:
        if not is_valid:
            errors.append(message)

    # Warnings (non-blocking)
    if not data.get('phone') and not data.get('email'):
        warnings.append("No contact info provided. Citizen will not receive credential delivery.")
    if not data.get('legacy_nrc_number') and not data.get('passport_number'):
        warnings.append("No legacy ID provided. Duplicate check will rely on biometrics only.")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


# ─────────────────────────────────────────────────────────────
# Quick self-test (run: python validators.py)
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== ZIDCR Validator Self-Test ===\n")

    tests = [
        ("UCI 13-digit valid",    validate_uci_13("4591028374619")),
        ("UCI too short",         validate_uci_13("123")),
        ("UCI has letters",       validate_uci_13("459102ABC4619")),
        ("Legacy NRC valid",      validate_legacy_nrc("123456/10/1")),
        ("Legacy NRC invalid",    validate_legacy_nrc("12345-10-1")),
        ("Phone valid",           validate_phone("+260 97 123 4567")),
        ("Phone invalid",         validate_phone("0123456")),
        ("Email valid",           validate_email("ernest@example.com")),
        ("Email invalid",         validate_email("not-an-email")),
        ("DOB valid",             validate_dob("1990-05-07")),
        ("DOB in future",         validate_dob("2099-01-01")),
        ("ICD-11 valid",          validate_icd11_code("1B13")),
        ("ICD-11 invalid",        validate_icd11_code("??!!")),
        ("Amount valid",          validate_transaction_amount(1500.00)),
        ("Amount zero",           validate_transaction_amount(0)),
    ]

    for label, (is_valid, msg) in tests:
        status = "[PASS]" if is_valid else "[FAIL]"
        print(f"  {status}  [{label}]: {msg}")
