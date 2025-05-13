from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from bson import ObjectId
from langdetect import detect, DetectorFactory
from collections import defaultdict
import numpy as np
from datetime import datetime
import json
import os

# Fixer la seed pour langdetect pour des résultats reproductibles
DetectorFactory.seed = 0

# Initialiser Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5000"]}})
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173", "http://localhost:5000"])

# MongoDB connection
def connect_to_mongodb():
    try:
        client = MongoClient("mongodb://127.0.0.1:27017/")
        db = client["NovaLAB"]
        print("Connexion à MongoDB réussie")
        return db
    except Exception as e:
        print(f"Erreur de connexion à MongoDB : {e}")
        return None

# Charger coursera.csv et pré-calculer les embeddings
def load_coursera_data(file_path="data/coursera.csv", model=None):
    try:
        df = pd.read_csv(file_path)
        def clean_skills(skills_str):
            if not isinstance(skills_str, str) or skills_str.strip() in ['{}', '{""}', '', '[]']:
                return []
            try:
                skills = re.findall(r'"([^"]+)"', skills_str)
                skills = [skill.strip() for skill in skills if skill.strip()]
                if not skills:
                    return []
                return skills
            except Exception as e:
                print(f"Erreur de parsing pour '{skills_str[:30]}...' : {e}")
                return []
        df['skills'] = df['skills'].apply(clean_skills)
        initial_rows = len(df)
        df = df[df['skills'].apply(lambda x: len(x) > 0)]
        print(f"Lignes supprimées avec 'skills' vide : {initial_rows - len(df)}")
        if model:
            df['skills_text'] = df['skills'].apply(lambda x: ' '.join([preprocess_text(skill) for skill in x]))
            df['embedding'] = df['skills_text'].apply(lambda x: model.encode(x) if x else np.zeros(384))
        return df
    except Exception as e:
        print(f"Erreur lors du chargement de coursera.csv : {e}")
        return None

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

# Charger le modèle et les données au démarrage
model = SentenceTransformer('all-MiniLM-L6-v2')
db = connect_to_mongodb()
coursera_df = load_coursera_data('data/coursera.csv', model)

# Vérifier les dépendances au démarrage
if db is None:
    print("Erreur : Connexion MongoDB non disponible. Les recommandations ne fonctionneront pas.")
if coursera_df is None or coursera_df.empty:
    print("Erreur : coursera_df non chargé ou vide. Les recommandations ne fonctionneront pas.")

# Créer des index MongoDB
def create_mongodb_indexes():
    if db is not None:
        try:
            db.conversations.create_index([("participants", 1), ("isGroup", 1)])
            db.messages.create_index([("sender", 1), ("isSystemMessage", 1)])
            db.messages.create_index([("conversation", 1), ("isSystemMessage", 1)])
            db.group_classifications.create_index([("group_id", 1)])
            db.user_classifications.create_index([("user_id", 1)])
            db.user_classifications.create_index([("createdAt", 1)], expireAfterSeconds=3600)
            print("Index MongoDB créés avec succès")
        except Exception as e:
            print(f"Erreur lors de la création des index MongoDB : {e}")
    else:
        print("Erreur : Connexion MongoDB non disponible, impossible de créer les index")

# Fonctions du modèle de recommandation
def get_user_messages(user_id, db):
    if db is None:
        print("get_user_messages : Utilisation des messages par défaut (db est None)")
        return ["I'm working on a Python project for data analysis"]
    try:
        user_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        conversations = db.conversations.find({"participants": user_id})
        conversation_ids = [conv["_id"] for conv in conversations]
        messages = db.messages.find({
            "$or": [
                {"sender": user_id, "isSystemMessage": False},
                {"conversation": {"$in": conversation_ids}, "isSystemMessage": False}
            ]
        })
        messages_list = [msg["content"] for msg in messages if "content" in msg and msg["content"] and len(msg["content"].strip()) >= 5]
        print(f"get_user_messages : {len(messages_list)} messages trouvés pour user_id {user_id}: {messages_list[:3]}")
        return messages_list if messages_list else ["I'm working on a Python project for data analysis"]
    except Exception as e:
        print(f"Erreur lors de la récupération des messages pour user_id {user_id}: {e}")
        return ["I'm working on a Python project for data analysis"]

