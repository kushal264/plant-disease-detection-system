from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf
import cv2
import base64

app = FastAPI()

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = ["http://localhost", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MODELS ────────────────────────────────────────────────────────────────────
# Put your trained model folders at these paths.
# Potato model:  saved_models/potato/1
# Tomato model:  saved_models/tomato/1
MODELS = {
    "potato": tf.keras.models.load_model("../saved_models/potato/1"),
    "tomato": tf.keras.models.load_model("../saved_models/tomato/1"),
}

# ── CLASS NAMES ───────────────────────────────────────────────────────────────
CLASS_NAMES = {
    "potato": ["Early Blight", "Late Blight", "Healthy"],
    "tomato": [
        "Bacterial Spot",
        "Early Blight",
        "Late Blight",
        "Leaf Mold",
        "Septoria Leaf Spot",
        "Spider Mites",
        "Target Spot",
        "Yellow Leaf Curl Virus",
        "Mosaic Virus",
        "Healthy",
    ],
}

# ── DISEASE INFO (precautions + solutions) ────────────────────────────────────
DISEASE_INFO = {
    # ── Potato ────────────────────────────────────────────────────────────────
    "potato": {
        "Early Blight": {
            "description": (
                "Early Blight is caused by the fungus Alternaria solani. "
                "It appears as dark brown circular spots with yellow rings on older leaves."
            ),
            "precautions": [
                "Rotate crops — do not plant potatoes in the same field two years in a row.",
                "Use certified, disease-free seed potatoes.",
                "Avoid overhead irrigation; water at the base of the plant.",
                "Remove and destroy infected plant debris after harvest.",
                "Maintain adequate plant spacing for good air circulation.",
            ],
            "solutions": [
                "Apply copper-based fungicides (e.g., Bordeaux mixture) at first sign of disease.",
                "Use fungicides containing chlorothalonil or mancozeb every 7–10 days.",
                "Remove and dispose of heavily infected leaves immediately.",
                "Ensure the crop receives balanced fertilization (avoid excess nitrogen).",
            ],
        },
        "Late Blight": {
            "description": (
                "Late Blight is caused by Phytophthora infestans. "
                "It causes water-soaked lesions that quickly turn brown and can destroy an entire crop."
            ),
            "precautions": [
                "Plant resistant potato varieties when available.",
                "Avoid planting in low-lying, poorly drained areas.",
                "Monitor weather — disease spreads rapidly in cool, wet conditions.",
                "Keep field free of volunteer potato plants and nightshade weeds.",
                "Never store infected tubers alongside healthy ones.",
            ],
            "solutions": [
                "Apply systemic fungicides (metalaxyl, cymoxanil) at first symptom appearance.",
                "Spray protective fungicides preventively during high-risk weather.",
                "Destroy all infected plant material — do not compost.",
                "Harvest tubers as soon as possible after haulm destruction.",
            ],
        },
        "Healthy": {
            "description": "The plant appears healthy with no signs of disease.",
            "precautions": [
                "Continue regular field monitoring every 5–7 days.",
                "Maintain good irrigation and drainage practices.",
                "Keep up crop rotation schedule.",
            ],
            "solutions": [],
        },
    },

    # ── Tomato ────────────────────────────────────────────────────────────────
    "tomato": {
        "Bacterial Spot": {
            "description": (
                "Caused by Xanthomonas bacteria. Produces small, water-soaked spots on leaves, "
                "stems, and fruit that turn dark and scabby."
            ),
            "precautions": [
                "Use certified disease-free seeds and transplants.",
                "Avoid working in fields when plants are wet.",
                "Practice 2–3 year crop rotation.",
                "Disinfect tools between plants.",
            ],
            "solutions": [
                "Apply copper-based bactericides regularly.",
                "Remove and destroy infected plant parts.",
                "Use fixed copper sprays combined with mancozeb.",
            ],
        },
        "Early Blight": {
            "description": (
                "Caused by Alternaria solani. Appears as dark spots with concentric rings "
                "(target-like) usually on older, lower leaves."
            ),
            "precautions": [
                "Rotate crops with non-solanaceous plants.",
                "Avoid overhead watering.",
                "Mulch around plants to prevent soil splash.",
                "Stake plants to improve air circulation.",
            ],
            "solutions": [
                "Apply fungicides (chlorothalonil, mancozeb) on a 7–10 day schedule.",
                "Remove lower infected leaves promptly.",
                "Ensure balanced fertilization.",
            ],
        },
        "Late Blight": {
            "description": (
                "Caused by Phytophthora infestans. Rapidly spreading disease with "
                "irregular water-soaked lesions turning brown-black."
            ),
            "precautions": [
                "Plant resistant varieties.",
                "Avoid dense planting.",
                "Monitor during cool, wet weather closely.",
            ],
            "solutions": [
                "Apply systemic fungicides (metalaxyl) immediately.",
                "Remove and destroy infected tissue.",
                "Do not leave infected fruit in the field.",
            ],
        },
        "Leaf Mold": {
            "description": (
                "Caused by Passalora fulva. Appears as pale green/yellow spots on upper leaf "
                "surface with olive-green mold on the underside."
            ),
            "precautions": [
                "Maintain humidity below 85% in greenhouses.",
                "Ensure good air circulation.",
                "Avoid excessive nitrogen fertilization.",
            ],
            "solutions": [
                "Apply fungicides (chlorothalonil, mancozeb).",
                "Prune lower leaves to improve airflow.",
                "Use drip irrigation instead of overhead watering.",
            ],
        },
        "Septoria Leaf Spot": {
            "description": (
                "Caused by Septoria lycopersici. Small circular spots with dark borders and "
                "light centers, starting on lower leaves."
            ),
            "precautions": [
                "Use disease-free transplants.",
                "Avoid wetting foliage when watering.",
                "Practice crop rotation.",
                "Remove plant debris at end of season.",
            ],
            "solutions": [
                "Spray with fungicides (chlorothalonil, copper) every 7–10 days.",
                "Remove infected lower leaves.",
            ],
        },
        "Spider Mites": {
            "description": (
                "Caused by Tetranychus urticae (two-spotted spider mite). "
                "Tiny pests causing stippling, yellowing, and webbing on leaves."
            ),
            "precautions": [
                "Avoid water-stressed plants — mites thrive on stressed crops.",
                "Encourage natural predators like ladybugs.",
                "Avoid broad-spectrum pesticides that kill beneficial insects.",
            ],
            "solutions": [
                "Apply miticides (abamectin, bifenazate).",
                "Spray plants with water to dislodge mites.",
                "Use neem oil or insecticidal soap for organic control.",
            ],
        },
        "Target Spot": {
            "description": (
                "Caused by Corynespora cassiicola. Brown spots with concentric rings on "
                "leaves, stems, and fruit."
            ),
            "precautions": [
                "Ensure proper spacing and pruning for airflow.",
                "Practice crop rotation.",
                "Avoid overhead irrigation.",
            ],
            "solutions": [
                "Apply fungicides (azoxystrobin, chlorothalonil).",
                "Remove infected leaves and debris.",
            ],
        },
        "Yellow Leaf Curl Virus": {
            "description": (
                "A viral disease transmitted by whiteflies (Bemisia tabaci). "
                "Causes upward leaf curling, yellowing, and severe stunting."
            ),
            "precautions": [
                "Use reflective mulches to repel whiteflies.",
                "Plant resistant/tolerant tomato varieties.",
                "Install insect-proof netting in nurseries.",
                "Remove and destroy infected plants early.",
            ],
            "solutions": [
                "Control whitefly populations using imidacloprid or neonicotinoids.",
                "There is no cure — remove infected plants to prevent spread.",
                "Use yellow sticky traps to monitor whitefly populations.",
            ],
        },
        "Mosaic Virus": {
            "description": (
                "Caused by Tomato Mosaic Virus (ToMV). Produces mottled, mosaic patterns "
                "on leaves with distortion and stunted growth."
            ),
            "precautions": [
                "Use virus-free, certified seeds.",
                "Wash hands and disinfect tools before handling plants.",
                "Control aphids which can spread the virus.",
                "Remove and destroy infected plants immediately.",
            ],
            "solutions": [
                "No chemical cure exists — focus on prevention and removal.",
                "Control aphid vectors with insecticides.",
                "Plant resistant varieties in future seasons.",
            ],
        },
        "Healthy": {
            "description": "The plant appears healthy with no signs of disease.",
            "precautions": [
                "Continue regular field scouting.",
                "Maintain proper irrigation and fertilization.",
                "Keep monitoring for pest and disease pressure.",
            ],
            "solutions": [],
        },
    },
}

# ── HELPERS ───────────────────────────────────────────────────────────────────
IMG_SIZE = 256  # adjust to match your model's expected input size

def read_file_as_image(data: bytes) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))
    return np.array(image)


