"""
H. pylori Detection System - FastAPI Backend
"""
import sys
import os

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
import json
import os
import csv
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO, StringIO
import base64
from datetime import timedelta
from jose import JWTError, jwt
import bcrypt

from firebase_config import get_firestore_db, get_storage_bucket
from models.ai_model import analyze_signal, generate_random_signal, get_detector
from audit_logger import log_audit_event, log_patient_access, log_test_access, AuditAction, AuditResource
import qrcode
from io import BytesIO
import random
import string

# ============= Lifespan Handler =============
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load data
    load_all_data()
    yield
    # Shutdown: save data
    save_all_data()
    print("Data saved to disk")

# ============= Authentication Config =============
SECRET_KEY = "h-pylori-detection-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
FRONTEND_URL = "https://melfinsanjaiharit.netlify.app"  # For QR code links

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

app = FastAPI(title="H. pylori Detection API", version="1.0.0", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (for development without Firebase)
patients_db = {}
tests_db = {}
reports_db = {}
users_db = {}
appointments_db = {}
notifications_db = {}
patient_portal_db = {}  # Patient portal accounts
active_sessions = {}  # Active user sessions

# ============= Local File Storage =============
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

def save_to_file(filename, data):
    """Save data to JSON file"""
    filepath = DATA_DIR / filename
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving {filename}: {e}")

def load_from_file(filename, default=dict):
    """Load data from JSON file"""
    filepath = DATA_DIR / filename
    if filepath.exists():
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    return default()

def save_all_data():
    """Save all databases to files"""
    save_to_file("patients.json", patients_db)
    save_to_file("tests.json", tests_db)
    save_to_file("reports.json", reports_db)
    save_to_file("users.json", users_db)
    save_to_file("appointments.json", appointments_db)
    save_to_file("notifications.json", notifications_db)
    save_to_file("patient_portal.json", patient_portal_db)
    save_to_file("sessions.json", active_sessions)

def load_all_data():
    """Load all databases from files"""
    global patients_db, tests_db, reports_db, users_db, appointments_db, notifications_db, patient_portal_db, active_sessions
    patients_db = load_from_file("patients.json")
    tests_db = load_from_file("tests.json")
    reports_db = load_from_file("reports.json")
    users_db = load_from_file("users.json")
    appointments_db = load_from_file("appointments.json")
    notifications_db = load_from_file("notifications.json")
    patient_portal_db = load_from_file("patient_portal.json")
    active_sessions = load_from_file("sessions.json")

# Load data on startup
load_all_data()
print(f"Data loaded from {DATA_DIR}")

# User roles
class UserRole:
    ADMIN = "Admin"
    DOCTOR = "Doctor"
    LAB_TECHNICIAN = "LabTechnician"
    PATIENT = "Patient"

# Permissions
class Permission:
    CAN_VIEW_PATIENTS = "can_view_patients"
    CAN_EDIT_PATIENTS = "can_edit_patients"
    CAN_RUN_TESTS = "can_run_tests"
    CAN_VIEW_RESULTS = "can_view_results"
    CAN_GENERATE_REPORTS = "can_generate_reports"
    CAN_MANAGE_USERS = "can_manage_users"
    CAN_VIEW_AUDIT = "can_view_audit"
    CAN_CONFIRM_TESTS = "can_confirm_tests"

# Role-based permissions mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        Permission.CAN_VIEW_PATIENTS,
        Permission.CAN_EDIT_PATIENTS,
        Permission.CAN_RUN_TESTS,
        Permission.CAN_VIEW_RESULTS,
        Permission.CAN_GENERATE_REPORTS,
        Permission.CAN_MANAGE_USERS,
        Permission.CAN_VIEW_AUDIT,
        Permission.CAN_CONFIRM_TESTS,
    ],
    UserRole.DOCTOR: [
        Permission.CAN_VIEW_PATIENTS,
        Permission.CAN_EDIT_PATIENTS,
        Permission.CAN_RUN_TESTS,
        Permission.CAN_VIEW_RESULTS,
        Permission.CAN_GENERATE_REPORTS,
        Permission.CAN_VIEW_AUDIT,
        Permission.CAN_CONFIRM_TESTS,
    ],
    UserRole.LAB_TECHNICIAN: [
        Permission.CAN_VIEW_PATIENTS,
        Permission.CAN_RUN_TESTS,
        Permission.CAN_VIEW_RESULTS,
    ],
    UserRole.PATIENT: [
        Permission.CAN_VIEW_RESULTS,  # Only own results
    ],
}

def check_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission"""
    return permission in ROLE_PERMISSIONS.get(role, [])

# ============= Auth Models =============

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = UserRole.DOCTOR

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    createdAt: str

# Initialize Firebase
try:
    db = get_firestore_db()
    bucket = get_storage_bucket()
except Exception as e:
    print(f"Firebase initialization: {e}")
    db = None
    bucket = None

# ============= Pydantic Models =============

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class TreatmentUpdate(BaseModel):
    treatmentStatus: Optional[str] = None
    treatmentStartDate: Optional[str] = None
    treatmentEndDate: Optional[str] = None
    treatmentNotes: Optional[str] = None
    antibiotics: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    email: str
    phone: str
    address: str
    treatmentStatus: Optional[str] = "pending"
    treatmentStartDate: Optional[str] = None
    treatmentEndDate: Optional[str] = None
    treatmentNotes: Optional[str] = None
    antibiotics: Optional[str] = None
    createdAt: str
    updatedAt: str

class TestCreate(BaseModel):
    patientId: str
    binarySignal: str
    imageUrl: Optional[str] = ""

class TestResponse(BaseModel):
    id: str
    patientId: str
    patientName: Optional[str] = ""
    binarySignal: str
    signalLength: int
    prediction: str
    confidence: float
    nanopaperColor: str
    imageUrl: str
    createdAt: str
    analyzedAt: str

class AnalysisRequest(BaseModel):
    binarySignal: str

# Test Confirmation Model
class TestConfirmRequest(BaseModel):
    testId: str
    confirmedBy: str
    confirmSignature: str

# Notification Models
class NotificationCreate(BaseModel):
    userId: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error

class NotificationResponse(BaseModel):
    id: str
    userId: str
    title: str
    message: str
    type: str
    read: bool
    createdAt: str

# Patient Portal Models
class PatientPortalLogin(BaseModel):
    patientId: str
    accessCode: str

class PatientPortalRegister(BaseModel):
    patientId: str
    accessCode: str
    email: str
    password: str

# QR Code Model
class QRCodeResponse(BaseModel):
    qrCode: str  # base64 encoded image

class ReportGenerate(BaseModel):
    patientId: str
    testId: str
    format: str  # "PDF" or "CSV"

class ChatMessage(BaseModel):
    message: str

# ============= Helper Functions =============

def generate_id():
    return str(uuid.uuid4())

def get_timestamp():
    return datetime.now().isoformat()

def save_to_firebase(collection: str, data: dict):
    """Save data to Firebase Firestore"""
    if db:
        try:
            doc_ref = db.collection(collection).document(data['id'])
            doc_ref.set(data)
            return True
        except Exception as e:
            print(f"Firebase save error: {e}")
    return False

def get_from_firebase(collection: str, doc_id: str = None):
    """Get data from Firebase Firestore"""
    if db:
        try:
            if doc_id:
                doc = db.collection(collection).document(doc_id).get()
                if doc.exists:
                    return doc.to_dict()
            else:
                docs = db.collection(collection).stream()
                return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Firebase get error: {e}")
    return None

# ============= API Endpoints =============

@app.get("/")
def root():
    return {
        "message": "H. pylori Detection API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": get_timestamp()}

# ============= Auth Endpoints =============

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    """Register a new user"""
    # Check if username exists
    for user in users_db.values():
        if user['username'] == request.username:
            raise HTTPException(status_code=400, detail="Username already exists")

    user_id = generate_id()
    hashed_password = get_password_hash(request.password)

    user_data = {
        "id": user_id,
        "username": request.username,
        "email": request.email,
        "password": hashed_password,
        "role": request.role,
        "createdAt": get_timestamp()
    }

    if db:
        save_to_firebase('users', user_data)
    else:
        users_db[user_id] = user_data

    # Create token
    access_token = create_access_token(data={"sub": user_id, "username": request.username, "role": request.role})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "role": request.role
        }
    )

@app.post("/api/auth/login")
def login(request: LoginRequest):
    """Login user"""
    # Find user by username
    user = None
    for u in users_db.values():
        if u['username'] == request.username:
            user = u
            break

    if not user:
        # Log failed login attempt
        log_audit_event(
            user_id=None,
            username=request.username,
            action=AuditAction.LOGIN,
            resource_type=AuditResource.USER,
            details="Failed login - user not found"
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, user['password']):
        # Log failed login attempt
        log_audit_event(
            user_id=user['id'],
            username=user['username'],
            action=AuditAction.LOGIN,
            resource_type=AuditResource.USER,
            details="Failed login - invalid password"
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Log successful login
    log_audit_event(
        user_id=user['id'],
        username=user['username'],
        action=AuditAction.LOGIN,
        resource_type=AuditResource.USER,
        details="Successful login"
    )

    # Create token
    access_token = create_access_token(data={"sub": user['id'], "username": user['username'], "role": user['role']})

    # Track active session
    session_id = generate_id()
    active_sessions[session_id] = {
        "id": session_id,
        "userId": user['id'],
        "username": user['username'],
        "role": user['role'],
        "createdAt": get_timestamp(),
        "lastActivity": get_timestamp()
    }

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    )

@app.get("/api/auth/me")
def get_current_user(authorization: str = None):
    """Get current user info"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    user = users_db.get(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "role": user['role']
    }