def get_group_messages(group_id, db):
    if db is None:
        print("get_group_messages : Utilisation des messages par défaut (db est None)")
        return ["Python programming tips"]
    try:
        group_id = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        messages = db.messages.find({"conversation": group_id, "isSystemMessage": False})
        messages_list = [msg["content"] for msg in messages if "content" in msg and msg["content"]]
        print(f"get_group_messages : {len(messages_list)} messages trouvés pour group_id {group_id}")
        return messages_list
    except Exception as e:
        print(f"Erreur lors de la récupération des messages du groupe {group_id}: {e}")
        return []

def get_user_groups(user_id, db):
    if db is None:
        print("get_user_groups : Utilisation des groupes par défaut (db est None)")
        return ["group_2"]
    try:
        user_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        groups = db.conversations.find({"participants": user_id, "isGroup": True})
        group_ids = [str(group["_id"]) for group in groups]
        print(f"get_user_groups : {len(group_ids)} groupes trouvés pour user_id {user_id}: {group_ids}")
        return group_ids
    except Exception as e:
        print(f"Erreur lors de la récupération des groupes pour user_id {user_id}: {e}")
        return []

def classify_groups(groups, coursera_df, model, db, force_reclassify=False):
    group_classifications = {}
    for group_id, group_data in groups.items():
        # Vérifier le cache seulement si force_reclassify est False
        if not force_reclassify:
            cached = db.group_classifications.find_one({"group_id": group_id})
            if cached and cached.get("last_updated") and (datetime.now() - cached["last_updated"]).total_seconds() < 3600:
                print(f"classify_groups : Utilisation du cache pour group_id {group_id}")
                group_classifications[group_id] = {
                    'name': cached['name'],
                    'category': cached['category'],
                    'skills': cached['skills'],
                    'similarity': float(cached['similarity'])
                }
                continue
        # Relire les messages du groupe
        group_messages = get_group_messages(group_id, db)
        group_text = ' '.join([preprocess_text(msg) for msg in group_messages])
        if not group_text:
            print(f"classify_groups : Aucun texte de messages pour group_id {group_id}, utilisation du groupName")
            # Utiliser groupName comme secours
            group_name = group_data.get('name', 'Groupe sans nom')
            group_text = preprocess_text(group_name)
            if not group_text:
                print(f"classify_groups : groupName vide pour group_id {group_id}, classification par défaut")
                group_classifications[group_id] = {'name': group_name, 'category': 'Unknown', 'skills': [], 'similarity': 0}
                db.group_classifications.update_one(
                    {"group_id": group_id},
                    {"$set": {
                        "name": group_name,
                        "category": "Unknown",
                        "skills": [],
                        "similarity": 0,
                        "last_updated": datetime.now()
                    }},
                    upsert=True
                )
                continue
        group_embedding = model.encode(group_text)
        max_similarity = 0
        assigned_category = "Unknown"
        assigned_skills = []
        for _, row in coursera_df.iterrows():
            if not row['skills']:
                continue
            similarity = cosine_similarity([group_embedding], [row['embedding']])[0][0]
            if similarity > max_similarity and similarity > 0.05:
                max_similarity = similarity
                assigned_category = row['course']
                assigned_skills = row['skills']
        group_classifications[group_id] = {
            'name': group_data['name'],
            'category': assigned_category,
            'skills': assigned_skills,
            'similarity': float(max_similarity)
        }
        db.group_classifications.update_one(
            {"group_id": group_id},
            {"$set": {
                "name": group_data['name'],
                "category": assigned_category,
                "skills": assigned_skills,
                "similarity": float(max_similarity),
                "last_updated": datetime.now()
            }},
            upsert=True
        )
        print(f"classify_groups : group_id {group_id} classifié avec catégorie {assigned_category}, similarité {max_similarity}")
    return group_classifications

