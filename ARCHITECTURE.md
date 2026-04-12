# System Architecture - H. pylori Nanopaper Detection System

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite)"]
        UI["User Interface"]
        Router["React Router"]
        State["State Management"]
        API["API Client"]
    end

    subgraph Browser["Browser"]
        JS["JavaScript Engine"]
        CSS["Tailwind CSS"]
    end

    subgraph Cloud["Firebase Cloud"]
        Auth["Firebase Auth"]
        Firestore["Firestore Database"]
        Storage["Firebase Storage"]
    end

    subgraph Backend["Backend (FastAPI + Python)"]
        API_Server["FastAPI Server"]
        Routes["API Routes"]
        Models["Data Models"]
        
        subgraph AI["AI/ML Module"]
            TensorFlow["TensorFlow/Keras"]
            Model["H. pylori Detection Model"]
        end
        
        subgraph Services["Business Logic"]
            PatientSvc["Patient Service"]
            TestSvc["Test Service"]
            ReportSvc["Report Service"]
            AnalyticsSvc["Analytics Service"]
            ChatbotSvc["Chatbot Service"]
        end
    end

    subgraph Deployment["Deployment"]
        Hosting["Firebase Hosting"]
        Render["Render (Backend)"]
    end

    User["Medical Professional"] --> UI
    UI --> Router
    Router --> State
    State --> API
    
    API -->|HTTP/REST| API_Server
    
    API_Server --> Routes
    Routes --> Models
    
    Routes --> PatientSvc
    Routes --> TestSvc
    Routes --> ReportSvc
    Routes --> AnalyticsSvc
    Routes --> ChatbotSvc
    
    TestSvc -->|Predict| TensorFlow
    TensorFlow --> Model
    
    PatientSvc --> Firestore
    TestSvc --> Firestore
    ReportSvc --> Firestore
    AnalyticsSvc --> Firestore
    
    ReportSvc -->|Store Reports| Storage
    
    API_Server -->|OAuth| Auth
    Auth --> Firestore
    
    Hosting -->|"Static Assets"| Browser
    Render -->|"Backend API"| Cloud
```

---

## Backend API Architecture

### FastAPI Server Structure

```mermaid
sequenceDiagram
    participant User as Medical Professional
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant ML as TensorFlow Model
    participant DB as Firestore
    participant FS as Firebase Storage

    User->>UI: Input binary signal
    UI->>API: POST /api/tests/analyze
    API->>ML: Predict infection
    ML-->>API: Prediction result
    API->>DB: Save test result
    DB-->>API: Confirmation
    API-->>UI: Response with prediction
    UI-->>User: Display result

    User->>UI: Generate report
    UI->>API: POST /api/reports/generate-pdf
    API->>FS: Upload PDF
    FS-->>API: Download URL
    API-->>UI: Download URL
    UI-->>User: Download PDF
```

### API Endpoints Overview

```mermaid
sequenceDiagram
    participant User as User Input
    participant Pre as Preprocessor
    participant Model as MLP Model
    participant Post as Post-processor
    participant Out as Output

    User->>Pre: "0,1,0,1,0,1,..."
    Pre->>Pre: Parse string to array
    Pre->>Pre: Pad/Truncate to 100
    Pre->>Pre: Reshape to (1, 100)
    Pre->>Model: numpy array
    Model->>Model: Forward pass through layers
    Model->>Post: probabilities [p_neg, p_pos]
    Post->>Post: Check threshold (0.5)
    Post->>Out: {prediction, confidence, color}
    Out-->>User: Result
```

### Request/Response Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant FastAPI as FastAPI Server
    participant Auth as Firebase Auth
    participant Service as Services
    participant Model as AI Model
    participant DB as Firestore

    Client->>FastAPI: HTTP Request
    FastAPI->>Auth: Verify Token
    Auth-->>FastAPI: Valid/Invalid
    
    alt Valid Token
        FastAPI->>Service: Route Request
        Service->>Model: Process (if AI needed)
        Model-->>Service: Prediction
        
        Service->>DB: Database Operation
        DB-->>Service: Data
        
        Service-->>FastAPI: Response
        FastAPI-->>Client: JSON Response
    else Invalid Token
        FastAPI-->>Client: 401 Unauthorized
    end
```

