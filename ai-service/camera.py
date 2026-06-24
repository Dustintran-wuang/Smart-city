import cv2
import mediapipe as mp
import numpy as np
from scipy.spatial import distance
import requests
import base64
import time

# CONFIGURATIONS
BACKEND_URL = "http://localhost:8080/api/v1/alerts"
DEVICE_CODE = "DEV-CAM-001"
COOLDOWN_SECONDS = 10

last_alert_time = 0

# MEDIAPIPE FACEMESH
mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# EAR THRESHOLD
EAR_THRESHOLD = 0.20
CLOSED_FRAMES_THRESHOLD = 30

closed_frames = 0

# EYE LANDMARKS
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# EAR FUNCTION
def calculate_ear(eye_points):

    A = distance.euclidean(
        eye_points[1],
        eye_points[5]
    )

    B = distance.euclidean(
        eye_points[2],
        eye_points[4]
    )

    C = distance.euclidean(
        eye_points[0],
        eye_points[3]
    )

    ear = (A + B) / (2.0 * C)

    return ear

# CAMERA
cap = cv2.VideoCapture(0)

print(f"Starting Drowsiness Detection for device: {DEVICE_CODE}")
print(f"Backend URL: {BACKEND_URL}")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame = cv2.resize(frame, (640, 480))
    display_frame = frame.copy()

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(rgb)

    status = "NORMAL"
    ear = 0.0

    if results.multi_face_landmarks:

        face_landmarks = results.multi_face_landmarks[0]

        h, w, _ = frame.shape

        left_eye_points = []
        right_eye_points = []

    
        # LEFT EYE
    
        for idx in LEFT_EYE:

            landmark = face_landmarks.landmark[idx]

            x = int(landmark.x * w)
            y = int(landmark.y * h)

            left_eye_points.append((x, y))

            cv2.circle(
                display_frame,
                (x, y),
                2,
                (0, 255, 0),
                -1
            )

    
        # RIGHT EYE
    
        for idx in RIGHT_EYE:

            landmark = face_landmarks.landmark[idx]

            x = int(landmark.x * w)
            y = int(landmark.y * h)

            right_eye_points.append((x, y))

            cv2.circle(
                display_frame,
                (x, y),
                2,
                (0, 255, 0),
                -1
            )

        left_ear = calculate_ear(left_eye_points)

        right_ear = calculate_ear(right_eye_points)

        ear = (left_ear + right_ear) / 2

    
        # DROWSINESS CHECK
    
        if ear < EAR_THRESHOLD:

            closed_frames += 1

        else:

            closed_frames = 0

        if closed_frames >= CLOSED_FRAMES_THRESHOLD:

            status = "DROWSY"

            cv2.putText(
                display_frame,
                "ALERT!",
                (220, 200),
                cv2.FONT_HERSHEY_SIMPLEX,
                2,
                (0, 0, 255),
                4
            )

            # Check cooldown before sending alert
            current_time = time.time()
            if current_time - last_alert_time >= COOLDOWN_SECONDS:
                print("[AI] Drowsiness detected! Capturing frame and sending alert...")
                
                # Encode frame to Base64
                _, buffer = cv2.imencode('.jpg', frame)
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # Send alert to backend
                payload = {
                    "deviceCode": DEVICE_CODE,
                    "earValue": float(ear),
                    "consecutiveFrames": int(closed_frames),
                    "imageBase64": img_base64
                }
                
                try:
                    response = requests.post(BACKEND_URL, json=payload, timeout=5)
                    if response.status_code == 201:
                        print(f"[AI] Alert sent successfully: {response.json()}")
                        last_alert_time = current_time
                    else:
                        print(f"[AI] Failed to send alert. Status code: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    print(f"[AI] Error connecting to backend: {e}")

    
        # SHOW EAR
    
        cv2.putText(
            display_frame,
            f"EAR: {ear:.3f}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2
        )

    cv2.putText(
        display_frame,
        status,
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0) if status == "NORMAL" else (0, 0, 255),
        2
    )

    cv2.imshow(
        "Smart City Drowsiness Detection",
        display_frame
    )

    key = cv2.waitKey(1)

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()