def classify_user_conversations(user_id, db, coursera_df, model):
    try:
        cached = db.user_classifications.find_one({"user_id": user_id})
        if cached and cached.get("last_updated") and (datetime.now() - cached["last_updated"]).total_seconds() < 3600:
            print(f"classify_user_conversations : Utilisation du cache pour user_id {user_id}")
            return {
                'keywords': cached['keywords'],
                'category': cached['category'],
                'skills': cached['skills'],
                'similarity': float(cached['similarity'])
            }
        user_messages = get_user_messages(user_id, db)
        user_text = ' '.join([preprocess_text(msg) for msg in user_messages])
        if not user_text:
            print(f"classify_user_conversations : Aucun texte pour user_id {user_id}")
            result = {'keywords': [], 'category': 'Unknown', 'skills': [], 'similarity': 0}
            db.user_classifications.update_one(
                {"user_id": user_id},
                {"$set": {**result, "last_updated": datetime.now()}},
                upsert=True
            )
            return result
        try:
            vectorizer = TfidfVectorizer(max_features=10)
            tfidf_matrix = vectorizer.fit_transform([user_text])
            keywords = vectorizer.get_feature_names_out()
        except Exception as e:
            print(f"Erreur lors de l'extraction des mots-clés pour user_id {user_id}: {e}")
            keywords = []
        user_embedding = model.encode(user_text)
        max_similarity = 0
        assigned_category = "Unknown"
        assigned_skills = []
        for _, row in coursera_df.iterrows():
            if not row['skills']:
                continue
            similarity = cosine_similarity([user_embedding], [row['embedding']])[0][0]
            if similarity > max_similarity and similarity > 0.05:
                max_similarity = similarity
                assigned_category = row['course']
                assigned_skills = row['skills']
        result = {
            'keywords': keywords.tolist(),
            'category': assigned_category,
            'skills': assigned_skills,
            'similarity': float(max_similarity)
        }
        db.user_classifications.update_one(
            {"user_id": user_id},
            {"$set": {**result, "last_updated": datetime.now()}},
            upsert=True
        )
        print(f"classify_user_conversations : user_id {user_id} classifié avec catégorie {assigned_category}, similarité {max_similarity}")
        return result
    except Exception as e:
        print(f"Erreur dans classify_user_conversations pour user_id {user_id}: {e}")
        return {'keywords': [], 'category': 'Unknown', 'skills': [], 'similarity': 0}