def generate_gradcam(model, img_array: np.ndarray, class_index: int) -> str:
    """
    Generate a Grad-CAM heatmap and return it as a base64-encoded PNG string.
    Works with any CNN that has at least one Conv2D layer.
    """
    # Find the last convolutional layer name
    last_conv_layer = None
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            last_conv_layer = layer.name
            break

    if last_conv_layer is None:
        return ""

    # Build a model that outputs (last_conv_output, final_predictions)
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv_layer).output, model.output],
    )

    input_tensor = tf.cast(np.expand_dims(img_array, 0), tf.float32)

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(input_tensor)
        loss = predictions[:, class_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap).numpy()

    # Normalize heatmap
    heatmap = np.maximum(heatmap, 0)
    if heatmap.max() != 0:
        heatmap /= heatmap.max()

    # Resize heatmap to original image size
    heatmap_resized = cv2.resize(heatmap, (IMG_SIZE, IMG_SIZE))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Overlay heatmap on original image
    original_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    superimposed = cv2.addWeighted(
        cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR), 0.55,
        heatmap_colored, 0.45, 0
    )
    superimposed_rgb = cv2.cvtColor(superimposed, cv2.COLOR_BGR2RGB)

    # Encode as base64 PNG
    pil_img = Image.fromarray(superimposed_rgb)
    buffer = BytesIO()
    pil_img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return encoded


# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.get("/ping")
async def ping():
    return {"message": "PlantGuard API is alive"}


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    crop: str = Form("potato"),   # "potato" or "tomato"
):
    crop = crop.lower()
    if crop not in MODELS:
        return {"error": f"Unsupported crop '{crop}'. Choose: {list(MODELS.keys())}"}

    raw = await file.read()
    image = read_file_as_image(raw)
    img_batch = np.expand_dims(image, 0)

    model = MODELS[crop]
    predictions = model.predict(img_batch)
    predicted_index = int(np.argmax(predictions[0]))
    predicted_class = CLASS_NAMES[crop][predicted_index]
    confidence = float(np.max(predictions[0]))

    info = DISEASE_INFO[crop].get(predicted_class, {})

    return {
        "crop": crop,
        "class": predicted_class,
        "confidence": confidence,
        "description": info.get("description", ""),
        "precautions": info.get("precautions", []),
        "solutions": info.get("solutions", []),
    }


@app.post("/explain")
async def explain(
    file: UploadFile = File(...),
    crop: str = Form("potato"),
):
    """Returns the prediction result + a Grad-CAM heatmap image (base64 PNG)."""
    crop = crop.lower()
    if crop not in MODELS:
        return {"error": f"Unsupported crop '{crop}'"}

    raw = await file.read()
    image = read_file_as_image(raw)
    img_batch = np.expand_dims(image, 0)

    model = MODELS[crop]
    predictions = model.predict(img_batch)
    predicted_index = int(np.argmax(predictions[0]))
    predicted_class = CLASS_NAMES[crop][predicted_index]
    confidence = float(np.max(predictions[0]))

    heatmap_b64 = generate_gradcam(model, image, predicted_index)

    info = DISEASE_INFO[crop].get(predicted_class, {})

    return {
        "crop": crop,
        "class": predicted_class,
        "confidence": confidence,
        "description": info.get("description", ""),
        "precautions": info.get("precautions", []),
        "solutions": info.get("solutions", []),
        "heatmap": heatmap_b64,   # base64 PNG — display with <img src="data:image/png;base64,...">
    }


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
