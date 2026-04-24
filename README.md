# 🌿 PlantGuard AI — Plant Disease Detection System

## 🚀 Overview

PlantGuard AI is a **full-stack deep learning application** that detects plant diseases from leaf images and provides **explainable predictions using Grad-CAM**, along with **precautions and treatment recommendations**.

The system is designed to support **real-world agricultural use**, helping farmers and researchers diagnose crop diseases quickly and accurately.

---

## 🎯 Key Features

* 🌱 **Multi-Crop Support**

  * Potato (3 classes)
  * Tomato (10 classes)

* 🧠 **Deep Learning Model (CNN)**

  * Image-based disease classification

* 🔍 **Explainable AI (Grad-CAM)**

  * Visual heatmaps showing affected regions

* ⚡ **FastAPI Backend**

  * High-performance REST API

* 🎨 **React Frontend**

  * User-friendly and responsive UI

* 📊 **Confidence Score**

  * Shows prediction reliability

* 💊 **Disease Insights**

  * Description
  * Precautions
  * Treatment solutions

---

## 🏗️ System Architecture

```
User (React Frontend)
        ↓
FastAPI Backend (API Layer)
        ↓
CNN Model (Prediction)
        ↓
Grad-CAM (Explainability)
        ↓
JSON Response → Frontend Display
```

---

## 🧠 Tech Stack

### 🔹 Frontend

* React.js
* HTML, CSS, JavaScript
* Fetch API

### 🔹 Backend

* FastAPI
* Python

### 🔹 Machine Learning

* TensorFlow / Keras
* CNN (Convolutional Neural Network)
* Grad-CAM (Explainable AI)

### 🔹 Image Processing

* OpenCV
* PIL (Python Imaging Library)

---

## 📂 Project Structure

```
PlantGuard-AI/
│
├── backend/
│   ├── main.py
│   ├── models/
│   └── utils/
│
├── frontend/
│   ├── App.jsx
│   └── components/
│
├── notebooks/
│   ├── potato_model.ipynb
│   └── tomato_model.ipynb
│
├── README.md
└── requirements.txt
```

---

## 🧪 Dataset

* **PlantVillage Dataset**
* ~50,000+ labeled images
* 13 total classes across Potato & Tomato

---

## ⚙️ Model Details

* Architecture: CNN (Conv2D + MaxPooling + Dense)
* Activation: ReLU, Softmax
* Optimizer: Adam
* Loss Function: Categorical Crossentropy

### Preprocessing:

* Resizing (128×128 / 256×256)
* Normalization (0–255 → 0–1)
* Data Augmentation:

  * Rotation
  * Flipping

---

## 🔍 Explainable AI (Grad-CAM)

Grad-CAM generates **heatmaps** highlighting regions of the image that influenced the model's decision.

👉 Red areas = Most important regions for prediction

---

## ⚡ API Endpoints

### 🔹 Health Check

```
GET /ping
```

### 🔹 Prediction

```
POST /predict
```

### 🔹 Explainability (with heatmap)

```
POST /explain
```

---

## 📸 How to Use

1. Select crop (Potato / Tomato)
2. Upload leaf image
3. Click **Analyze**
4. View:

   * Disease prediction
   * Confidence score
   * Grad-CAM heatmap
   * Precautions & solutions

---

## 🛠️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/plantguard-ai.git
cd plantguard-ai
```

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Results

* High classification accuracy (~95%+)
* Strong performance on PlantVillage dataset
* Real-time inference (< 1 second)

---

## ⚠️ Limitations

* Dataset is lab-based (not real-field images)
* Limited to 2 crops
* Performance may vary in real-world conditions

---

## 🔮 Future Improvements

* Add more crops
* Mobile app (Flutter / React Native)
* Real-time camera detection
* Cloud deployment (AWS/GCP)
* IoT integration
* Multi-language support

---

## 👨‍💻 Authors

* **Kushal**
* **Aryan**

---

## 📜 License

This project is for academic and research purposes.

---

## 💡 Final Note

> PlantGuard AI combines **Deep Learning + Explainable AI + Full-Stack Development** to create a practical and trustworthy agricultural solution.
