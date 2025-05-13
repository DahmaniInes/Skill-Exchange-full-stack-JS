from langdetect import detect
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import numpy as np
import re

# Initialize SentenceTransformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# MongoDB connection
client = MongoClient('mongodb://127.0.0.1:27017/')
db = client['NovaLAB']
lexicon_collection = db['SentimentLexicon']

# Language code mapping (ISO 639-1 to ISO 639-3 for NRC lexicon)
lang_map = {
    'fr': 'fra',
    'en': 'eng',
    'ar': 'ara',
    'es': 'spa',
    'de': 'deu',
    'tn': 'tun'  # Ajout du tunisien
}

def preprocess_text(text):
    """Clean and preprocess text for sentiment analysis."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    # Supprimer uniquement les lettres répétées trois fois ou plus (ex. youu → you)
    text = re.sub(r'(\w)\1{2,}', r'\1', text)
    return text

def analyze_sentiment(message, language=None):
    """
    Analyze the sentiment of a message using the NRC lexicon, returning scores for all emotions.
    
    Args:
        message (str): The input message
        language (str, optional): ISO 639-3 language code (e.g., 'fra', 'eng', 'tun')
    
    Returns:
        dict: {
            'emotions': {
                'anger': float,
                'anticipation': float,
                'disgust': float,
                'fear': float,
                'joy': float,
                'negative': float,
                'positive': float,
                'sadness': float,
                'surprise': float,
                'trust': float
            },
            'dominant_emotion': str,
            'emoji': str
        }
    """
    # Detect language if not provided
    if not language:
        try:
            language = lang_map.get(detect(message), 'eng')
        except:
            language = 'eng'  # Default to English
    print(f"Langue détectée pour le message '{message}': {language}")

    # Preprocess message
    message = preprocess_text(message)
    words = message.split()
    print(f"Mots analysés : {words}")

    # Fetch lexicon entries for the detected language and universal (emojis)
    lexicon_entries = list(lexicon_collection.find({
        '$or': [
            {'language': language},
            {'language': 'universal'}
        ]
    }))
    print(f"Nombre d'entrées du lexique trouvées pour langue '{language}': {len(lexicon_entries)}")
    print(f"Mots du lexique pour '{language}' : {[entry['word'] for entry in lexicon_entries if entry['word'] in words]}")

    if not lexicon_entries:
        print("Aucune entrée trouvée dans SentimentLexicon")
        return {
            'emotions': {
                'anger': 0.0,
                'anticipation': 0.0,
                'disgust': 0.0,
                'fear': 0.0,
                'joy': 0.0,
                'negative': 0.0,
                'positive': 0.0,
                'sadness': 0.0,
                'surprise': 0.0,
                'trust': 0.0
            },
            'dominant_emotion': 'neutral',
            'emoji': '😐'
        }

    # Initialize emotion scores
    emotion_sums = {
        'anger': 0,
        'anticipation': 0,
        'disgust': 0,
        'fear': 0,
        'joy': 0,
        'negative': 0,
        'positive': 0,
        'sadness': 0,
        'surprise': 0,
        'trust': 0
    }
    matched_words = 0

    # Calculate emotion scores
    for word in words:
        for entry in lexicon_entries:
            if entry['word'] == word:
                print(f"Mot '{word}' trouvé dans le lexique avec émotions : {entry['emotions']}")
                for emotion in emotion_sums:
                    emotion_sums[emotion] += entry['emotions'][emotion]
                matched_words += 1
                break

    # Normalize scores
    if matched_words > 0:
        for emotion in emotion_sums:
            emotion_sums[emotion] = emotion_sums[emotion] / matched_words
    else:
        print("Aucun mot du message trouvé dans le lexique")
        for emotion in emotion_sums:
            emotion_sums[emotion] = 0.0

    # Determine dominant emotion
    dominant_emotion = 'neutral'
    max_score = 0.0
    for emotion, score in emotion_sums.items():
        if score > max_score:
            max_score = score
            dominant_emotion = emotion if emotion not in ['positive', 'negative'] else ('joy' if emotion == 'positive' else 'sadness')

    # Assign emoji based on dominant emotion
    emoji_mapping = {
        'anger': '😣',
        'anticipation': '😮',
        'disgust': '😣',
        'fear': '😣',
        'joy': '😊',
        'sadness': '😔',
        'surprise': '😮',
        'trust': '😊',
        'neutral': '😐'
    }
    emoji = emoji_mapping.get(dominant_emotion, '😐')

    return {
        'emotions': emotion_sums,
        'dominant_emotion': dominant_emotion,
        'emoji': emoji
    }