# PlantGuard AI — Setup Guide

## Folder Structure
```
project/
├── backend/
│   └── main.py                  ← your upgraded FastAPI file
├── saved_models/
│   ├── potato/1/                ← your existing potato model here
│   └── tomato/1/                ← tomato model here (from Kaggle)
└── frontend/
    └── src/
        └── App.jsx              ← React frontend
```

---

## Backend Setup

### 1. Install dependencies
```bash
pip install fastapi uvicorn tensorflow numpy pillow opencv-python requests python-multipart
```

### 2. Run the server
```bash
cd backend
python main.py
```
Server runs at: http://localhost:8000

### Test it works:
Open http://localhost:8000/ping in your browser — you should see:
```json
{"message": "PlantGuard API is alive"}
```

---

## Frontend Setup

### 1. Create React app (one time only)
```bash
npm create vite@latest plantguard-frontend -- --template react
cd plantguard-frontend
npm install
```

### 2. Replace the App.jsx
Copy your `App.jsx` file into `plantguard-frontend/src/App.jsx`
(Replace the existing one)

### 3. Run the frontend
```bash
npm run dev
```
Opens at: http://localhost:5173

---

## How the XAI (Grad-CAM) works

When you click "Analyze Plant":
1. Image is sent to `/explain` endpoint on your FastAPI backend
2. The model makes a prediction
3. Grad-CAM runs on the last Conv2D layer — it finds which regions of the leaf
   the model paid most attention to
4. A heatmap is generated and overlaid on your image
5. The frontend shows two tabs: **Original** and **Grad-CAM Heatmap**
6. Red/warm areas = regions that most influenced the prediction

---

## API Endpoints

| Endpoint   | Method | Description                                      |
|------------|--------|--------------------------------------------------|
| /ping      | GET    | Health check                                     |
| /predict   | POST   | Returns class + confidence + precautions/solutions |
| /explain   | POST   | Same as /predict + Grad-CAM heatmap (base64 PNG) |

Both `/predict` and `/explain` accept:
- `file` — the image file
- `crop` — either `"potato"` or `"tomato"`

---

## Getting the Tomato Model

1. Go to Kaggle: https://www.kaggle.com/datasets/arjuntejaswi/plant-village
2. Download the PlantVillage dataset
3. Train a CNN on the tomato classes (same architecture as your potato model)
4. Save it using: `model.save("../saved_models/tomato/1")`

The 10 tomato classes your backend already supports:
- Bacterial Spot, Early Blight, Late Blight, Leaf Mold,
  Septoria Leaf Spot, Spider Mites, Target Spot,
  Yellow Leaf Curl Virus, Mosaic Virus, Healthy

---

## Notes for Viva / Submission

Be ready to explain:
- **Grad-CAM**: "Gradient-weighted Class Activation Mapping — it uses gradients 
  flowing into the last convolutional layer to highlight important regions"
- **Why XAI matters**: "It makes the model's decision transparent and trustworthy, 
  especially important in agriculture where farmers need to understand why"
- **Multi-crop**: "The same FastAPI backend loads separate trained models per crop, 
  selected via a form parameter"