@app.get("/api/sessions")
def get_sessions(authorization: str = Header(None)):
    """Get all active sessions (Admin only)"""
    # Check authentication
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_role = payload.get("role")

    # Only admins can view all sessions - check both string and enum
    if user_role != "Admin" and user_role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    return list(active_sessions.values())

@app.delete("/api/sessions/{session_id}")
def revoke_session(session_id: str, authorization: str = Header(None)):
    """Revoke a session (force logout)"""
    # Check authentication
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_role = payload.get("role")

    # Only admins can revoke sessions
    if user_role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    if session_id in active_sessions:
        session = active_sessions[session_id]
        del active_sessions[session_id]

        # Log session revocation
        log_audit_event(
            user_id=payload.get("sub"),
            username=payload.get("username"),
            action=AuditAction.LOGOUT,
            resource_type=AuditResource.USER,
            details=f"Session revoked for user: {session.get('username')}"
        )

        return {"message": "Session revoked successfully"}

    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/users", response_model=List[UserResponse])
def get_users():
    """Get all users (admin only)"""
    return [
        {
            "id": u['id'],
            "username": u['username'],
            "email": u['email'],
            "role": u['role'],
            "createdAt": u.get('createdAt', '')
        }
        for u in users_db.values()
    ]

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    """Delete user"""
    if user_id in users_db:
        del users_db[user_id]
        return {"message": "User deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")

# ============= Patient Endpoints =============

@app.get("/api/patients", response_model=List[PatientResponse])
def get_patients():
    """Get all patients"""
    if db:
        docs = db.collection('patients').stream()
        patients = [doc.to_dict() for doc in docs]
        return patients

    return list(patients_db.values())

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str):
    """Get patient by ID"""
    if db:
        doc = db.collection('patients').document(patient_id).get()
        if doc.exists:
            return doc.to_dict()

    if patient_id in patients_db:
        return patients_db[patient_id]

    raise HTTPException(status_code=404, detail="Patient not found")

@app.post("/api/patients", response_model=PatientResponse)
def create_patient(patient: PatientCreate):
    """Create new patient"""
    patient_id = generate_id()
    timestamp = get_timestamp()

    patient_data = {
        "id": patient_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "email": patient.email or "",
        "phone": patient.phone or "",
        "address": patient.address or "",
        "createdAt": timestamp,
        "updatedAt": timestamp
    }

    if db:
        save_to_firebase('patients', patient_data)
    else:
        patients_db[patient_id] = patient_data

    return patient_data

@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: str, patient: PatientUpdate):
    """Update patient"""
    existing = get_patient(patient_id)

    update_data = patient.dict(exclude_unset=True)
    update_data["updatedAt"] = get_timestamp()

    for key, value in update_data.items():
        if value is not None:
            existing[key] = value

    if db:
        db.collection('patients').document(patient_id).update(update_data)
    else:
        patients_db[patient_id] = existing

    return existing

@app.put("/api/patients/{patient_id}/treatment", response_model=PatientResponse)
def update_patient_treatment(patient_id: str, treatment: TreatmentUpdate):
    """Update patient treatment information"""
    existing = get_patient(patient_id)

    update_data = treatment.dict(exclude_unset=True)
    update_data["updatedAt"] = get_timestamp()

    for key, value in update_data.items():
        if value is not None:
            existing[key] = value

    if db:
        db.collection('patients').document(patient_id).update(update_data)
    else:
        patients_db[patient_id] = existing

    return existing

@app.get("/api/patients/treatment-stats")
def get_treatment_stats():
    """Get treatment statistics"""
    patients = list(patients_db.values()) if not db else [doc.to_dict() for doc in db.collection('patients').stream()]

    stats = {
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
        "failed": 0
    }

    for patient in patients:
        status = patient.get('treatmentStatus', 'pending')
        if status in stats:
            stats[status] += 1
        else:
            stats['pending'] += 1

    return stats

@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: str):
    """Delete patient"""
    if db:
        db.collection('patients').document(patient_id).delete()

    if patient_id in patients_db:
        del patients_db[patient_id]

    return {"message": "Patient deleted successfully"}

# ============= Test Endpoints =============

@app.get("/api/tests", response_model=List[TestResponse])
def get_tests(patient_id: str = None):
    """Get all tests, optionally filtered by patient"""
    if db:
        if patient_id:
            docs = db.collection('tests').where('patientId', '==', patient_id).stream()
        else:
            docs = db.collection('tests').stream()
        tests = [doc.to_dict() for doc in docs]

        # Add patient names
        for test in tests:
            if db:
                patient_doc = db.collection('patients').document(test['patientId']).get()
                if patient_doc.exists:
                    test['patientName'] = patient_doc.to_dict().get('name', 'Unknown')
        return tests

    tests = list(tests_db.values())
    if patient_id:
        tests = [t for t in tests if t['patientId'] == patient_id]

    # Add patient names from in-memory db
    for test in tests:
        patient = patients_db.get(test['patientId'], {})
        test['patientName'] = patient.get('name', 'Unknown')

    return tests

@app.get("/api/tests/{test_id}", response_model=TestResponse)
def get_test(test_id: str):
    """Get test by ID"""
    if db:
        doc = db.collection('tests').document(test_id).get()
        if doc.exists:
            test = doc.to_dict()
            patient_doc = db.collection('patients').document(test['patientId']).get()
            if patient_doc.exists:
                test['patientName'] = patient_doc.to_dict().get('name', 'Unknown')
            return test

    if test_id in tests_db:
        test = tests_db[test_id]
        patient = patients_db.get(test['patientId'], {})
        test['patientName'] = patient.get('name', 'Unknown')
        return test

    raise HTTPException(status_code=404, detail="Test not found")

@app.post("/api/tests", response_model=TestResponse)
def create_test(test: TestCreate, authorization: str = None):
    """Create new test and analyze signal"""
    test_id = generate_id()
    timestamp = get_timestamp()

    # Analyze the binary signal
    analysis = analyze_signal(test.binarySignal)

    # Determine if confirmation is required (positive results need confirmation)
    needs_confirmation = analysis['prediction'] == 'Positive'

    test_data = {
        "id": test_id,
        "patientId": test.patientId,
        "binarySignal": test.binarySignal,
        "signalLength": len(test.binarySignal.split(',')),
        "prediction": analysis['prediction'],
        "confidence": analysis['confidence'],
        "nanopaperColor": analysis['nanopaper_color'],
        "imageUrl": test.imageUrl or "",
        "createdAt": timestamp,
        "analyzedAt": timestamp,
        "needsConfirmation": needs_confirmation,
        "confirmed": False,
        "confirmedBy": "",
        "confirmedAt": ""
    }

    if db:
        save_to_firebase('tests', test_data)
    else:
        tests_db[test_id] = test_data

    # Get patient name
    patient = get_patient(test.patientId)
    test_data['patientName'] = patient.get('name', 'Unknown')

    # Create notification for new test
    if needs_confirmation:
        create_notification(NotificationCreate(
            userId="",
            title="Test Confirmation Required",
            message=f"New positive test #{test_id[:8]} requires confirmation",
            type="warning"
        ))

    return test_data

