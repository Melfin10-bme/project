"""
Audit Logger Module - HIPAA Compliance
Logs all access and modifications to patient data
"""

from datetime import datetime
import uuid

# In-memory audit log storage
audit_logs = []

# Initialize database lazily to avoid import errors
db = None

def _get_db():
    global db
    if db is None:
        try:
            from firebase_config import get_firestore_db
            db = get_firestore_db()
        except:
            db = None
    return db

# Action types
class AuditAction:
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    REPORT_GENERATED = "report_generated"
    TEST_CONFIRMED = "test_confirmed"

# Resource types
class AuditResource:
    PATIENT = "patient"
    TEST = "test"
    USER = "user"
    REPORT = "report"
    APPOINTMENT = "appointment"
    SYSTEM = "system"

def generate_audit_id():
    return str(uuid.uuid4())

def get_timestamp():
    return datetime.now().isoformat()

def log_audit_event(
    user_id: str = None,
    username: str = None,
    action: str = None,
    resource_type: str = None,
    resource_id: str = None,
    details: str = None,
    ip_address: str = None
):
    """
    Log an audit event to Firestore or in-memory storage
    """
    audit_id = generate_audit_id()
    timestamp = get_timestamp()

    audit_entry = {
        "id": audit_id,
        "userId": user_id or "system",
        "username": username or "system",
        "action": action,
        "resourceType": resource_type,
        "resourceId": resource_id,
        "details": details,
        "ipAddress": ip_address or "unknown",
        "timestamp": timestamp
    }

    database = _get_db()
    if database:
        try:
            database.collection('audit_logs').document(audit_id).set(audit_entry)
        except Exception as e:
            print(f"Audit log save error: {e}")
            audit_logs.append(audit_entry)
    else:
        audit_logs.append(audit_entry)

    return audit_entry

def get_audit_logs(
    user_id: str = None,
    resource_type: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100
):
    """
    Retrieve audit logs with optional filters
    """
    logs = []
    database = _get_db()

    if database:
        try:
            query = database.collection('audit_logs')
            if user_id:
                query = query.where('userId', '==', user_id)
            if resource_type:
                query = query.where('resourceType', '==', resource_type)
            docs = query.stream()
            logs = [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Audit log retrieval error: {e}")
            logs = list(audit_logs)
    else:
        logs = list(audit_logs)

    # Apply filters
    if start_date:
        logs = [l for l in logs if l.get('timestamp', '') >= start_date]
    if end_date:
        logs = [l for l in logs if l.get('timestamp', '') <= end_date]

    # Sort by timestamp descending
    logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

    return logs[:limit]

def log_patient_access(user_id, username, patient_id, action, details=None):
    """Convenience function for patient-related audit logs"""
    return log_audit_event(
        user_id=user_id,
        username=username,
        action=action,
        resource_type=AuditResource.PATIENT,
        resource_id=patient_id,
        details=details
    )

def log_test_access(user_id, username, test_id, action, details=None):
    """Convenience function for test-related audit logs"""
    return log_audit_event(
        user_id=user_id,
        username=username,
        action=action,
        resource_type=AuditResource.TEST,
        resource_id=test_id,
        details=details
    )

def log_user_action(user_id, username, action, details=None):
    """Convenience function for user-related audit logs"""
    return log_audit_event(
        user_id=user_id,
        username=username,
        action=action,
        resource_type=AuditResource.USER,
        resource_id=user_id,
        details=details
    )