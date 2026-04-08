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

## Frontend Architecture

### React Application Structure

```mermaid
flowchart TB
    subgraph Client["React Client Application"]
        subgraph App["App Root"]
            Router["React Router"]
            Layout["Layout Component"]
            Theme["Theme Provider"]
        end
        
        subgraph Pages["Pages"]
            Dashboard["Dashboard"]
            Patients["Patients"]
            PatientProfile["Patient Profile"]
            PatientPortal["Patient Portal"]
            NewTest["New Test"]
            Analytics["Analytics"]
            Reports["Reports"]
            Appointments["Appointments"]
            Login["Login"]
            Register["Register"]
            Users["Users"]
            Sessions["Sessions"]
            Backup["Backup & Export"]
            Audit["Audit Logs"]
        end
        
        subgraph Components["Components"]
            Sidebar["Sidebar"]
            Chatbot["Chatbot"]
            Toast["Toast Notifications"]
            ThemeToggle["Theme Toggle"]
            TextToSpeech["Text to Speech"]
        end
        
        subgraph Services["Services"]
            API["API Client<br/>(axios/fetch)"]
        end
    end

    Router --> Pages
    Layout --> Components
    Pages --> API
    Theme --> ThemeToggle
```

### Component Hierarchy

```mermaid
flowchart TB
    subgraph Main["main.jsx"]
        Root["<App />"]
    end
    
    subgraph App["App.jsx"]
        Router["<BrowserRouter>"]
        ThemeProvider["<ThemeProvider>"]
        AppLayout["<AppLayout>"]
    end
    
    subgraph Layout["AppLayout"]
        Sidebar["<Sidebar>"]
        MainContent["<MainContent>"]
    end
    
    subgraph Routes["Routes"]
        DashboardRoute["/ → Dashboard"]
        PatientsRoute["/patients → Patients"]
        ProfileRoute["/patients/:id → PatientProfile"]
        NewTestRoute["/new-test → NewTest"]
        AnalyticsRoute["/analytics → Analytics"]
        ReportsRoute["/reports → Reports"]
        AppointmentsRoute["/appointments → Appointments"]
        LoginRoute["/login → Login"]
        PortalRoute["/portal → PatientPortal"]
    end

    Root --> Router
    Router --> ThemeProvider
    ThemeProvider --> AppLayout
    AppLayout --> Sidebar
    AppLayout --> MainContent
    MainContent --> Routes
```

### Page Flow & Navigation

```mermaid
flowchart LR
    subgraph Auth["Authentication"]
        Login["Login"]
        Register["Register"]
    end

    subgraph Main["Main Application"]
        Dashboard["Dashboard"]
        
        subgraph PatientFlow["Patient Flow"]
            Patients["Patients List"]
            PatientProfile["Patient Profile"]
            PatientPortal["Patient Portal"]
            NewTest["New Test"]
        end
        
        subgraph Data["Data & Reports"]
            Analytics["Analytics"]
            Reports["Reports"]
        end
        
        subgraph Admin["Administration"]
            Appointments["Appointments"]
            Users["Users"]
            Sessions["Sessions"]
            Backup["Backup & Export"]
            Audit["Audit Logs"]
        end
    end

    Login --> Dashboard
    Register --> Dashboard
    Dashboard --> Patients
    Dashboard --> NewTest
    Dashboard --> Analytics
    Dashboard --> Reports
    Dashboard --> Appointments
    
    Patients --> PatientProfile
    PatientProfile --> PatientPortal
    PatientPortal --> NewTest
    
    Appointments --> Users
    Appointments --> Sessions
    Appointments --> Backup
    Appointments --> Audit
```

### State Management & Data Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Page as Page Component
    participant API as API Service
    participant FastAPI as FastAPI Backend
    participant Firebase as Firebase
    
    User->>Page: User Action
    Page->>API: API Request
    API->>FastAPI: HTTP Request
    FastAPI->>Firebase: Query Data
    Firebase-->>FastAPI: Data Response
    FastAPI-->>API: JSON Response
    API-->>Page: Parsed Data
    Page-->>User: UI Update
    
    Note over Page,API: useState / useEffect<br/>for state management
```

### Technology Stack

```mermaid
flowchart LR
    subgraph Core["Core"]
        React["React 18"]
        Vite["Vite (Build Tool)"]
        JSX["JSX"]
    end

    subgraph Routing["Routing"]
        ReactRouter["React Router DOM"]
    end

    subgraph Styling["Styling"]
        Tailwind["Tailwind CSS"]
        Lucide["Lucide Icons"]
    end

    subgraph State["State"]
        ReactHooks["React Hooks"]
        Context["React Context"]
    end

    subgraph Charts["Visualization"]
        Recharts["Recharts"]
        ChartJS["Chart.js"]
    end

    React --> Vite
    Vite --> JSX
    ReactRouter --> React
    Tailwind --> React
    Lucide --> React
    ReactHooks --> React
    Context --> React
    Recharts --> React
    ChartJS --> React