@app.post("/api/tests/confirm")
def confirm_test(request: TestConfirmRequest):
    """Confirm a test result (required for positive results)"""
    test = get_test(request.testId)

    if not test.get('needsConfirmation', False):
        raise HTTPException(status_code=400, detail="This test does not require confirmation")

    if test.get('confirmed', False):
        raise HTTPException(status_code=400, detail="This test has already been confirmed")

    test['confirmed'] = True
    test['confirmedBy'] = request.confirmedBy
    test['confirmedAt'] = get_timestamp()

    if db:
        db.collection('tests').document(request.testId).update({
            'confirmed': True,
            'confirmedBy': request.confirmedBy,
            'confirmedAt': get_timestamp()
        })
    else:
        tests_db[request.testId] = test

    return {
        "message": "Test confirmed successfully",
        "test": test
    }

@app.post("/api/tests/analyze")
def analyze_test_signal(request: AnalysisRequest):
    """Analyze binary signal without saving"""
    analysis = analyze_signal(request.binarySignal)
    stats = get_detector().get_signal_stats(request.binarySignal)

    return {
        "analysis": analysis,
        "stats": stats
    }

@app.post("/api/tests/generate-random")
def generate_random_test_signal():
    """Generate random binary signal for testing/demo"""
    signal = generate_random_signal()
    analysis = analyze_signal(signal)

    return {
        "binarySignal": signal,
        "signalLength": len(signal.split(',')),
        "analysis": analysis
    }

# ============= Report Endpoints =============

@app.get("/api/reports")
def get_reports():
    """Get all reports"""
    if db:
        docs = db.collection('reports').stream()
        return [doc.to_dict() for doc in docs]

    return list(reports_db.values())

@app.post("/api/reports/generate-pdf")
def generate_pdf_report(request: ReportGenerate):
    """Generate PDF report for patient test"""
    # Get test and patient data
    test = get_test(request.testId)
    patient = get_patient(request.patientId)

    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0F766E'),
        spaceAfter=30
    )
    story.append(Paragraph("H. pylori Detection Report", title_style))
    story.append(Spacer(1, 20))

    # Patient Information
    story.append(Paragraph("Patient Information", styles['Heading2']))
    patient_data = [
        ['Name:', patient['name']],
        ['Age:', str(patient['age'])],
        ['Gender:', patient['gender']],
        ['Email:', patient.get('email', 'N/A')],
        ['Phone:', patient.get('phone', 'N/A')],
    ]
    t = Table(patient_data, colWidths=[120, 300])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Test Results
    story.append(Paragraph("Test Results", styles['Heading2']))
    result_color = colors.green if test['prediction'] == 'Negative' else colors.red
    result_data = [
        ['Test ID:', test['id'][:8] + '...'],
        ['Date:', test['analyzedAt']],
        ['Result:', test['prediction']],
        ['Confidence:', f"{test['confidence']}%"],
        ['Nanopaper Color:', test['nanopaperColor']],
    ]
    t2 = Table(result_data, colWidths=[120, 300])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (1, 2), (1, 2), result_color),
    ]))
    story.append(t2)
    story.append(Spacer(1, 20))

    # Diagnosis
    story.append(Paragraph("Diagnosis", styles['Heading2']))
    diagnosis = "No H. pylori infection detected." if test['prediction'] == 'Negative' else "H. pylori infection DETECTED."
    story.append(Paragraph(diagnosis, styles['Normal']))
    story.append(Spacer(1, 30))

    # Footer
    story.append(Paragraph("This is a computer-generated report.", styles['Italic']))
    story.append(Paragraph(f"Generated on: {get_timestamp()}", styles['Italic']))

    doc.build(story)

    # Save to storage
    report_id = generate_id()
    buffer.seek(0)

    if bucket:
        try:
            blob = bucket.blob(f'reports/{report_id}.pdf')
            blob.upload_from_file(buffer, content_type='application/pdf')
            download_url = blob.public_url
        except Exception as e:
            print(f"Storage error: {e}")
            download_url = f"data:application/pdf;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    else:
        download_url = f"data:application/pdf;base64,{base64.b64encode(buffer.getvalue()).decode()}"

    # Save report metadata
    report_data = {
        "id": report_id,
        "patientId": request.patientId,
        "testId": request.testId,
        "format": "PDF",
        "downloadUrl": download_url,
        "generatedAt": get_timestamp()
    }

    if db:
        save_to_firebase('reports', report_data)
    else:
        reports_db[report_id] = report_data

    return report_data

@app.post("/api/reports/generate-csv")
def generate_csv_report(request: ReportGenerate):
    """Generate CSV report for patient test"""
    test = get_test(request.testId)
    patient = get_patient(request.patientId)

    # Create CSV content
    csv_data = [
        ["H. pylori Detection Report"],
        [""],
        ["Patient Information"],
        ["Name", patient['name']],
        ["Age", patient['age']],
        ["Gender", patient['gender']],
        ["Email", patient.get('email', '')],
        ["Phone", patient.get('phone', '')],
        [""],
        ["Test Results"],
        ["Test ID", test['id']],
        ["Date", test['analyzedAt']],
        ["Result", test['prediction']],
        ["Confidence", f"{test['confidence']}%"],
        ["Nanopaper Color", test['nanopaperColor']],
        ["Binary Signal", test['binarySignal']],
    ]

    # Convert to CSV string
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerows(csv_data)
    csv_string = csv_buffer.getvalue()

    report_id = generate_id()

    if bucket:
        try:
            blob = bucket.blob(f'reports/{report_id}.csv')
            blob.upload_from_string(csv_string, content_type='text/csv')
            download_url = blob.public_url
        except Exception as e:
            print(f"Storage error: {e}")
            download_url = f"data:text/csv;base64,{base64.b64encode(csv_string.encode()).decode()}"
    else:
        download_url = f"data:text/csv;base64,{base64.b64encode(csv_string.encode()).decode()}"

    report_data = {
        "id": report_id,
        "patientId": request.patientId,
        "testId": request.testId,
        "format": "CSV",
        "downloadUrl": download_url,
        "generatedAt": get_timestamp()
    }

    if db:
        save_to_firebase('reports', report_data)
    else:
        reports_db[report_id] = report_data

    return report_data

# ============= Analytics Endpoints =============

@app.get("/api/analytics/summary")
def get_analytics_summary():
    """Get summary statistics"""
    if db:
        tests = list(db.collection('tests').stream())
        tests_data = [t.to_dict() for t in tests]
    else:
        tests_data = list(tests_db.values())

    total = len(tests_data)
    positive = sum(1 for t in tests_data if t.get('prediction') == 'Positive')
    negative = sum(1 for t in tests_data if t.get('prediction') == 'Negative')
    pending = sum(1 for t in tests_data if t.get('prediction') == 'Pending')

    return {
        "totalTests": total,
        "positiveCases": positive,
        "negativeCases": negative,
        "pendingTests": pending,
        "infectionRate": round((positive / total * 100) if total > 0 else 0, 2)
    }

@app.get("/api/analytics/trends")
def get_analytics_trends():
    """Get trend data for charts"""
    if db:
        tests = list(db.collection('tests').stream())
        tests_data = [t.to_dict() for t in tests]
    else:
        tests_data = list(tests_db.values())

    # Group by date
    date_counts = {}
    for test in tests_data:
        date = test.get('analyzedAt', '')[:10]
        if date:
            if date not in date_counts:
                date_counts[date] = {'positive': 0, 'negative': 0, 'total': 0}
            date_counts[date]['total'] += 1
            if test.get('prediction') == 'Positive':
                date_counts[date]['positive'] += 1
            else:
                date_counts[date]['negative'] += 1

    # Sort by date and take last 30 days
    sorted_dates = sorted(date_counts.keys())[-30:]

    return {
        "labels": sorted_dates,
        "positive": [date_counts[d]['positive'] for d in sorted_dates],
        "negative": [date_counts[d]['negative'] for d in sorted_dates],
        "total": [date_counts[d]['total'] for d in sorted_dates]
    }

# ============= Appointment Endpoints =============

class AppointmentCreate(BaseModel):
    patientId: str
    date: str
    time: str
    notes: str = ""

class AppointmentUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patientId: str
    patientName: str
    date: str
    time: str
    notes: str
    status: str
    createdAt: str