def recommend_groups(user_id, db, coursera_df, group_classifications, model):
    try:
        user_groups = get_user_groups(user_id, db)
        print(f"recommend_groups : Groupes de l'utilisateur {user_id}: {user_groups}")
        user_conversation_info = classify_user_conversations(user_id, db, coursera_df, model)
        user_skills = user_conversation_info['skills']
        user_category = user_conversation_info['category']
        user_group_skills = []
        for group_id in user_groups:
            if group_id in group_classifications:
                user_group_skills.extend(group_classifications[group_id]['skills'])
        all_user_skills = list(set(user_skills + user_group_skills))
        user_skills_text = ' '.join([preprocess_text(skill) for skill in all_user_skills])
        print(f"recommend_groups : Compétences de l'utilisateur {user_id}: {all_user_skills}")
        
        recommendations = []
        if not user_skills_text:
            print(f"recommend_groups : Aucun texte de compétences pour user_id {user_id}, retour des groupes populaires")
            recommendations = [
                {
                    'group_id': group_id,
                    'group_name': group_info['name'],
                    'category': group_info['category'],
                    'skills': group_info['skills'],
                    'similarity': float(group_info['similarity'])
                }
                for group_id, group_info in group_classifications.items()
                if group_id not in user_groups and group_info['similarity'] > 0
            ]
            sorted_recommendations = sorted(recommendations, key=lambda x: x['similarity'], reverse=True)[:3]
            print(f"recommend_groups : {len(sorted_recommendations)} recommandations populaires générées pour user_id {user_id}: {[r['group_id'] for r in sorted_recommendations]}")
            return sorted_recommendations

        user_embedding = model.encode(user_skills_text)
        for group_id, group_info in group_classifications.items():
            if group_id not in user_groups:
                group_skills_text = ' '.join([preprocess_text(skill) for skill in group_info['skills']])
                if group_skills_text:
                    group_embedding = model.encode(group_skills_text)
                    similarity = cosine_similarity([user_embedding], [group_embedding])[0][0]
                else:
                    # Si pas de skills, utiliser un score par défaut
                    print(f"recommend_groups : Aucun texte de compétences pour group_id {group_id}, attribution d'un score par défaut")
                    similarity = 0.3  # Score par défaut pour les groupes sans skills
                recommendations.append({
                    'group_id': group_id,
                    'group_name': group_info['name'],
                    'category': group_info['category'],
                    'skills': group_info['skills'],
                    'similarity': float(similarity)
                })
        sorted_recommendations = sorted(recommendations, key=lambda x: x['similarity'], reverse=True)[:3]
        print(f"recommend_groups : {len(sorted_recommendations)} recommandations générées pour user_id {user_id}: {[r['group_id'] for r in sorted_recommendations]}")
        return sorted_recommendations
    except Exception as e:
        print(f"Erreur dans recommend_groups pour user_id {user_id}: {e}")
        return []

# Chemin absolu pour emojis.json
BASE_DIR = r"D:\CloneMainPi\Skill-Exchange-full-stack-JS\backend\recommendation_groupe_model"
EMOJI_FILE = os.path.join(BASE_DIR, "data", "emojis.json")

# Charger les emojis
def load_emojis():
    if not os.path.exists(EMOJI_FILE):
        print(f"Erreur : Fichier {EMOJI_FILE} non trouvé")
        return {}
    try:
        with open(EMOJI_FILE, 'r', encoding='utf-8') as f:
            emojis_data = json.load(f)
        # Créer un dictionnaire {émotion: emoji} basé sur l'émotion dominante
        emoji_map = {}
        for item in emojis_data:
            if 'emoji' in item and 'emotions' in item:
                emotions = item['emotions']
                # Trouver l'émotion dominante (valeur = 1)
                for emotion, value in emotions.items():
                    if value == 1 and emotion not in ['positive', 'negative']:  # Ignorer positive/negative
                        emoji_map[emotion] = item['emoji']
                        break
        # Ajouter neutral si absent
        if 'neutral' not in emoji_map:
            emoji_map['neutral'] = '😐'
        return emoji_map
    except Exception as e:
        print(f"Erreur lors de la lecture de {EMOJI_FILE} : {e}")
        return {}

emojis = load_emojis()

# Dictionnaire de secours pour les emojis
default_emojis = {
    'anger': '😣',
    'anticipation': '😮',
    'disgust': '🤢',
    'fear': '😨',
    'joy': '😊',
    'sadness': '😔',
    'surprise': '😮',
    'trust': '🤝',
    'neutral': '😐'
}