```

### Feature Modules

```mermaid
flowchart TB
    subgraph Dashboard["Dashboard Module"]
        Stats["Stats Cards"]
        Chart["Trend Charts"]
        Activity["Recent Activity"]
    end

    subgraph Patients["Patient Management"]
        List["Patient List Table"]
        Search["Search/Filter"]
        Profile["Patient Profile View"]
        Treatment["Treatment Tracking"]
    end

    subgraph Testing["Testing Module"]
        NewTest["New Test Form"]
        SignalInput["Binary Signal Input"]
        Analysis["Real-time Analysis"]
        RandomGen["Random Signal Generator"]
    end

    subgraph Reporting["Reporting Module"]
        ReportList["Report List"]
        PDFGen["PDF Generator"]
        CSVGen["CSV Export"]
    end

    subgraph Analytics["Analytics Module"]
        PieChart["Pie Chart"]
        LineChart["Line Chart"]
        BarChart["Bar Chart"]
    end

    subgraph Utilities["Utilities"]
        Chatbot["AI Chatbot"]
        Toast["Toast Notifications"]
        Theme["Theme Toggle"]
        TTS["Text to Speech"]
    end
```

### API Integration

```mermaid
flowchart TB
    subgraph API["API Service Layer"]
        Endpoints["Base URL: /api/*"]
        
        subgraph EndpointsList["Endpoint Wrappers"]
            AuthAPI["auth/*"]
            PatientsAPI["patients/*"]
            TestsAPI["tests/*"]
            ReportsAPI["reports/*"]
            AnalyticsAPI["analytics/*"]
            AppointmentsAPI["appointments/*"]
            ScanAPI["scan/*"]
        end
        
        ErrorHandler["Error Handling"]
        Interceptors["Request/Response<br/>Interceptors"]
    end

    Endpoints --> EndpointsList
    EndpointsList --> ErrorHandler
    ErrorHandler --> Interceptors
```

| Module | Components | Description |
|--------|------------|-------------|
| Auth | Login, Register | User authentication |
| Dashboard | Stats, Charts | Overview & quick actions |
| Patients | List, Profile, Portal | Patient management |
| Testing | NewTest, Analysis | Test execution |
| Analytics | Charts | Data visualization |
| Reports | PDF, CSV | Report generation |
| Appointments | CRUD | Scheduling |
| Utilities | Chatbot, Toast, Theme | UX enhancements |

### FastAPI Server Structure

```mermaid
flowchart TB
    subgraph Client["Client (React Frontend)"]
        Web["HTTP Requests"]
        Auth["Authentication"]
    end

    subgraph FastAPI["FastAPI Server"]
        Router["API Router"]
        
        subgraph Routes["Route Modules"]
            AuthRoutes["/api/auth<br/>- register<br/>- login<br/>- 2FA"]
            PatientRoutes["/api/patients<br/>- CRUD<br/>- Treatment"]
            TestRoutes["/api/tests<br/>- Analyze<br/>- Batch"]
            ReportRoutes["/api/reports<br/>- PDF<br/>- CSV"]
            AnalyticsRoutes["/api/analytics<br/>- Summary<br/>- Trends"]
            AppointmentRoutes["/api/appointments<br/>- CRUD"]
            ChatRoutes["/api/chat<br/>- Chatbot"]
            ScanRoutes["/api/scan<br/>- QR Scan"]
            NotificationRoutes["/api/notifications"]
            QRCodeRoutes["/api/qrcode"]
            BackupRoutes["/api/backup"]
            ExportRoutes["/api/export"]
            AuditRoutes["/api/audit"]
            PortalRoutes["/api/patient-portal"]
            PublicRoutes["/api/public"]
        end
        
        Middleware["Middleware<br/>- CORS<br/>- Auth<br/>- Logging"]
        Exception["Exception Handling"]
    end

    subgraph Services["Services Layer"]
        PatientService
        TestService
        ReportService
        AnalyticsService
        AppointmentService
    end

    subgraph External["External Services"]
        Firebase["Firebase<br/>- Firestore<br/>- Auth<br/>- Storage"]
        AIModel["AI Model<br/>(TensorFlow)"]
    end

    Web --> Router
    Auth --> Middleware
    Middleware --> Routes
    Routes --> Services
    Services --> Firebase
    Services --> AIModel
```

### API Endpoints Overview

```mermaid
flowchart LR
    subgraph Auth["Auth Module"]
        R1["POST /register"]
        R2["POST /login"]
        R3["GET /me"]
        R4["POST /2fa/*"]
    end

    subgraph Patients["Patient Module"]
        P1["GET /patients"]
        P2["POST /patients"]
        P3["GET /patients/{id}"]
        P4["PUT /patients/{id}"]
        P5["DELETE /patients/{id}"]
        P6["PUT /patients/{id}/treatment"]
    end

    subgraph Tests["Test Module"]
        T1["GET /tests"]
        T2["POST /tests"]
        T3["POST /tests/analyze"]
        T4["POST /tests/generate-random"]
        T5["POST /tests/batch"]
        T6["POST /tests/confirm"]
    end

    subgraph Reports["Report Module"]
        RP1["GET /reports"]
        RP2["POST /reports/generate-pdf"]
        RP3["POST /reports/generate-csv"]
    end

    subgraph Analytics["Analytics Module"]
        A1["GET /analytics/summary"]
        A2["GET /analytics/trends"]
    end

    subgraph Scan["Scan Module (QR)"]
        S1["GET /scan/patient/{id}"]
        S2["POST /scan/appointment"]
        S3["POST /scan/register"]
        S4["POST /scan/feedback"]
    end

    Auth --> Patients
    Patients --> Tests
    Tests --> Reports
    Reports --> Analytics
    Analytics --> Scan
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