@app.get("/api/appointments", response_model=List[AppointmentResponse])
def get_appointments(patient_id: str = None):
    """Get all appointments, optionally filtered by patient"""
    appointments = list(appointments_db.values())
    if patient_id:
        appointments = [a for a in appointments if a['patientId'] == patient_id]

    # Add patient names
    for apt in appointments:
        patient = patients_db.get(apt['patientId'], {})
        apt['patientName'] = patient.get('name', 'Unknown')

    return appointments

@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate):
    """Create new appointment"""
    appointment_id = generate_id()
    timestamp = get_timestamp()

    appointment_data = {
        "id": appointment_id,
        "patientId": appointment.patientId,
        "date": appointment.date,
        "time": appointment.time,
        "notes": appointment.notes,
        "status": "Scheduled",
        "createdAt": timestamp
    }

    appointments_db[appointment_id] = appointment_data

    # Get patient name
    patient = patients_db.get(appointment.patientId, {})
    appointment_data['patientName'] = patient.get('name', 'Unknown')

    return appointment_data

@app.put("/api/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: str, appointment: AppointmentUpdate):
    """Update appointment"""
    if appointment_id not in appointments_db:
        raise HTTPException(status_code=404, detail="Appointment not found")

    existing = appointments_db[appointment_id]
    update_data = appointment.dict(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            existing[key] = value

    appointments_db[appointment_id] = existing

    # Get patient name
    patient = patients_db.get(existing['patientId'], {})
    existing['patientName'] = patient.get('name', 'Unknown')

    return existing

@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: str):
    """Delete appointment"""
    if appointment_id in appointments_db:
        del appointments_db[appointment_id]
        return {"message": "Appointment deleted successfully"}
    raise HTTPException(status_code=404, detail="Appointment not found")

# ============= Chatbot Endpoints =============

@app.post("/api/chat")
def chat_with_bot(message: ChatMessage):
    """AI chatbot using Google Gemini for doctor interaction"""
    import os

    # ============================================================
    # PUT YOUR GEMINI API KEY HERE
    # Get free key at: https://aistudio.google.com/app/apikey
    # ============================================================
    GEMINI_API_KEY ="AIzaSyAba8OgDF860dQ6rIQOluh2-wsTlBvPkys" # Replace with your key like: "AIzaSyxxxxx"
    # ============================================================

    # Check if Gemini API key is configured
    # Use keyword-based responses (works without API key)
    msg = message.message.lower()

    # Enhanced rule-based responses with more keywords
    responses = {
        "hello": {
            "keywords": ["hello", "hi", "hey", "greetings", "good morning", "good evening"],
            "response": "Hello! I'm the H. pylori Detection Assistant. How can I help you today?"
        },
        "what is h pylori": {
            "keywords": ["what is h pylori", "what is helicobacter", "what is pylori", "explain h pylori", "about h pylori", "h pylori definition", "bacteria"],
            "response": "H. pylori (Helicobacter pylori) is a bacteria that infects the stomach lining and can cause ulcers, gastritis, and even stomach cancer. It's one of the most common bacterial infections worldwide, affecting about half of the world's population."
        },
        "h pylori symptoms": {
            "keywords": ["symptom", "signs", "what are the symptoms", "how do i know", "infection signs", "stomach pain", "bloating", "nausea", "indigestion", "burning stomach"],
            "response": "Common H. pylori symptoms include: stomach pain or burning, bloating, nausea, loss of appetite, frequent burping, unexplained weight loss, and feeling full after eating small amounts. However, many people with H. pylori have no symptoms at all."
        },
        "how does the test work": {
            "keywords": ["test", "how does it work", "detection", "diagnosis", "how do you detect", "nanopaper", "signal", "analysis", "binary"],
            "response": "Our system uses immunoplasmonic nanopaper that changes color when exposed to saliva samples containing H. pylori antibodies. The color change is converted to binary signals (0/1) which our AI model analyzes. Yellow = No infection, Brown/Purple = Infection detected. The system achieves high accuracy in detection."
        },
        "treatment": {
            "keywords": ["treatment", "cure", "medicine", "antibiotic", "therapy", "how to treat", "eradication", "triple therapy", "quadruple therapy"],
            "response": "H. pylori treatment typically involves a combination of antibiotics (like amoxicillin, clarithromycin) and proton pump inhibitors (PPIs). This is called eradication therapy. Treatment usually lasts 10-14 days. Always consult with a gastroenterologist for proper diagnosis and treatment plan."
        },
        "prevention": {
            "keywords": ["prevent", "prevention", "avoid", "stop infection", "how to prevent", "hygiene", "wash hands"],
            "response": "To prevent H. pylori infection: wash hands frequently with soap, drink clean safe water, avoid eating contaminated food, don't share utensils, and maintain good personal hygiene. There's no vaccine, so prevention through hygiene is important."
        },
        "accuracy": {
            "keywords": ["accuracy", "accurate", "reliable", "correct", "confidence", "precision", "true positive", "false negative"],
            "response": "Our AI model achieves high accuracy in detecting H. pylori infection from the nanopaper color change signals. The system uses machine learning to analyze binary signals with high sensitivity and specificity. However, results should always be confirmed by a healthcare professional."
        },
        "risk factors": {
            "keywords": ["risk", "cancer", "ulcer", "danger", "complication", "gastric cancer", "stomach cancer"],
            "response": "H. pylori can lead to serious complications if untreated: gastric ulcers, duodenal ulcers, gastric cancer, and MALT lymphoma. It's considered a major risk factor for stomach cancer. Early detection and treatment is important to prevent these complications."
        },
        "transmission": {
            "keywords": ["spread", "transmit", "contagious", "how does it spread", "transmission", "infection route", "caught"],
            "response": "H. pylori is believed to spread through contaminated food, water, and direct contact with infected persons. It's more common in areas with poor sanitation and crowded living conditions. Family members of infected individuals are at higher risk."
        },
        "testing": {
            "keywords": ["test", "testing", "diagnosis", "detect", "screen", "check", "confirm"],
            "response": "H. pylori can be detected through several methods: 1) Endoscopy with biopsy, 2) Urea breath test, 3) Stool antigen test, 4) Blood antibody test. Our system uses immunoplasmonic nanopaper analysis which provides quick results."
        },
    }

    # Try exact keyword match first
    for key, data in responses.items():
        for keyword in data["keywords"]:
            if keyword in msg:
                return {"response": data["response"], "timestamp": get_timestamp()}

    # If no match, provide a helpful default response
    default_responses = [
        "I understand you have a question about H. pylori. Please ask about symptoms, treatment, prevention, testing, or how our detection system works.",
        "That's a great question! I can help with information about H. pylori symptoms, treatment, prevention, diagnosis, or our detection system. What would you like to know?",
        "I'd be happy to help! You can ask me about H. pylori infection, symptoms, treatment options, prevention methods, or how our AI detection system works.",
    ]
    import random
    return {"response": random.choice(default_responses), "timestamp": get_timestamp()}

# ============= Batch Testing Endpoints =============

class BatchTestRequest(BaseModel):
    patientId: str
    signals: List[str]

@app.post("/api/tests/batch")
def batch_create_tests(request: BatchTestRequest):
    """Create multiple tests at once"""
    results = []

    for signal in request.signals:
        test_id = generate_id()
        timestamp = get_timestamp()

        analysis = analyze_signal(signal)

        test_data = {
            "id": test_id,
            "patientId": request.patientId,
            "binarySignal": signal,
            "signalLength": len(signal.split(',')),
            "prediction": analysis['prediction'],
            "confidence": analysis['confidence'],
            "nanopaperColor": analysis['nanopaper_color'],
            "imageUrl": "",
            "createdAt": timestamp,
            "analyzedAt": timestamp
        }

        tests_db[test_id] = test_data
        results.append(test_data)

    # Get patient name
    patient = patients_db.get(request.patientId, {})
    patient_name = patient.get('name', 'Unknown')
    for r in results:
        r['patientName'] = patient_name

    return {
        "message": f"Created {len(results)} tests",
        "tests": results
    }

@app.get("/api/tests/{test_id}/compare")
def compare_test(test_id: str):
    """Compare a test with previous tests of the same patient"""
    if test_id not in tests_db:
        raise HTTPException(status_code=404, detail="Test not found")

    test = tests_db[test_id]
    patient_id = test['patientId']

    # Get all tests for this patient
    patient_tests = [
        t for t in tests_db.values()
        if t['patientId'] == patient_id
    ]

    # Sort by date
    patient_tests.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

    return {
        "currentTest": test,
        "history": patient_tests[:10]
    }

# ============= Image Analysis Endpoints =============

@app.post("/api/tests/analyze-image")
def analyze_image(file: UploadFile = File(...)):
    """Analyze nanopaper image (simulated)"""
    signal = generate_random_signal()
    analysis = analyze_signal(signal)

    return {
        "analysis": analysis,
        "signal": signal,
        "message": "Image analyzed (simulated)"
    }

# ============= Fake Data Generation =============

@app.post("/api/generate-fake-data")
def generate_fake_data(num_patients: int = 50):
    """Generate fake patient data for training/demo"""
    import random

    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
                   "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
                   "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
                   "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
                   "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
                   "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa"]

    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
                  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
                  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

    genders = ["Male", "Female", "Other"]
    domains = ["gmail.com", "yahoo.com", "outlook.com", "email.com"]

    created_patients = 0

    for i in range(num_patients):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        name = f"{first_name} {last_name}"

        patient_data = {
            "id": generate_id(),
            "name": name,
            "age": random.randint(18, 80),
            "gender": random.choice(genders),
            "email": f"{first_name.lower()}.{last_name.lower()}{i}@{random.choice(domains)}",
            "phone": f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "address": f"{random.randint(1,999)} {random.choice(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} Street, {random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])}",
            "createdAt": get_timestamp(),
            "updatedAt": get_timestamp()
        }

        if db:
            save_to_firebase('patients', patient_data)
        else:
            patients_db[patient_data['id']] = patient_data

        created_patients += 1

        # Create 1-3 tests per patient
        num_tests = random.randint(1, 3)
        for _ in range(num_tests):
            # Generate random signal (weighted towards negative for realism)
            if random.random() < 0.3:  # 30% positive
                signal = ','.join([str(random.randint(0, 1)) for _ in range(100)])
                signal = ''.join(['1' if random.random() < 0.6 else '0' for _ in range(100)])
            else:
                signal = ','.join([str(random.randint(0, 1)) for _ in range(100)])
                signal = ''.join(['0' if random.random() < 0.6 else '1' for _ in range(100)])

            signal = ','.join(list(signal))

            analysis = analyze_signal(signal)

            test_data = {
                "id": generate_id(),
                "patientId": patient_data['id'],
                "binarySignal": signal,
                "signalLength": 100,
                "prediction": analysis['prediction'],
                "confidence": analysis['confidence'],
                "nanopaperColor": analysis['nanopaper_color'],
                "imageUrl": "",
                "createdAt": get_timestamp(),
                "analyzedAt": get_timestamp()
            }

            if db:
                save_to_firebase('tests', test_data)
            else:
                tests_db[test_data['id']] = test_data

    return {
        "message": f"Successfully generated {created_patients} fake patients with tests",
        "patientsCreated": created_patients
    }