# Mapper les codes de langue
def map_langdetect_to_lexicon(message, db):
    # Normaliser le message
    cleaned_message = re.sub(r'[^\w\s]', ' ', message.lower())
    words = [word for word in cleaned_message.split() if word]
    
    # Liste des langues supportées
    supported_languages = ['eng', 'fra', 'ara', 'tun', 'universal']
    
    # Compter les correspondances dans chaque lexique
    lang_matches = {lang: 0 for lang in supported_languages}
    for word in words:
        for lang in supported_languages:
            if db.SentimentLexicon.find_one({'word': word, 'language': lang}):
                lang_matches[lang] += 1
    
    # Trouver la langue avec le plus de correspondances
    max_matches = max(lang_matches.values())
    if max_matches > 0:
        detected_lang = max(lang_matches, key=lang_matches.get)
        print(f"Détection basée sur le lexique : {detected_lang} avec {max_matches} correspondances")
        return detected_lang
    
    # Fallback vers langdetect si aucune correspondance ou égalité
    try:
        if len(message.strip()) < 3:
            print("Message trop court, défaut à 'eng'")
            return 'eng'
        detected_lang = detect(message)
        mapping = {
            'en': 'eng',
            'fr': 'fra',
            'ar': 'ara',
            'tun': 'tun'
        }
        lang = mapping.get(detected_lang, 'eng')
        print(f"Détection basée sur langdetect : {lang}")
        return lang
    except Exception as e:
        print(f"Erreur de détection avec langdetect : {e}, défaut à 'eng'")
        return 'eng'

# Choisir un emoji basé sur les émotions
def get_emoji(emotions):
    if not emojis:
        print("Avertissement : Aucun emoji chargé, utilisation des emojis par défaut")
        emoji_map = default_emojis
    else:
        emoji_map = emojis
    max_emotion = max(emotions.items(), key=lambda x: x[1], default=('neutral', 0))[0]
    return emoji_map.get(max_emotion, '😐')

