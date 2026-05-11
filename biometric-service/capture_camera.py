import cv2
import os
import base64
import requests

def capture_face_and_send(uci="test_user_001"):
    """
    Opens the local webcam, uses Haar Cascades to detect a face,
    and upon pressing 'SPACE', captures the face, saves it locally,
    and sends the Base64 image to our FastAPI biometric-service.
    """
    # Load the pre-trained Haar Cascade face detection model from OpenCV
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Open the default camera (0)
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("--- WebCam Activated ---")
    print("Align your face in the frame.")
    print("Press 'SPACE' to capture.")
    print("Press 'ESC' or 'q' to quit.")

    captured_image = None

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))

        # Draw rectangles around detected faces
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, 'Face Detected', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Display the live feed
        cv2.imshow('ZIDCR Biometric Capture', frame)

        key = cv2.waitKey(1) & 0xFF
        if key == 27 or key == ord('q'):  # ESC or 'q'
            break
        elif key == 32:  # SPACE bar pressed
            if len(faces) == 0:
                print("No face detected. Please align your face.")
                continue
                
            print("Face captured!")
            
            # Crop the first detected face with a small margin
            (x, y, w, h) = faces[0]
            margin = 30
            y1 = max(0, y - margin)
            y2 = min(frame.shape[0], y + h + margin)
            x1 = max(0, x - margin)
            x2 = min(frame.shape[1], x + w + margin)
            
            captured_face = frame[y1:y2, x1:x2]
            
            # Save the cropped face locally
            os.makedirs("captured_biometrics", exist_ok=True)
            file_path = f"captured_biometrics/{uci}_face.jpg"
            cv2.imwrite(file_path, captured_face)
            print(f"Saved locally to {file_path}")
            
            # Convert to Base64 to send to FastAPI
            _, buffer = cv2.imencode('.jpg', captured_face)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            # Send to our biometric-service API
            try:
                print("Sending to Biometric Processing Service...")
                payload = {
                    "citizenUci": uci,
                    "faceImageBase64": base64_image,
                    "fingerprintBase64": None
                }
                
                # Assuming the FastAPI is running on port 8000
                response = requests.post("http://127.0.0.1:8000/api/v1/biometrics/process", json=payload)
                if response.status_code == 201:
                    data = response.json()
                    print(f"SUCCESS: Biometric Data Processed.")
                    print(f"Secure Hash ID: {data['biometricHashId']}")
                else:
                    print(f"FAILED: API returned {response.status_code}")
                    print(response.text)
            except Exception as e:
                print(f"Could not connect to API: {e}. Is FastAPI running on port 8000?")
                
            break

    # Release the camera and close windows
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    capture_face_and_send()