# ============= Notification Endpoints =============

def create_notification(notification: NotificationCreate):
    """Helper to create notification"""
    notif_id = generate_id()
    notif_data = {
        "id": notif_id,
        "userId": notification.userId,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "read": False,
        "createdAt": get_timestamp()
    }

    if db:
        save_to_firebase('notifications', notif_data)
    else:
        notifications_db[notif_id] = notif_data

    return notif_data

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(user_id: str = None):
    """Get notifications for current user"""
    notifications = list(notifications_db.values())
    if user_id:
        notifications = [n for n in notifications if n.get('userId') == user_id or n.get('userId') == ""]

    notifications.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    return notifications

@app.post("/api/notifications/mark-read/{notification_id}")
def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    if notification_id in notifications_db:
        notifications_db[notification_id]['read'] = True
        return {"message": "Notification marked as read"}

    if db:
        db.collection('notifications').document(notification_id).update({'read': True})
        return {"message": "Notification marked as read"}

    raise HTTPException(status_code=404, detail="Notification not found")

@app.post("/api/notifications", response_model=NotificationResponse)
def create_notification_endpoint(notification: NotificationCreate):
    """Create a new notification"""
    return create_notification(notification)

# ============= QR Code Caching =============

# Simple in-memory cache for QR codes
qr_code_cache = {}
QR_CACHE_TTL = 300  # Cache for 5 minutes

# ============= QR Code Endpoints =============

# Generate a secure token for patient QR codes
def generate_patient_token(patient_id: str) -> str:
    """Generate a secure token for patient QR code"""
    import hashlib
    timestamp = str(datetime.now().timestamp())
    data = f"{patient_id}-{timestamp}-{SECRET_KEY}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]

@app.get("/api/qrcode/patient/{patient_id}", response_model=QRCodeResponse)
def generate_patient_qr(patient_id: str, request: Request = None):
    """Generate QR code for patient ID with secure token"""
    import time
    # Always use FRONTEND_URL from environment
    base_url = FRONTEND_URL

    # Check cache first
    cache_key = f"patient_{patient_id}_{base_url}"
    if cache_key in qr_code_cache:
        cached_data, cached_time = qr_code_cache[cache_key]
        if time.time() - cached_time < QR_CACHE_TTL:
            return QRCodeResponse(qrCode=cached_data)

    # Generate unique token for this patient
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Generate or get existing token
    patient_token = patient.get('scanToken')
    if not patient_token:
        patient_token = generate_patient_token(patient_id)
        patient['scanToken'] = patient_token
        patients_db[patient_id] = patient

    qr = qrcode.QRCode(version=None, box_size=6, border=2, error_correction=qrcode.constants.ERROR_CORRECT_L)
    # Use /scan route with token for secure access
    qr.add_data(f"{base_url}/scan/{patient_id}?token={patient_token}")
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    qr_code = base64.b64encode(buffer.getvalue()).decode()
    qr_code_data = f"data:image/png;base64,{qr_code}"

    # Cache the result
    qr_code_cache[cache_key] = (qr_code_data, time.time())

    return QRCodeResponse(qrCode=qr_code_data)

@app.get("/api/qrcode/test/{test_id}", response_model=QRCodeResponse)
def generate_test_qr(test_id: str, request: Request = None):
    """Generate QR code for test ID with secure token"""
    import time
    # Always use FRONTEND_URL from environment
    base_url = FRONTEND_URL

    # Check cache first
    cache_key = f"test_{test_id}_{base_url}"
    if cache_key in qr_code_cache:
        cached_data, cached_time = qr_code_cache[cache_key]
        if time.time() - cached_time < QR_CACHE_TTL:
            return QRCodeResponse(qrCode=cached_data)

    qr = qrcode.QRCode(version=None, box_size=6, border=2, error_correction=qrcode.constants.ERROR_CORRECT_L)
    test = tests_db.get(test_id)
    if test and test.get('patientId'):
        patient = patients_db.get(test['patientId'])
        patient_token = patient.get('scanToken') if patient else None
        if not patient_token:
            patient_token = generate_patient_token(test['patientId'])
            if patient:
                patient['scanToken'] = patient_token
                patients_db[test['patientId']] = patient
        # Use /scan route with token
        qr.add_data(f"{base_url}/scan/{test['patientId']}/{test_id}?token={patient_token}")
    else:
        qr.add_data(f"{base_url}/scan")
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    qr_code = base64.b64encode(buffer.getvalue()).decode()
    qr_code_data = f"data:image/png;base64,{qr_code}"

    # Cache the result
    qr_code_cache[cache_key] = (qr_code_data, time.time())

    return QRCodeResponse(qrCode=qr_code_data)

# ============= Public Scan Endpoints (No Auth Required) =============