### Endpoint Categories

```mermaid
flowchart TB
    subgraph Core["Core Modules"]
        Patients["Patients<br/>6 endpoints"]
        Tests["Tests<br/>9 endpoints"]
        Reports["Reports<br/>4 endpoints"]
    end

    subgraph Support["Support Modules"]
        Analytics["Analytics<br/>2 endpoints"]
        Appointments["Appointments<br/>4 endpoints"]
        Notifications["Notifications<br/>3 endpoints"]
    end

    subgraph Integration["Integration Modules"]
        Scan["Scan/QR<br/>18 endpoints"]
        Chat["Chatbot<br/>1 endpoint"]
        Auth["Auth/2FA<br/>8 endpoints"]
    end

    subgraph Utilities["Utilities"]
        QR["QR Code<br/>2 endpoints"]
        Backup["Backup/Export<br/>4 endpoints"]
        Portal["Patient Portal<br/>3 endpoints"]
    end
```

### Technology Stack

```mermaid
flowchart LR
    subgraph Backend["Backend"]
        Python["Python 3.x"]
        FastAPI["FastAPI Framework"]
        Pydantic["Pydantic (Validation)"]
        Uvicorn["Uvicorn (Server)"]
    end

    subgraph ML["AI/ML"]
        SKLearn["scikit-learn"]
        TensorFlow["TensorFlow"]
        NumPy["NumPy"]
    end

    subgraph Database["Data Layer"]
        FirebaseSDK["Firebase Admin SDK"]
        Firestore["Firestore"]
        Storage["Firebase Storage"]
    end

    Python --> FastAPI
    FastAPI --> Pydantic
    Pydantic --> Uvicorn
    
    FastAPI --> SKLearn
    SKLearn --> TensorFlow
    TensorFlow --> NumPy
    
    FastAPI --> FirebaseSDK
    FirebaseSDK --> Firestore
    FirebaseSDK --> Storage
```

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 8 | User registration, login, 2FA |
| Patients | 9 | CRUD operations, treatment tracking |
| Tests | 9 | Analysis, batch processing, confirmations |
| Reports | 4 | PDF/CSV generation |
| Analytics | 2 | Summary statistics, trends |
| Appointments | 4 | Scheduling CRUD |
| Scan/QR | 18 | QR code scanning, patient lookup |
| Notifications | 3 | Alert management |
| Chat | 1 | AI chatbot |
| Backup/Export | 4 | Data export, backup/restore |

### MLP Classifier for H. pylori Detection

```mermaid
flowchart TB
    subgraph Input["Input Layer (100 neurons)"]
        Binary["Binary Signal<br/>[0,1,0,1,1,0,...]"]
    end

    subgraph Hidden1["Hidden Layer 1 (64 neurons)"]
        H1["ReLU Activation"]
        BN1["Batch Norm"]
    end

    subgraph Hidden2["Hidden Layer 2 (32 neurons)"]
        H2["ReLU Activation"]
        BN2["Batch Norm"]
    end

    subgraph Hidden3["Hidden Layer 3 (16 neurons)"]
        H3["ReLU Activation"]
        BN3["Batch Norm"]
    end

    subgraph Output["Output Layer (2 neurons)"]
        Softmax["Softmax"]
        Pos["Positive<br/>(Infected)"]
        Neg["Negative<br/>(Normal)"]
    end

    Binary --> H1
    H1 --> BN1
    BN1 --> H2
    H2 --> BN2
    BN2 --> H3
    H3 --> BN3
    BN3 --> Softmax
    Softmax --> Pos
    Softmax --> Neg
```

### Model Configuration

