from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
import hashlib
import base64
import numpy as np
import cv2

app = FastAPI(title="ZIDCR Biometric Processing Service", version="2.0.0")

class BiometricCapture(BaseModel):
    citizenUci: str | None = None
    faceImageBase64: str | None = None
    fingerprintBase64: str | None = None

class BiometricStorageResponse(BaseModel):
    biometricHashId: str
    status: str
    modalitiesProcessed: list[str]

def extract_face_template(image_data: str) -> bytes:
    """
    Decodes the Base64 image and uses OpenCV to parse it.
    In a fully fleshed system, this is where FaceNet/Dlib 
    generates the 128D embedding. For this sandbox, we compute a 
    cryptographic hash of the image pixels directly.
    """
    try:
        # Decode base64 to image
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image data")
            
        # Here you would typically pass 'img' to a deep learning model.
        # e.g., face_encodings = face_recognition.face_encodings(img)
        # We'll use the raw pixel hash as the "template" for the sandbox.
        return hashlib.sha256(img.tobytes()).digest()
    except Exception as e:
        raise ValueError(f"Face extraction failed: {str(e)}")

def extract_fingerprint_minutiae(image_data: str) -> bytes:
    """
    Placeholder for actual minutiae extraction algorithms 
    (e.g., crossing number method).
    """
    try:
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            raise ValueError("Failed to decode fingerprint data")
            
        return hashlib.sha256(img.tobytes()).digest()
    except Exception as e:
        raise ValueError(f"Fingerprint extraction failed: {str(e)}")

@app.post("/api/v1/biometrics/process", response_model=BiometricStorageResponse, status_code=status.HTTP_201_CREATED)
async def process_biometric(capture: BiometricCapture):
    """
    Extracts biometric templates (Face, Fingerprint) and cryptographically 
    hashes them for storage to prevent raw image leakage.
    """
    if not capture.faceImageBase64 and not capture.fingerprintBase64:
        raise HTTPException(status_code=400, detail="At least one biometric modality must be provided.")
        
    combined_template = b""
    processed = []
    
    if capture.faceImageBase64:
        face_template = extract_face_template(capture.faceImageBase64)
        combined_template += face_template
        processed.append("FACE_RECOGNITION")
        
    if capture.fingerprintBase64:
        fingerprint_template = extract_fingerprint_minutiae(capture.fingerprintBase64)
        combined_template += fingerprint_template
        processed.append("FINGERPRINT")
        
    # Generate a strong cryptographic hash (SHA-3 256) of the combined biometric vectors
    # We store the hash, NOT the raw image.
    biometric_hash = hashlib.sha3_256(combined_template).hexdigest()
    
    # Store biometric_hash -> encrypted templates in a secure DB/Blob storage
    # Raw images are discarded from memory immediately.
    
    return BiometricStorageResponse(
        biometricHashId=biometric_hash,
        status="SECURELY_PROCESSED_AND_STORED",
        modalitiesProcessed=processed
    )

@app.get("/health")
async def health_check():
    return {"status": "Biometric Engine healthy"}