# Route pour l'analyse des sentiments
@app.route('/api/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        message = data.get('message', '')
        language = data.get('language', 'auto')

        if not message or not isinstance(message, str):
            return jsonify({'error': 'Message invalide ou manquant'}), 400

        # Détecter la langue
        try:
            if language == 'auto':
                lexicon_lang = map_langdetect_to_lexicon(message, db)
            else:
                lexicon_lang = language if language in ['eng', 'fra', 'ara', 'tun'] else 'eng'
        except Exception as e:
            print(f"Erreur de détection de langue : {e}")
            lexicon_lang = 'eng'

        print(f"Langue détectée : {lexicon_lang}")

        # Tokeniser le message avec regex et split
        cleaned_message = re.sub(r'[^\w\s]', ' ', message.lower())
        words = [word for word in cleaned_message.split() if word]
        print(f"Mots analysés : {words}")

        # Initialiser les émotions
        emotions = defaultdict(float)
        emotions_list = ['anger', 'anticipation', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'trust', 'positive', 'negative']
        for emotion in emotions_list:
            emotions[emotion] = 0.0

        lexicon_words = []
        # Rechercher les mots dans le lexique
        for word in words:
            result = db.SentimentLexicon.find_one({
                'word': word,
                'language': {'$in': [lexicon_lang, 'universal']}
            })
            if result:
                lexicon_words.append(word)
                word_emotions = result['emotions']
                for emotion in emotions_list:
                    emotions[emotion] += word_emotions.get(emotion, 0)
                print(f"Mot '{word}' trouvé dans le lexique avec émotions : {word_emotions}")

        print(f"Mots du lexique pour '{lexicon_lang}' : {lexicon_words}")

        # Normaliser les émotions
        if lexicon_words:
            for emotion in emotions:
                emotions[emotion] = emotions[emotion] / len(lexicon_words)

        # Arrondir les émotions
        emotions = {k: round(v, 2) for k, v in emotions.items()}

        # Choisir l'emoji
        emoji = get_emoji(emotions)

        return jsonify({
            'emotions': emotions,
            'emoji': emoji,
            'language': lexicon_lang
        }), 200

    except Exception as e:
        print(f"Erreur dans /api/analyze_sentiment : {str(e)}")
        return jsonify({'error': str(e)}), 500

# Gestion des messages SocketIO
@socketio.on('message')
def handle_message(data):
    print(f"Données reçues via SocketIO : {data}")
    message = data.get('message')
    user_id = data.get('user_id')
    group_id = data.get('group_id')
    receiver_id = data.get('receiver_id')
    language = data.get('language', 'auto')

    if not message or not user_id or not group_id:
        print("Erreur : Données de message invalides")
        emit('error', {'message': 'Invalid message data'})
        return

    # Vérifier si c'est une conversation individuelle
    is_individual = False
    conversation = None
    try:
        conversation = db.conversations.find_one({'_id': ObjectId(group_id)})
        if conversation and not conversation.get('isGroup', False) and len(conversation.get('participants', [])) == 2:
            is_individual = True
    except Exception as e:
        print(f"Erreur lors de la vérification de la conversation {group_id}: {e}")

    # Détecter la langue
    try:
        if language == 'auto':
            lexicon_lang = map_langdetect_to_lexicon(message, db)
        else:
            lexicon_lang = language if language in ['eng', 'fra', 'ara', 'tun'] else 'eng'
        print(f"Langue détectée pour le message '{message}': {lexicon_lang}")
    except Exception as e:
        lexicon_lang = 'eng'
        print(f"Erreur de détection de langue pour '{message}': {e}, défaut à 'eng'")

    # Analyser le sentiment
    try:
        print(f"Analyse du sentiment pour le message : {message}")
        cleaned_message = re.sub(r'[^\w\s]', ' ', message.lower())
        words = [word for word in cleaned_message.split() if word]
        emotions = defaultdict(float)
        emotions_list = ['anger', 'anticipation', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'trust', 'positive', 'negative']
        for emotion in emotions_list:
            emotions[emotion] = 0.0

        lexicon_words = []
        for word in words:
            result = db.SentimentLexicon.find_one({
                'word': word,
                'language': {'$in': [lexicon_lang, 'universal']}
            })
            if result:
                lexicon_words.append(word)
                word_emotions = result['emotions']
                for emotion in emotions_list:
                    emotions[emotion] += word_emotions.get(emotion, 0)
                print(f"Mot '{word}' trouvé dans le lexique avec émotions : {word_emotions}")

        print(f"Mots du lexique pour '{lexicon_lang}' : {lexicon_words}")

        if lexicon_words:
            for emotion in emotions:
                emotions[emotion] = emotions[emotion] / len(lexicon_words)

        emotions = {k: round(v, 2) for k, v in emotions.items()}
        emoji = get_emoji(emotions)
        print(f"Résultat de l'analyse du sentiment : {emotions}, Emoji : {emoji}")
    except Exception as e:
        print(f"Erreur lors de l'analyse du sentiment pour '{message}': {e}")
        emotions = {
            'anger': 0.0, 'anticipation': 0.0, 'disgust': 0.0, 'fear': 0.0, 'joy': 0.0,
            'negative': 0.0, 'positive': 0.0, 'sadness': 0.0, 'surprise': 0.0, 'trust': 0.0
        }
        emoji = '😐'

    # Stocker le message dans MongoDB
    message_data = {
        'sender': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        'conversation': ObjectId(group_id),
        'content': message,
        'language': lexicon_lang,
        'emotions': emotions,
        'emoji': emoji,
        'createdAt': datetime.utcnow(),
        'isSystemMessage': False,
        'read': True,
        'edited': False,
        'deletedFor': [],
        'reactions': [],
        'attachments': []
    }

    if is_individual and receiver_id:
        message_data['receiver'] = ObjectId(receiver_id) if ObjectId.is_valid(receiver_id) else receiver_id
        message_data['receiverEmotions'] = emotions
        message_data['receiverEmoji'] = emoji

    try:
        message_id = db.messages.insert_one(message_data).inserted_id
        print(f"Message inséré avec ID : {message_id}")
    except Exception as e:
        print(f"Erreur lors de l'insertion du message dans MongoDB : {e}")
        emit('error', {'message': 'Failed to store message'})
        return

    # Mettre à jour la conversation
    try:
        db.conversations.update_one(
            {'_id': ObjectId(group_id)},
            {
                '$push': {'messages': message_id},
                '$set': {
                    'lastMessage': {
                        'content': message,
                        'sender': user_id,
                        'createdAt': datetime.utcnow()
                    }
                }
            }
        )
        print(f"Conversation {group_id} mise à jour avec le dernier message")
    except Exception as e:
        print(f"Erreur lors de la mise à jour de la conversation {group_id}: {e}")

    # Émettre le message
    message_data['_id'] = str(message_id)
    message_data['conversation'] = str(group_id)
    message_data['sender'] = str(user_id)
    message_data['createdAt'] = message_data['createdAt'].isoformat()
    if 'receiver' in message_data:
        message_data['receiver'] = str(message_data['receiver'])
    print(f"Émission du message via SocketIO : {message_data}")
    emit('message', message_data, broadcast=True, room=group_id)

# Route pour afficher le cache
@app.route('/api/cache', methods=['GET'])
def get_cache():
    try:
        if db is None:
            print("Erreur : Connexion à la base de données non disponible")
            return jsonify({'error': 'Connexion à la base de données non disponible'}), 500

        # Récupérer group_classifications
        group_cache = list(db.group_classifications.find())
        group_cache_cleaned = [
            {
                'group_id': str(doc['group_id']),
                'name': doc['name'],
                'category': doc['category'],
                'skills': doc['skills'],
                'similarity': float(doc['similarity']),
                'last_updated': doc['last_updated'].isoformat()
            }
            for doc in group_cache
        ]
        print(f"Cache group_classifications : {len(group_cache_cleaned)} entrées trouvées")

        # Récupérer user_classifications
        user_cache = list(db.user_classifications.find())
        user_cache_cleaned = [
            {
                'user_id': str(doc['user_id']),
                'keywords': doc['keywords'],
                'category': doc['category'],
                'skills': doc['skills'],
                'similarity': float(doc['similarity']),
                'last_updated': doc['last_updated'].isoformat()
            }
            for doc in user_cache
        ]
        print(f"Cache user_classifications : {len(user_cache_cleaned)} entrées trouvées")

        return jsonify({
            'group_classifications': group_cache_cleaned,
            'user_classifications': user_cache_cleaned
        }), 200
    except Exception as e:
        print(f"Erreur dans /api/cache : {str(e)}")
        return jsonify({'error': str(e)}), 500

# Route pour la santé
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

# Route pour le feedback
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        message_id = data.get('message_id')
        user_feedback = data.get('feedback')

        db.SentimentFeedback.insert_one({
            'messageId': message_id,
            'feedback': user_feedback,
            'createdAt': datetime.utcnow()
        })

        return jsonify({'status': 'feedback submitted'})
    except Exception as e:
        print(f"Erreur dans /api/feedback : {e}")
        return jsonify({'error': str(e)}), 500

# Route pour les recommandations de groupes
@app.route('/api/recommend_groups', methods=['POST'])
def recommend_groups_endpoint():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        print(f"Requête /api/recommend_groups reçue pour user_id {user_id}")
        if not user_id:
            print("Erreur : user_id manquant dans la requête")
            return jsonify({'error': 'user_id is required'}), 400
        
        if db is None:
            print("Erreur : Connexion à la base de données non disponible")
            return jsonify({'error': 'Connexion à la base de données non disponible'}), 500
        
        if coursera_df is None or coursera_df.empty:
            print("Erreur : coursera_df non chargé ou vide")
            return jsonify({'error': 'Données de cours non disponibles'}), 500
        
        groups = {
            str(group['_id']): {'name': group.get('groupName', 'Groupe sans nom')}
            for group in db.conversations.find({"isGroup": True})
        }
        print(f"Nombre de groupes trouvés : {len(groups)}")
        
        if not groups:
            print("Aucun groupe trouvé dans la base de données")
            return jsonify({'message': 'Aucun groupe trouvé dans la base de données', 'recommendations': []}), 200
        
        group_classifications = classify_groups(groups, coursera_df, model, db, force_reclassify=True)
        recommendations = recommend_groups(user_id, db, coursera_df, group_classifications, model)
        print(f"Recommandations finales pour user_id {user_id}: {recommendations}")
        return jsonify({'recommendations': recommendations}), 200
    except Exception as e:
        print(f"Erreur dans /api/recommend_groups pour user_id {user_id}: {e}")
        return jsonify({'error': str(e)}), 500

# Route pour les recommandations avec cache
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        print(f"Requête /recommend reçue pour user_id {user_id}")
        if not user_id:
            print("Erreur : user_id manquant dans la requête")
            return jsonify({'error': 'user_id is required'}), 400
        
        if db is None:
            print("Erreur : Connexion à la base de données non disponible")
            return jsonify({'error': 'Connexion à la base de données non disponible'}), 500
        
        if coursera_df is None or coursera_df.empty:
            print("Erreur : coursera_df non chargé ou vide")
            return jsonify({'error': 'Données de cours non disponibles'}), 500
        
        # Récupérer le cache existant pour user_classifications uniquement
        user_cache = list(db.user_classifications.find())
        user_cache_cleaned = [
            {
                'user_id': str(doc['user_id']),
                'keywords': doc['keywords'],
                'category': doc['category'],
                'skills': doc['skills'],
                'similarity': float(doc['similarity']),
                'last_updated': doc['last_updated'].isoformat()
            }
            for doc in user_cache
        ]
        print(f"Cache user_classifications : {len(user_cache_cleaned)} entrées trouvées")

        # Récupérer tous les groupes
        groups = {
            str(group['_id']): {'name': group.get('groupName', 'Groupe sans nom')}
            for group in db.conversations.find({"isGroup": True})
        }
        print(f"Nombre de groupes trouvés : {len(groups)}")
        
        if not groups:
            print("Aucun groupe trouvé dans la base de données")
            return jsonify({
                'message': 'Aucun groupe trouvé dans la base de données',
                'recommendations': [],
                'cache': {
                    'group_classifications': [],
                    'user_classifications': user_cache_cleaned
                }
            }), 200
        
        # Forcer la reclassification des groupes
        group_classifications = classify_groups(groups, coursera_df, model, db, force_reclassify=True)
        
        # Récupérer le cache mis à jour pour group_classifications
        group_cache = list(db.group_classifications.find())
        group_cache_cleaned = [
            {
                'group_id': str(doc['group_id']),
                'name': doc['name'],
                'category': doc['category'],
                'skills': doc['skills'],
                'similarity': float(doc['similarity']),
                'last_updated': doc['last_updated'].isoformat()
            }
            for doc in group_cache
        ]
        print(f"Cache group_classifications : {len(group_cache_cleaned)} entrées trouvées")

        # Générer les recommandations
        recommendations = recommend_groups(user_id, db, coursera_df, group_classifications, model)
        print(f"Recommandations finales pour user_id {user_id}: {recommendations}")
        return jsonify({
            'recommendations': recommendations,
            'cache': {
                'group_classifications': group_cache_cleaned,
                'user_classifications': user_cache_cleaned
            }
        }), 200
    except Exception as e:
        print(f"Erreur dans /recommend pour user_id {user_id}: {e}")
        return jsonify({
            'error': str(e),
            'cache': {
                'group_classifications': [],
                'user_classifications': user_cache_cleaned if 'user_cache_cleaned' in locals() else []
            }
        }), 500





# Route pour le message initial du chatbot
@app.route('/api/chatbot/initial-message', methods=['GET'])
def chatbot_initial_message():
    try:
        initial_message = "Sbeh el khis, chnouwa najem n3awnek el lioum 😊"
        return jsonify({"message": initial_message}), 200
    except Exception as e:
        print(f"Erreur dans /api/chatbot/initial-message : {str(e)}")
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    create_mongodb_indexes()
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, use_reloader=False)