@app.get("/api/scan/patient/{patient_id}")
def scan_patient(patient_id: str, token: str = None):
    """Get patient data for QR code scanning - token required"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify token if present
    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    # Get patient's tests
    patient_tests = [
        {
            "id": test_id,
            "patientId": test["patientId"],
            "testType": test.get("testType", "Nanopaper"),
            "prediction": test.get("prediction", "Pending"),
            "confidence": test.get("confidence", 0),
            "nanopaperColor": test.get("nanopaperColor", "Unknown"),
            "analyzedAt": test.get("analyzedAt", "N/A"),
            "confirmed": test.get("confirmed", False),
            "binarySignal": test.get("binarySignal", ""),
            "signalLength": test.get("signalLength", 0)
        }
        for test_id, test in tests_db.items()
        if test.get("patientId") == patient_id
    ]
    # Sort by date (newest first)
    patient_tests.sort(key=lambda x: x["analyzedAt"], reverse=True)

    # Calculate microbiome analysis based on test result
    latest_test = patient_tests[0] if patient_tests else None
    is_positive = latest_test and latest_test.get("prediction") == "Positive"

    # Calculate good/bad bacteria proportions
    if is_positive:
        # H. pylori positive - bad bacteria dominant
        good_bacteria = round(random.uniform(3, 20), 1)  # 3-20%
        bad_bacteria = round(100 - good_bacteria, 1)
        microbiome_status = "Infection Detected"
    elif latest_test and latest_test.get("prediction") == "Negative":
        # Healthy - good bacteria dominant
        good_bacteria = round(random.uniform(75, 90), 1)  # 75-90%
        bad_bacteria = round(100 - good_bacteria, 1)
        microbiome_status = "Healthy"
    else:
        # No tests yet
        good_bacteria = 80
        bad_bacteria = 20
        microbiome_status = "No Test Data"

    microbiome = {
        "status": microbiome_status,
        "good_bacteria_percent": good_bacteria,
        "bad_bacteria_percent": bad_bacteria,
        "description": f"Good bacteria: {good_bacteria}%, Bad bacteria: {bad_bacteria}%"
    }

    return {
        "patient": {
            "id": patient.get("id"),
            "name": patient.get("name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "email": patient.get("email", ""),
            "phone": patient.get("phone", "")
        },
        "tests": patient_tests,
        "microbiome": microbiome
    }

# ============= Patient Appointment Booking (No Auth) =============

class PatientAppointmentCreate(BaseModel):
    patientId: str
    patientName: str
    phone: str
    email: str
    date: str
    time: str
    notes: str = ""

@app.post("/api/scan/appointment", response_model=AppointmentResponse)
def create_patient_appointment(appointment: PatientAppointmentCreate):
    """Patient books an appointment without login"""
    appointment_id = generate_id()
    timestamp = get_timestamp()

    appointment_data = {
        "id": appointment_id,
        "patientId": appointment.patientId,
        "patientName": appointment.patientName,
        "phone": appointment.phone,
        "email": appointment.email,
        "date": appointment.date,
        "time": appointment.time,
        "notes": appointment.notes,
        "status": "Pending",
        "createdAt": timestamp
    }

    appointments_db[appointment_id] = appointment_data

    # Create notification for admin
    notification_id = generate_id()
    notifications_db[notification_id] = {
        "id": notification_id,
        "type": "appointment_request",
        "title": "New Appointment Request",
        "message": f"{appointment.patientName} requested an appointment for {appointment.date} at {appointment.time}",
        "read": False,
        "createdAt": timestamp
    }

    return appointment_data

# ============= Patient Self-Registration =============

class PatientSelfRegister(BaseModel):
    patientId: str
    name: str
    email: str
    phone: str
    password: str

@app.post("/api/scan/register")
def patient_self_register(request: PatientSelfRegister):
    """Patient creates their own portal account"""
    # Check if patient exists
    patient = patients_db.get(request.patientId)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check if portal account already exists
    if request.patientId in patient_portal_db:
        raise HTTPException(status_code=400, detail="Account already exists")

    # Create portal account
    password_hash = get_password_hash(request.password)
    patient_portal_db[request.patientId] = {
        "patientId": request.patientId,
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "password": password_hash,
        "createdAt": get_timestamp()
    }

    # Generate scan token for patient
    patient['scanToken'] = generate_patient_token(request.patientId)
    patients_db[request.patientId] = patient

    return {"message": "Account created successfully", "patientId": request.patientId}

# ============= Send Result Notification =============

@app.post("/api/scan/notify")
def send_result_notification(patient_id: str):
    """Send notification to patient about new test results"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get latest test
    patient_tests = [t for t in tests_db.values() if t.get("patientId") == patient_id]
    if not patient_tests:
        raise HTTPException(status_code=404, detail="No tests found")

    latest_test = max(patient_tests, key=lambda x: x.get("analyzedAt", ""))

    # Create notification (simulated SMS/Email)
    notification_id = generate_id()
    notifications_db[notification_id] = {
        "id": notification_id,
        "type": "test_result",
        "title": "Test Result Available",
        "message": f"Hi {patient.get('name')}, your H. pylori test result is ready. Result: {latest_test.get('prediction')}",
        "patientId": patient_id,
        "email": patient.get("email", ""),
        "phone": patient.get("phone", ""),
        "sent": True,
        "createdAt": get_timestamp()
    }

    return {"message": "Notification sent successfully", "notificationId": notification_id}

# ============= PDF Report for Scan =============

@app.get("/api/scan/patient/{patient_id}/report")
def generate_scan_report(patient_id: str, token: str = None):
    """Generate PDF report for patient (no auth required)"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify token
    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    # Get patient's tests
    patient_tests = [
        {
            "id": test_id,
            "testType": test.get("testType", "Nanopaper"),
            "prediction": test.get("prediction", "Pending"),
            "confidence": test.get("confidence", 0),
            "nanopaperColor": test.get("nanopaperColor", "Unknown"),
            "analyzedAt": test.get("analyzedAt", "N/A"),
            "confirmed": test.get("confirmed", False),
            "notes": test.get("notes", ""),
            "prescription": test.get("prescription", "")
        }
        for test_id, test in tests_db.items()
        if test.get("patientId") == patient_id
    ]
    patient_tests.sort(key=lambda x: x["analyzedAt"], reverse=True)

    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("H. pylori Test Report", styles['Title']))
    elements.append(Spacer(1, 20))

    # Patient Info
    elements.append(Paragraph("Patient Information", styles['Heading2']))
    patient_info = [
        ["Name:", patient.get("name", "N/A")],
        ["ID:", patient.get("id", "N/A")],
        ["Age:", str(patient.get("age", "N/A"))],
        ["Gender:", patient.get("gender", "N/A")],
        ["Email:", patient.get("email", "N/A")],
        ["Phone:", patient.get("phone", "N/A")]
    ]
    t = Table(patient_info, colWidths=[100, 300])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Test Results
    elements.append(Paragraph("Test Results", styles['Heading2']))
    for test in patient_tests:
        elements.append(Paragraph(
            f"Test Date: {test['analyzedAt']} | Type: {test['testType']} | "
            f"Result: {test['prediction']} | Confidence: {test['confidence']}%",
            styles['Normal']
        ))
        if test.get('notes'):
            elements.append(Paragraph(f"Notes: {test['notes']}", styles['Normal']))
        if test.get('prescription'):
            elements.append(Paragraph(f"Prescription: {test['prescription']}", styles['Normal']))
        elements.append(Spacer(1, 10))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Report generated on {get_timestamp()}",
        styles['Normal']
    ))

    doc.build(elements)
    buffer.seek(0)

    return {
        "filename": f"hpylori_report_{patient_id}.pdf",
        "content": base64.b64encode(buffer.getvalue()).decode()
    }

# ============= Doctor Notes & Prescriptions =============

class DoctorNotesUpdate(BaseModel):
    notes: str = ""
    prescription: str = ""

@app.put("/api/scan/test/{test_id}/notes")
def update_test_notes(test_id: str, notes: DoctorNotesUpdate):
    """Update test notes and prescription (doctor only)"""
    test = tests_db.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if notes.notes:
        test['notes'] = notes.notes
    if notes.prescription:
        test['prescription'] = notes.prescription
    test['updatedAt'] = get_timestamp()
    tests_db[test_id] = test

    return {"message": "Notes updated", "test": test}

# ============= Medication Reminders =============

class MedicationReminder(BaseModel):
    patientId: str
    medication: str
    dosage: str
    frequency: str
    duration: str

medication_reminders_db = {}

@app.post("/api/scan/reminder")
def create_medication_reminder(reminder: MedicationReminder):
    """Create medication reminder for patient"""
    reminder_id = generate_id()
    medication_reminders_db[reminder_id] = {
        "id": reminder_id,
        "patientId": reminder.patientId,
        "medication": reminder.medication,
        "dosage": reminder.dosage,
        "frequency": reminder.frequency,
        "duration": reminder.duration,
        "createdAt": get_timestamp(),
        "active": True
    }
    return {"message": "Reminder created", "reminderId": reminder_id}

@app.get("/api/scan/patient/{patient_id}/reminders")
def get_patient_reminders(patient_id: str, token: str = None):
    """Get medication reminders for patient"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    reminders = [r for r in medication_reminders_db.values() if r.get("patientId") == patient_id and r.get("active")]
    return {"reminders": reminders}

