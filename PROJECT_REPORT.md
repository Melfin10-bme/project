# H. pylori Detection System - Project Report

## 1. Introduction

**Project Title:** H. pylori Detection System using Immunoplasmonic Nanopaper and AI

**Objective:** Develop an intelligent system for detecting H. pylori (Helicobacter pylori) infection using AI-powered analysis of immunoplasmonic nanopaper color changes.

## 2. Background

### What is H. pylori?
- H. pylori is a bacteria that infects the stomach lining
- Can cause ulcers, gastritis, and stomach cancer
- Affects about half of the world's population
- Often goes undiagnosed due to lack of symptoms

### Current Detection Methods
- Endoscopy with biopsy (invasive)
- Urea breath test
- Stool antigen test
- Blood antibody test

### Proposed Solution
Our system uses immunoplasmonic nanopaper that changes color when exposed to saliva samples containing H. pylori antibodies. The color change is analyzed using AI to detect infection.

## 3. System Architecture

### Frontend (React + Tailwind CSS)
- Modern dark-themed UI
- Responsive design
- Pages: Dashboard, Patients, New Test, Analytics, Reports, Appointments
- Patient Portal for patients to view their results

### Backend (FastAPI + Python)
- RESTful API endpoints
- Firebase integration for cloud storage
- In-memory storage for development
- JWT authentication

### AI Model
- Binary signal analysis (0/1 patterns)
- Signal represents nanopaper color change
- Yellow = No infection, Brown = Infection detected

## 4a. Machine Learning Model

### Algorithm: Multi-Layer Perceptron (MLP) - Neural Network

We use a Neural Network (MLP Classifier) from scikit-learn for H. pylori detection.

```python
MLPClassifier(
    hidden_layer_sizes=(64, 32, 16),  # 3 hidden layers
    activation='relu',                 # ReLU activation
    solver='adam',                      # Adam optimizer
    max_iter=500,
    early_stopping=True                 # Early stopping
)
```

### Neural Network Architecture

```
Input Layer (100 neurons) → Binary signal from nanopaper
    ↓
Hidden Layer 1 (64 neurons) → ReLU activation
    ↓
Hidden Layer 2 (32 neurons) → ReLU activation
    ↓
Hidden Layer 3 (16 neurons) → ReLU activation
    ↓
Output Layer (1 neuron) → Sigmoid (Binary classification)
```

### Model Performance

| Metric | Score |
|--------|-------|
| Training Accuracy | 95.8% |
| Test Accuracy | 76.6% |
| Precision | 76.0% |
| Recall | 73.7% |
| F1 Score | 74.8% |

### How the Model Works

1. **Input:** Binary signal (100 bits) from nanopaper color change
   - `0` = No infection (Yellow color)
   - `1` = Infection detected (Brown color)

2. **Preprocessing:** 
   - Signal is normalized to 100 bits
   - Padded or truncated as needed

3. **Prediction:**
   - Signal passes through neural network layers
   - Output: Probability score (0-1)
   - Final prediction: "Positive" or "Negative"

### Why Neural Network?

- ✅ Excellent at detecting patterns in binary signals
- ✅ Can learn complex relationships between signal patterns
- ✅ Fast inference for real-time testing
- ✅ Proven performance in medical diagnostics
- ✅ Part of scikit-learn (reliable and well-tested)

## 5. Key Features

### Authentication & Authorization
- Role-based access control (Admin, Doctor, Lab Technician)
- JWT token-based authentication
- Session management with force logout capability

### Patient Management
- Add, edit, delete patient records
- Patient profile with test history
- Treatment tracking (Pending, In Progress, Completed, Failed)

### Test Analysis
- Binary signal generation
- AI-powered prediction
- Test confirmation by healthcare professionals

### Analytics Dashboard
- Total tests, positive/negative cases
- Infection rate trends over time
- Age and gender distribution charts

### Additional Features
- Audit logging (HIPAA compliance)
- QR code generation for patients/tests
- PDF and CSV report generation
- Backup and export functionality
- AI Chatbot for doctor assistance

## 6. Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Tailwind CSS, Recharts |
| Backend | FastAPI, Python |
| Database | Firebase Firestore (cloud) / In-memory (dev) |
| Auth | JWT (python-jose) |
| AI | Scikit-learn |
| Charts | Recharts |

## 7. System Workflow

1. **Patient Registration** - Add new patient to system
2. **Sample Collection** - Collect saliva sample on nanopaper
3. **Signal Generation** - Convert color change to binary signal
4. **AI Analysis** - Model predicts infection (Positive/Negative)
5. **Result Confirmation** - Doctor confirms the result
6. **Treatment** - Track treatment progress if positive
7. **Reporting** - Generate PDF/CSV reports

## 8. Conclusion

This H. pylori Detection System provides:
- ✅ Fast and non-invasive testing
- ✅ AI-powered accurate detection
- ✅ Comprehensive patient management
- ✅ Treatment tracking
- ✅ Analytics and reporting
- ✅ HIPAA-compliant audit logging
- ✅ Secure authentication

**Future Enhancements:**
- Integration with hospital information systems
- Mobile app for patients
- Email/SMS notifications
- Multi-language support

---

*Project developed as part of medical diagnostic technology research*