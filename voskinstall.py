import os
import requests
import zipfile
import subprocess
import sys

# Define the model URL and paths
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip"
MODEL_DIR = "model"
MODEL_NAME = "vosk-model-en-us-0.22"
MODEL_ZIP_PATH = os.path.join(MODEL_DIR, f"{MODEL_NAME}.zip")
MODEL_EXTRACT_PATH = os.path.join(MODEL_DIR, MODEL_NAME)

def setup_virtual_environment():
    """Set up and activate a virtual environment."""
    if not os.path.exists("venv"):
        print("Creating virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", "venv"])

    # Install requirements
    pip_executable = os.path.join("venv", "Scripts", "pip") if os.name == "nt" else os.path.join("venv", "bin", "pip")
    print("Installing required packages...")
    subprocess.check_call([pip_executable, "install", "-r", "Requirements.txt"])

def ensure_model_directory():
    """Ensure the model directory exists."""
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        print(f"Created directory: {MODEL_DIR}")

def download_model():
    """Download the Vosk model."""
    if os.path.exists(MODEL_EXTRACT_PATH):
        print(f"Model {MODEL_NAME} already exists. Skipping download.")
        return

    print(f"Downloading {MODEL_NAME} from {MODEL_URL}...")
    response = requests.get(MODEL_URL, stream=True)
    with open(MODEL_ZIP_PATH, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                f.write(chunk)
    print(f"Downloaded {MODEL_NAME} to {MODEL_ZIP_PATH}.")

def extract_model():
    """Extract the Vosk model."""
    if os.path.exists(MODEL_EXTRACT_PATH):
        print(f"Model {MODEL_NAME} already extracted. Skipping extraction.")
        return

    print(f"Extracting {MODEL_NAME}...")
    with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(MODEL_DIR)
    print(f"Extracted {MODEL_NAME} to {MODEL_EXTRACT_PATH}.")

def update_backend():
    """Update the backend to use the new model."""
    server_file = "server.py"
    with open(server_file, "r") as f:
        lines = f.readlines()

    with open(server_file, "w") as f:
        for line in lines:
            if "model_path =" in line:
                f.write(f'model_path = "{MODEL_EXTRACT_PATH}"\n')
            else:
                f.write(line)

    print(f"Updated {server_file} to use {MODEL_NAME}.")

def clean_up():
    """Remove the downloaded zip file."""
    if os.path.exists(MODEL_ZIP_PATH):
        os.remove(MODEL_ZIP_PATH)
        print(f"Removed {MODEL_ZIP_PATH}.")

if __name__ == "__main__":
    try:
        setup_virtual_environment()
        ensure_model_directory()
        download_model()
        extract_model()
        update_backend()
        clean_up()
        print("Model setup and environment configuration completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")