# ============= Patient Feedback =============

class PatientFeedback(BaseModel):
    patientId: str
    rating: int
    comment: str

feedback_db = {}

@app.post("/api/scan/feedback")
def submit_patient_feedback(feedback: PatientFeedback):
    """Submit patient feedback"""
    feedback_id = generate_id()
    feedback_db[feedback_id] = {
        "id": feedback_id,
        "patientId": feedback.patientId,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "createdAt": get_timestamp()
    }
    return {"message": "Feedback submitted", "feedbackId": feedback_id}

# ============= Emergency Info =============

emergency_info = {
    "hotline": "1999",
    "emergency_contact": "+94 11 269 1111",
    "treatment_centers": [
        {"name": "National Hospital of Sri Lanka", "phone": "+94 11 269 1111"},
        {"name": "Teaching Hospital Anuradhapura", "phone": "+94 25 222 2235"},
        {"name": "Teaching Hospital Kandy", "phone": "+94 81 222 2231"}
    ],
    "treatment_info": {
        "positive": "If tested positive, please consult a doctor immediately. Treatment typically involves a 14-day course of antibiotics.",
        "negative": "No H. pylori infection detected. Continue maintaining good hygiene practices."
    }
}

@app.get("/api/scan/emergency")
def get_emergency_info():
    """Get emergency information"""
    return emergency_info

# ============= Infection Statistics =============

@app.get("/api/scan/statistics")
def get_infection_statistics():
    """Get infection statistics for display"""
    total_tests = len(tests_db)
    positive = sum(1 for t in tests_db.values() if t.get("prediction") == "Positive")
    negative = sum(1 for t in tests_db.values() if t.get("prediction") == "Negative")

    # Age group analysis
    age_groups = {"0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0}
    age_positive = {"0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0}
    for p in patients_db.values():
        age = p.get("age", 0)
        if age <= 18:
            age_groups["0-18"] += 1
            if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()):
                age_positive["0-18"] += 1
        elif age <= 35:
            age_groups["19-35"] += 1
            if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()):
                age_positive["19-35"] += 1
        elif age <= 50:
            age_groups["36-50"] += 1
            if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()):
                age_positive["36-50"] += 1
        elif age <= 65:
            age_groups["51-65"] += 1
            if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()):
                age_positive["51-65"] += 1
        else:
            age_groups["65+"] += 1
            if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()):
                age_positive["65+"] += 1

    # Location data (simulated)
    locations = []
    for p in patients_db.values():
        location = p.get("location", {})
        if location:
            locations.append({
                "lat": location.get("lat", 7.8731),
                "lng": location.get("lng", 80.7718),
                "prediction": "Positive" if any(t.get("patientId") == p.get("id") and t.get("prediction") == "Positive" for t in tests_db.values()) else "Negative"
            })

    return {
        "total_tests": total_tests,
        "positive": positive,
        "negative": negative,
        "positive_rate": round(positive / total_tests * 100, 1) if total_tests > 0 else 0,
        "age_groups": age_groups,
        "age_positive": age_positive,
        "locations": locations
    }

# ============= Sample Collection Guide =============

sample_guide = {
    "title": "Saliva Sample Collection Guide",
    "steps": [
        "Avoid eating or drinking for 30 minutes before sample collection",
        "Rinse your mouth with water",
        "Collect approximately 2ml of saliva in the provided container",
        "Ensure the sample is clear (avoid frothy saliva)",
        "Label the container with your patient ID",
        "Hand the sample to the lab technician"
    ],
    "video_url": None
}

@app.get("/api/scan/guide")
def get_sample_guide():
    """Get sample collection guide"""
    return sample_guide

# ============= Treatment Guide =============

treatment_guide = {
    "title": "H. pylori Treatment Guide",
    "if_positive": [
        {"day": "Days 1-14", "medication": "Amoxicillin 1g twice daily"},
        {"day": "Days 1-14", "medication": "Clarithromycin 500mg twice daily"},
        {"day": "Days 1-14", "medication": "PPI (Omeprazole 20mg twice daily)"},
        {"day": "Note", "medication": "Complete full course even if feeling better"}
    ],
    "if_negative": [
        "No treatment required",
        "Maintain good oral hygiene",
        "Avoid sharing utensils",
        "Regular dental check-ups"
    ],
    "diet_recommendations": [
        "Avoid spicy foods",
        "Limit caffeine and alcohol",
        "Eat probiotic foods",
        "Stay hydrated"
    ]
}

@app.get("/api/scan/treatment-guide")
def get_treatment_guide():
    """Get treatment guide"""
    return treatment_guide

# ============= Privacy PIN =============

class SetPIN(BaseModel):
    patientId: str
    pin: str

@app.post("/api/scan/pin")
def set_privacy_pin(request: SetPIN):
    """Set privacy PIN for patient"""
    patient = patients_db.get(request.patientId)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    import hashlib
    patient['privacyPin'] = hashlib.sha256(request.pin.encode()).hexdigest()
    patients_db[request.patientId] = patient
    return {"message": "PIN set successfully"}

@app.post("/api/scan/verify-pin")
def verify_pin(request: SetPIN):
    """Verify privacy PIN"""
    import hashlib
    patient = patients_db.get(request.patientId)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    stored_hash = patient.get('privacyPin')
    if not stored_hash:
        raise HTTPException(status_code=404, detail="PIN not set")

    input_hash = hashlib.sha256(request.pin.encode()).hexdigest()
    if input_hash != stored_hash:
        raise HTTPException(status_code=403, detail="Invalid PIN")

    return {"verified": True}

# ============= Test History Timeline =============

@app.get("/api/scan/patient/{patient_id}/timeline")
def get_patient_timeline(patient_id: str, token: str = None):
    """Get patient's test history as timeline"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    # Get all tests sorted by date
    timeline = []
    for test_id, test in tests_db.items():
        if test.get("patientId") == patient_id:
            timeline.append({
                "id": test_id,
                "date": test.get("analyzedAt", "N/A"),
                "timestamp": test.get("createdAt", ""),
                "type": test.get("testType", "Nanopaper"),
                "result": test.get("prediction", "Pending"),
                "confidence": test.get("confidence", 0),
                "confirmed": test.get("confirmed", False),
                "notes": test.get("notes", ""),
                "prescription": test.get("prescription", "")
            })

    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"timeline": timeline}

# ============= Re-test Reminders =============

class RetestReminder(BaseModel):
    patientId: str
    reminderDate: str

retest_reminders_db = {}

@app.post("/api/scan/retest-reminder")
def create_retest_reminder(reminder: RetestReminder):
    """Create re-test reminder for patient"""
    reminder_id = generate_id()
    retest_reminders_db[reminder_id] = {
        "id": reminder_id,
        "patientId": reminder.patientId,
        "reminderDate": reminder.reminderDate,
        "createdAt": get_timestamp(),
        "active": True
    }
    return {"message": "Reminder created", "reminderId": reminder_id}

@app.get("/api/scan/patient/{patient_id}/retest")
def get_retest_reminder(patient_id: str, token: str = None):
    """Get retest reminder for patient"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    reminders = [r for r in retest_reminders_db.values() if r.get("patientId") == patient_id and r.get("active")]
    return {"reminders": reminders}

# ============= Patient Notes =============

class PatientNote(BaseModel):
    patientId: str
    note: str

patient_notes_db = {}

@app.post("/api/scan/patient-note")
def add_patient_note(note_data: PatientNote):
    """Patient adds personal note"""
    note_id = generate_id()
    patient_notes_db[note_id] = {
        "id": note_id,
        "patientId": note_data.patientId,
        "note": note_data.note,
        "createdAt": get_timestamp()
    }
    return {"message": "Note added", "noteId": note_id}

