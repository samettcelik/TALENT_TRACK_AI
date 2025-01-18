# app.py
import cv2
import numpy as np
#from ses_metin import listen_and_write_segment
from keras.models import load_model
from keras.preprocessing.image import img_to_array
import threading
import time
import torch
import torch.nn.functional as F
import torchaudio
import sounddevice as sd
import tempfile
from transformers import AutoConfig, Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
from flask import Flask, render_template, Response, jsonify,request
import queue
import logging
import os
import speech_recognition as sr
# Eklenecek yeni importlar
from flask import send_from_directory  # Yeni eklenen
from flask_cors import CORS  # Yeni eklenen
from ses_metin import listen_and_write_segment
from question_evaluator import QuestionEvaluator



evaluator = QuestionEvaluator(api_key="All Rights Reserved - TALENT TRACK AI -  ")

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Konsol çıktılarını yakalamak için kuyruk
console_queue = queue.Queue()

# Global değişkenler
match_count = 0
audio_emotions = []
stop_analysis = False
analysis_active = False
speech_queue = queue.Queue()
speech_active = False  # Added this line
# Global değişkenler
audio_thread = None
# Global değişkenler
stress_score = 0  # Stres skoru için global değişken
total_analyses = 0
completed_rounds = 0  # Eklendi

# Yüz analizi için model ve etiketler
face_classifier = cv2.CascadeClassifier(r'haarcascade_frontalface_default.xml')
classifier = load_model(r'model.h5')
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# Ses analizi için model ve yapılandırma
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_name_or_path = "All Rights Reserved - TALENT TRACK AI - "
config = AutoConfig.from_pretrained(model_name_or_path)
feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name_or_path)
sampling_rate = feature_extractor.sampling_rate
model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name_or_path).to(device)
'''

All Rights Reserved
                       TALENT TRACK AI
                       
'''
def video_analysis(round_count):
    """Video analizini yöneten fonksiyon."""
    global match_count, stop_analysis, analysis_active, speech_active,stress_score,total_analyses,completed_rounds
    
    stress_score = 0
    match_count = 0
    total_analysis_count = 0
    running_results = {
        "stress_score": 0,
        "match_bonus": 0,
        "general_score": 0,
        "match_count": 0,
        "total_analyses": 0,
        "completed_rounds": 0
    }

    for i in range(1, round_count + 1):
        if stop_analysis:
            break
            
        log_to_queue(f"\n=== Döngü {i}/{round_count} başladı ===")
        start_time = time.time()
        last_analysis_time = 0
        analysis_count = 0
        round_matches = 0
        
        # Her döngü için 6 analiz yap
        while analysis_count < 6 and not stop_analysis:  
            current_time = time.time()
            
            if current_time - last_analysis_time >= 4:  # Her 4 saniyede bir analiz
                analysis_count += 1
                total_analysis_count += 1
                total_analyses = total_analysis_count
                face_emotions = getattr(generate_frames, 'last_emotions', [])
                log_to_queue(f"Analiz {analysis_count}/6 - Yüz duyguları: {face_emotions}")
                
                if audio_emotions:
                    top_audio_emotions = audio_emotions[:2]
                    log_to_queue(f"Ses duyguları: {[e['Label'] for e in top_audio_emotions]}")
                    
                    if face_emotions:
                        for face_emotion in face_emotions:
                            mapped_face_emotion = map_emotion(face_emotion)
                            audio_labels = [map_emotion(e["Label"]) for e in top_audio_emotions]
                            
                            if mapped_face_emotion in audio_labels:
                                match_count += 1
                                round_matches += 1
                                log_to_queue(f"✓ Duygu eşleşmesi başarılı! ({face_emotion} - {mapped_face_emotion})")
                                
                                # Stress score güncelleme
                                if face_emotion in ["Happy", "Surprise", "Neutral"]:
                                    stress_score += 1.5
                                elif face_emotion in ["Angry", "Disgust", "Fear", "Sad"]:
                                    stress_score -= 1
                
                last_analysis_time = current_time
            
            time.sleep(0.1)
        
        # Her döngü sonunda sonuçları güncelle
     # Her döngü sonunda sonuçları güncelle
        completed_rounds = i  # Global değişkeni güncelle
        running_results["completed_rounds"] = i
        running_results["total_analyses"] = total_analysis_count
        running_results["match_count"] = match_count
        running_results["match_bonus"] = match_count * 1
        running_results["stress_score"] = min(100, max(0, stress_score))
        running_results["general_score"] = min(100, running_results["stress_score"] + running_results["match_bonus"])
        
        log_to_queue(f"\n=== Döngü {i} tamamlandı ===")
        log_to_queue(f"Bu döngüdeki eşleşme sayısı: {round_matches}")
        log_to_queue(f"Toplam eşleşme sayısı: {match_count}")
        
        if i == round_count:  # Son döngüde analizi tamamla
            analysis_active = False
            speech_active = False
    
    return running_results

# Flask route'ları


if __name__ == "__main__":
    # Ana thread'leri başlat
    audio_thread = threading.Thread(target=audio_analysis, daemon=True, name="audio_thread")
    audio_thread.start()
    
    output_file = "konusma_metni.txt"
    with open(output_file, "w", encoding="utf-8") as file:
        file.write("Analiz Sonuçları:\n\n")
    
    app.run(debug=True, threaded=True)  