```mermaid
flowchart LR
    subgraph Config["MLP Classifier Parameters"]
        ModelType["Model: MLPClassifier"]
        Layers["Layers: (64, 32, 16)"]
        Act["Activation: ReLU"]
        Solver["Solver: Adam"]
        MaxIter["Max Iterations: 500"]
        EarlyStop["Early Stopping: True"]
        ValFrac["Validation Fraction: 0.2"]
    end
```

### Data Flow - Signal Processing

```mermaid
sequenceDiagram
    participant User as User Input
    participant Pre as Preprocessor
    participant Model as MLP Model
    participant Post as Post-processor
    participant Out as Output

    User->>Pre: "0,1,0,1,0,1,..."
    Pre->>Pre: Parse string to array
    Pre->>Pre: Pad/Truncate to 100
    Pre->>Pre: Reshape to (1, 100)
    Pre->>Model: numpy array
    Model->>Model: Forward pass through layers
    Model->>Post: probabilities [p_neg, p_pos]
    Post->>Post: Check threshold (0.5)
    Post->>Out: {prediction, confidence, color}
    Out-->>User: Result
```

### Training Pipeline

```mermaid
flowchart TB
    subgraph Generation["Data Generation"]
        Rand["Random Binary<br/>Generator"]
        Label["Label Assignment<br/>(>50% ones = positive)"]
    end

    subgraph Training["Model Training"]
        Split["Train/Val Split<br/>(80/20)"]
        Forward["Forward Pass"]
        Loss["Loss Calculation"]
        Backward["Backpropagation"]
        Update["Weight Update"]
    end

    subgraph Inference["Inference"]
        Input["New Signal"]
        Predict["Predict"]
        Prob["Probability"]
        Class["Classification"]
    end

    Rand --> Label
    Label --> Split
    Split --> Forward
    Forward --> Loss
    Loss --> Backward
    Backward --> Update
    Update -.->|Loop| Forward

    Input --> Predict
    Predict --> Prob
    Prob --> Class
```

### Model Specifications

| Parameter | Value |
|-----------|-------|
| Model Type | MLPClassifier (sklearn) |
| Hidden Layers | (64, 32, 16) |
| Activation | ReLU |
| Optimizer | Adam |
| Max Iterations | 500 |
| Early Stopping | True |
| Validation Fraction | 0.2 |
| Input Size | 100 (binary signal length) |
| Output Classes | 2 (Positive/Negative) |
| Training Samples | 2000 (synthetic) |

```mermaid
flowchart TB
    subgraph Layer1["Presentation Layer"]
        Dashboard["Dashboard"]
        PatientMgmt["Patient Management"]
        NewTest["New Test Entry"]
        Analytics["Analytics"]
        Reports["Reports"]
    end

    subgraph Layer2["API Layer"]
        REST["REST API Endpoints"]
        WebSocket["WebSocket (Future)"]
    end

    subgraph Layer3["Service Layer"]
        PatientService
        TestService
        ReportService
        AnalyticsService
        ChatbotService
    end

    subgraph Layer4["Data Layer"]
        Firestore["Firestore DB"]
        Storage["Firebase Storage"]
    end

    subgraph Layer5["ML Layer"]
        TensorFlow["TensorFlow"]
        KerasModel["Keras Model"]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer3 --> Layer5
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant User as Medical Professional
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant ML as TensorFlow Model
    participant DB as Firestore
    participant FS as Firebase Storage

    User->>UI: Input binary signal
    UI->>API: POST /api/tests/analyze
    API->>ML: Predict infection
    ML-->>API: Prediction result
    API->>DB: Save test result
    DB-->>API: Confirmation
    API-->>UI: Response with prediction
    UI-->>User: Display result

    User->>UI: Generate report
    UI->>API: POST /api/reports/generate-pdf
    API->>FS: Upload PDF
    FS-->>API: Download URL
    API-->>UI: Download URL
    UI-->>User: Download PDF
```
