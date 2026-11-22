# NeuroScan — Brain Tumor MRI Classification System

<div align="center">

**A full-stack, AI-assisted brain tumor MRI classification platform**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-EfficientNet-orange?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-ML%20API-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

</div>

> **Educational disclaimer:** NeuroScan is a major-project and research prototype. Its output is **not a medical diagnosis** and must not replace evaluation by a qualified healthcare professional.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Supported Predictions](#supported-predictions)
- [Model Performance](#model-performance)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Authentication and Security](#authentication-and-security)
- [Personal Prediction History](#personal-prediction-history)
- [Git and Deployment Notes](#git-and-deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [License](#license)

---

## Overview

**NeuroScan** allows a user to:

1. Register or log in securely.
2. Upload a JPG, JPEG, or PNG brain MRI scan.
3. Send the image through an Express.js backend.
4. Receive a tumor classification from a TensorFlow/FastAPI model service.
5. Store the prediction in MongoDB under the authenticated user's account.
6. View personal scan history with pagination and open detailed prediction records.

The application uses an EfficientNet-based deep-learning model and separates the web application, prediction API, database, and optional image-storage integration into independent layers.

---

## Key Features

### User and Security
- Full name, email, and password registration
- Email/password login
- Password hashing with **bcrypt**
- 7-day **JWT** authentication sessions
- Protected prediction, health, image, and history routes
- Session validation after page refresh
- Logout and automatic expired-session handling

### MRI Prediction
- Drag-and-drop and file-browser upload
- JPG, JPEG, and PNG validation
- 10 MB upload limit
- Live MRI preview
- Model prediction label and confidence score
- Class probability breakdown
- Optional Grad-CAM support in the inference implementation

### Personal History
- Results are associated with `patientId`
- A user can only access their own records
- Server-side pagination
- Previous scan detail view
- Original filename, prediction, confidence, timestamp, and probabilities
- Cloudinary image URL or protected local upload fallback

### Frontend Experience
- Public landing page
- Login and registration pages
- Protected React dashboard
- Browser history and direct-route support
- Responsive desktop and mobile navigation
- Service status indicator
- Educational-use disclaimer

---

## System Architecture

```mermaid
flowchart LR
    U[User Browser] -->|React Routes| F[React + Vite Frontend]
    F -->|JWT Bearer + Axios| B[Express.js Backend]
    B -->|Registration and Login| M[(MongoDB)]
    B -->|Store Prediction Record| M
    B -->|Upload MRI| ML[FastAPI ML Service]
    ML -->|TensorFlow Inference| MO[EfficientNet Model]
    B -->|Optional Image Upload| C[Cloudinary]
```

### Request Flow

```text
Browser
  -> React page and form validation
  -> Express API with Authorization: Bearer <JWT>
  -> JWT and user lookup middleware
  -> Multer validates and temporarily stores the MRI
  -> FastAPI performs TensorFlow inference
  -> Express saves the prediction for the authenticated user
  -> MongoDB stores the history record
  -> React displays the result or personal history
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, React Router, Axios, React Icons |
| Backend | Node.js, Express 5, Multer, Mongoose |
| Authentication | bcrypt, JSON Web Tokens |
| Database | MongoDB Atlas or local MongoDB |
| ML API | Python, FastAPI, Uvicorn |
| Deep Learning | TensorFlow 2, EfficientNet |
| Image Storage | Cloudinary with local upload fallback |
| Styling | Custom CSS |

---

## Project Structure

```text
Major_Project/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary configuration and upload
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── upload.js           # Multer and image validation
│   ├── models/
│   │   ├── Patient.js          # User account model
│   │   └── PatientRecord.js    # Personal prediction history model
│   ├── routers/
│   │   ├── Auth.js             # Register, login, and current-user routes
│   │   └── Prediction.js       # Prediction and history routes
│   ├── uploads/                # Temporary/local uploaded MRI files
│   ├── utils/
│   │   └── predictionService.js # FastAPI communication
│   ├── app.js                  # Express application entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Header, hero, and reusable UI
│   │   ├── pages/              # Home, auth, history, info pages
│   │   ├── services/           # API and session service functions
│   │   ├── utils/              # Prediction response mapping
│   │   ├── App.jsx             # Authenticated workspace
│   │   └── AppRouter.jsx       # Public/protected route configuration
│   ├── index.html
│   └── package.json
├── ml-service/
│   ├── api.py                  # FastAPI endpoints
│   ├── inference.py            # Image preprocessing and inference
│   ├── train.py                # Model training workflow
│   ├── requirements.txt
│   └── outputs/                # Generated model and reports
└── README.md
```

---

## Supported Predictions

The model can classify an image into one of four classes:

| Label | Meaning |
|---|---|
| `glioma` | Glioma tumor class |
| `meningioma` | Meningioma tumor class |
| `pituitary` | Pituitary tumor class |
| `notumor` | No tumor detected by the model |

A prediction is accompanied by the confidence of the highest-probability class and probabilities for all classes.

---

## Model Performance

The included test classification report contains the following aggregate result:

| Metric | Value |
|---|---:|
| Overall accuracy | **86.50%** |
| Macro-average precision | **87.07%** |
| Macro-average recall | **86.50%** |
| Macro-average F1-score | **86.04%** |
| Test samples | **1,600** |

### Per-Class Test Performance

| Class | Precision | Recall | F1-score | Support |
|---|---:|---:|---:|---:|
| Glioma | 92.95% | 69.25% | 79.37% | 400 |
| Meningioma | 83.11% | 77.50% | 80.21% | 400 |
| No tumor | 91.53% | 100.00% | 95.58% | 400 |
| Pituitary | 80.69% | 99.25% | 89.01% | 400 |

These values describe performance on the tested dataset and do not guarantee clinical accuracy. Results must not be used for diagnosis or treatment decisions.

---

## Prerequisites

Install the following tools:

- **Node.js** 18 or newer
- **npm** 9 or newer
- **Python** 3.10 or newer
- **MongoDB Atlas** account or local MongoDB server
- A **Cloudinary** account, if Cloudinary image storage is enabled
- Optional: NVIDIA GPU and compatible TensorFlow environment

Check installations:

```bash
node --version
npm --version
python --version
```

---

## Installation and Setup

Open a terminal in the project root.

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3. Create the Python Environment

```bash
cd ../ml-service
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Install Python dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## Environment Variables

Never commit real credentials. Create `.env` files locally; they are ignored by Git.

### Backend: `backend/.env`

```env
PORT=8080

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME

ML_SERVICE_URL=http://127.0.0.1:8000
ML_REQUEST_TIMEOUT_MS=60000

FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Generate a strong JWT secret with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Cloudinary is optional. If it is not configured, the backend continues using the local uploads directory for history fallback.

### Frontend: `frontend/.env.local`

```env
VITE_API_BASE_URL=http://localhost:8080
```

The frontend defaults to `http://localhost:8080` if this variable is not provided.

### ML Service

No environment variables are required for the default local setup. The service uses:

- `outputs/brain_tumor_model.keras`
- `outputs/class_names.json`
- `outputs/model_config.json`

---

## Running the Application

Four terminals are normally used.

### Terminal 1 — ML Service

```bash
cd ml-service
.venv\Scripts\activate
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Verify:

```text
http://127.0.0.1:8000/health
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

### Terminal 2 — Backend

```bash
cd backend
npm run dev
```

The API runs at:

```text
http://localhost:8080
```

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

### Optional Production Frontend Build

```bash
cd frontend
npm run build
npm run preview
```

For deployed SPA hosting, configure unknown routes to return `index.html` so direct links and browser refreshes do not produce 404 responses.

---

## API Reference

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "minimum8characters"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "you@example.com",
  "password": "minimum8characters"
}
```

Returns a JWT and public user data.

#### Current User

```http
GET /api/auth/me
Authorization: Bearer <JWT>
```

### Predictions

All prediction routes require a valid JWT.

#### Check ML Service Health

```http
GET /api/predictions/health
Authorization: Bearer <JWT>
```

#### Predict

```http
POST /api/predictions/predict
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

Field: `file`

Example result:

```json
{
  "success": true,
  "savedToHistory": true,
  "recordId": "record_id",
  "prediction": "glioma",
  "confidence": 0.92,
  "probabilities": {
    "glioma": 0.92,
    "meningioma": 0.03,
    "notumor": 0.02,
    "pituitary": 0.03
  }
}
```

### History

#### Paginated History

```http
GET /api/predictions/history?page=1&limit=10
Authorization: Bearer <JWT>
```

Returns:

- `records`
- `pagination.page`
- `pagination.limit`
- `pagination.total`
- `pagination.totalPages`
- `pagination.hasNextPage`
- `pagination.hasPreviousPage`

#### One History Record

```http
GET /api/predictions/history/:id
Authorization: Bearer <JWT>
```

The current user must own the record.

### ML Service

```http
GET /health
POST /predict
```

The `/predict` request accepts multipart field `file` and optional query parameter `gradcam=false`.

---

## Authentication and Security

- Passwords are hashed with `bcrypt` using 12 rounds before database storage.
- JWTs expire after 7 days.
- The backend verifies the JWT and loads the matching Patient document for protected requests.
- Password fields are excluded from normal query results.
- Prediction records contain `patientId`, preventing cross-user history access.
- Email addresses are normalized and stored in lowercase.
- Passwords must contain at least eight characters during registration.
- The frontend stores the session token and public user data in `localStorage`.

For deployment, additionally use HTTPS, rotate secrets, configure trusted CORS origins, add rate limiting, and use secure server-side session storage if required by the security policy.

---

## Personal Prediction History

Each successful prediction creates a `PatientRecord` linked to the authenticated user.

The history API filters every query with:

```js
{ patientId: req.userId }
```

As a result:

- Users see only their own scans.
- Page and detail routes use server-side ownership checks.
- Local image access is also restricted to the record owner.
- Historical records support server-side pagination rather than loading the entire collection.

---

## Git and Deployment Notes

The following are ignored and should not be pushed:

- `.env` and secrets
- `backend/node_modules`
- `backend/uploads`
- `frontend/node_modules`
- `frontend/dist`
- `ml-service/.venv` and `ml-service/venv`
- Python cache directories
- `ml-service/outputs`
- Generated datasets and local model artifacts
- Logs, coverage, and editor-specific files

Before the first push:

```bash
git status
git add .
git status
git commit -m "Initial NeuroScan project"
git push
```

If sensitive files have already been committed:

```bash
git rm -r --cached backend/.env backend/node_modules backend/uploads frontend/node_modules ml-service/.venv ml-service/venv ml-service/outputs
```

Then commit and push the cleanup. Rotate every credential that was previously exposed.

---

## Troubleshooting

### Backend cannot connect to MongoDB

- Confirm `MONGO_URI` is correct.
- Check Atlas IP allowlisting.
- Confirm the database username and password.
- Make sure the database connection string includes the database name if needed.

### System status shows offline

- Confirm the ML API is running on port `8000`.
- Open `http://127.0.0.1:8000/health`.
- Confirm `ML_SERVICE_URL` in `backend/.env` matches the FastAPI address.

### History is empty

- Confirm you are logged in.
- Confirm predictions return `savedToHistory: true`.
- Confirm the backend restarted after code changes.
- Test `GET /api/predictions/history?page=1&limit=10` with the current JWT.

### Browser refresh shows 404

- Development with Vite handles SPA routes automatically.
- Production hosting must rewrite unknown routes to `index.html`.

### TensorFlow or model loading fails

- Confirm model files exist in `ml-service/outputs`.
- Reinstall dependencies from `ml-service/requirements.txt`.
- Use a compatible Python version and TensorFlow build.
- If Grad-CAM reports a missing EfficientNet layer, prediction can still work because Grad-CAM is optional.

### Cloudinary upload fails

- Confirm the Cloudinary variables.
- The backend logs the upload failure and may continue with the local image fallback.

---

## Limitations

- Image inference depends on the dataset used during model training.
- The application is not calibrated or validated as a medical diagnostic device.
- Authentication is based on JWTs stored in browser local storage.
- Local uploaded images require a persistent local volume for production history images.
- Cloudinary configuration is required for durable remote scan storage.
- Uploaded scan privacy should be handled according to applicable medical-data regulations.
- Direct class probabilities and confidence values must not be interpreted as clinical certainty.

---

## License

This project is intended for academic and educational use. Add a specific license file before publishing it as open-source software.
