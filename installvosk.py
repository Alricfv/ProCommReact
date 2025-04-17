from transformers import pipeline

# Download and save sentiment analysis model
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", cache_dir="./models/sentiment")

# Download and save emotion detection model
emotion_detector = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", cache_dir="./models/emotion")