@app.get("/api/scan/patient/{patient_id}/notes")
def get_patient_notes(patient_id: str, token: str = None):
    """Get patient's personal notes"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    notes = [n for n in patient_notes_db.values() if n.get("patientId") == patient_id]
    notes.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"notes": notes}

# ============= Family Account =============

class FamilyMember(BaseModel):
    familyId: str
    memberId: str

family_db = {}

@app.post("/api/scan/family/link")
def link_family_member(member: FamilyMember):
    """Link family member to primary patient"""
    if member.familyId not in family_db:
        family_db[member.familyId] = {"members": [], "primary": member.familyId}

    if member.memberId not in family_db[member.familyId]["members"]:
        family_db[member.familyId]["members"].append(member.memberId)

    return {"message": "Family member linked"}

@app.get("/api/scan/family/{patient_id}")
def get_family_results(patient_id: str, token: str = None):
    """Get results for patient's family members"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    # Find family group
    family_data = None
    for fam in family_db.values():
        if patient_id in fam.get("members", []) or patient_id == fam.get("primary"):
            family_data = fam
            break

    if not family_data:
        return {"family": [], "message": "No family members linked"}

    # Get results for all family members
    family_results = []
    for member_id in family_data.get("members", []):
        member = patients_db.get(member_id)
        if member:
            member_tests = [t for t in tests_db.values() if t.get("patientId") == member_id]
            latest = max(member_tests, key=lambda x: x.get("analyzedAt", "")) if member_tests else {}
            family_results.append({
                "patientId": member_id,
                "name": member.get("name"),
                "latestResult": latest.get("prediction", "No tests"),
                "latestDate": latest.get("analyzedAt", "N/A")
            })

    return {"family": family_results}

# ============= Two-Factor Authentication =============

class TwoFactorSetup(BaseModel):
    userId: str
    secret: str

two_factor_db = {}

def generate_2fa_secret():
    import secrets
    return secrets.token_hex(16)

@app.post("/api/auth/2fa/setup")
def setup_2fa(userId: str):
    """Setup 2FA for user"""
    secret = generate_2fa_secret()
    two_factor_db[userId] = {"secret": secret, "enabled": False}
    return {"secret": secret, "message": "2FA secret generated. Save this secret in your authenticator app."}

@app.post("/api/auth/2fa/enable")
def enable_2fa(userId: str, code: str):
    """Enable 2FA after verification"""
    # In production, verify code with authenticator app
    if userId in two_factor_db:
        two_factor_db[userId]["enabled"] = True
        return {"message": "2FA enabled"}
    raise HTTPException(status_code=404, detail="2FA not setup")

@app.post("/api/auth/2fa/verify")
def verify_2fa(userId: str, code: str):
    """Verify 2FA code during login"""
    # In production, verify code with authenticator app
    if userId in two_factor_db and two_factor_db[userId].get("enabled"):
        # Accept any 6-digit code for demo
        if len(code) == 6 and code.isdigit():
            return {"verified": True}
        return {"verified": False}
    return {"verified": True}  # No 2FA enabled

@app.get("/api/auth/2fa/status")
def get_2fa_status(userId: str):
    """Get 2FA status for user"""
    if userId in two_factor_db:
        return {"enabled": two_factor_db[userId].get("enabled", False)}
    return {"enabled": False}

# ============= Public API =============

@app.get("/api/public/stats")
def public_stats():
    """Public statistics (no sensitive data)"""
    total_tests = len(tests_db)
    positive = sum(1 for t in tests_db.values() if t.get("prediction") == "Positive")
    return {
        "total_tests": total_tests,
        "positive_cases": positive,
        "negative_cases": total_tests - positive,
        "positive_rate": round(positive / total_tests * 100, 1) if total_tests > 0 else 0
    }

# ============= Voice Results =============

@app.get("/api/scan/patient/{patient_id}/voice")
def get_voice_result(patient_id: str, token: str = None):
    """Get text-to-speech result for patient"""
    patient = patients_db.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_token = patient.get('scanToken')
    if patient_token and token != patient_token:
        raise HTTPException(status_code=403, detail="Invalid access token")

    # Get latest test
    patient_tests = [t for t in tests_db.values() if t.get("patientId") == patient_id]
    latest = max(patient_tests, key=lambda x: x.get("analyzedAt", "")) if patient_tests else {}

    result = latest.get("prediction", "Pending")
    text = f"Hello {patient.get('name')}. Your H. pylori test result is {result}."
    if result == "Positive":
        text += " Please consult your doctor for treatment."
    else:
        text += " You do not have an H. pylori infection."

    return {"text": text, "result": result}

# ============= Data Export/Backup Endpoints =============

@app.get("/api/backup/export")
def export_backup():
    """Export all data as JSON (Admin only)"""
    backup_data = {
        "exportedAt": get_timestamp(),
        "patients": list(patients_db.values()),
        "tests": list(tests_db.values()),
        "users": [
            {k: v for k, v in u.items() if k != 'password'}
            for u in users_db.values()
        ],
        "reports": list(reports_db.values()),
        "appointments": list(appointments_db.values())
    }

    return backup_data

@app.post("/api/backup/import")
def import_backup(data: dict):
    """Import data from JSON backup (Admin only)"""
    imported = {"patients": 0, "tests": 0, "users": 0, "reports": 0, "appointments": 0}

    if "patients" in data:
        for patient in data["patients"]:
            patients_db[patient['id']] = patient
            imported["patients"] += 1

    if "tests" in data:
        for test in data["tests"]:
            tests_db[test['id']] = test
            imported["tests"] += 1

    if "users" in data:
        for user in data["users"]:
            users_db[user['id']] = user
            imported["users"] += 1

    if "reports" in data:
        for report in data["reports"]:
            reports_db[report['id']] = report
            imported["reports"] += 1

    if "appointments" in data:
        for apt in data["appointments"]:
            appointments_db[apt['id']] = apt
            imported["appointments"] += 1

    return {"message": "Backup imported successfully", "imported": imported}

@app.get("/api/export/patients-csv")
def export_patients_csv():
    """Export all patients as CSV"""
    patients = list(patients_db.values())

    if not patients:
        return {"message": "No patients to export", "csv": ""}

    csv_data = [
        ["ID", "Name", "Age", "Gender", "Email", "Phone", "Address", "Created At"]
    ]

    for p in patients:
        csv_data.append([
            p.get('id', ''),
            p.get('name', ''),
            str(p.get('age', '')),
            p.get('gender', ''),
            p.get('email', ''),
            p.get('phone', ''),
            p.get('address', ''),
            p.get('createdAt', '')
        ])

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerows(csv_data)
    csv_string = csv_buffer.getvalue()

    return {"csv": csv_string}

# ============= Audit Log Endpoints =============

@app.get("/api/audit/logs")
def get_audit_logs(
    authorization: str = Header(None),
    user_id: str = None,
    resource_type: str = None,
    limit: int = 100
):
    """Get audit logs (Admin/Doctor only)"""
    # Check authentication
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    # For now, allow any authenticated user to view audit logs
    # Can be restricted later based on role
    from audit_logger import get_audit_logs as fetch_audit_logs
    return fetch_audit_logs(user_id=user_id, resource_type=resource_type, limit=limit)

# ============= Patient Portal Endpoints =============

@app.post("/api/patient-portal/register")
def register_patient_portal(request: PatientPortalRegister):
    """Register patient portal access"""
    # Verify patient exists
    patient = get_patient(request.patientId)

    # Generate access code if not valid
    if len(request.accessCode) < 6:
        request.accessCode = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

    portal_data = {
        "id": generate_id(),
        "patientId": request.patientId,
        "email": request.email,
        "password": get_password_hash(request.password),
        "accessCode": request.accessCode,
        "createdAt": get_timestamp()
    }

    patient_portal_db[request.patientId] = portal_data

    return {
        "message": "Patient portal registered successfully",
        "accessCode": request.accessCode
    }

@app.post("/api/patient-portal/login")
def login_patient_portal(request: PatientPortalLogin):
    """Login to patient portal"""
    portal_data = patient_portal_db.get(request.patientId)

    if not portal_data:
        raise HTTPException(status_code=401, detail="Invalid patient credentials")

    if portal_data.get('accessCode') != request.accessCode:
        raise HTTPException(status_code=401, detail="Invalid access code")

    # Get patient data
    patient = get_patient(request.patientId)
    tests = get_tests(patient_id=request.patientId)

    return {
        "patient": patient,
        "tests": tests,
        "message": "Login successful"
    }

@app.get("/api/patient-portal/data/{patient_id}")
def get_patient_portal_data(patient_id: str, access_code: str):
    """Get patient data for portal (requires access code)"""
    portal_data = patient_portal_db.get(patient_id)

    if not portal_data or portal_data.get('accessCode') != access_code:
        raise HTTPException(status_code=401, detail="Invalid access code")

    patient = get_patient(patient_id)
    tests = get_tests(patient_id=patient_id)

    return {
        "patient": patient,
        "tests": tests
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)