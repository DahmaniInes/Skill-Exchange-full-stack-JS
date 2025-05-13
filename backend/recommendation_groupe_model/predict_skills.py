from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
import re
from collections import defaultdict
import pickle
import os

# Initialiser Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5000"]}})

# Connexion à MongoDB
def connect_to_mongodb():
    try:
        client = MongoClient("mongodb://127.0.0.1:27017/")
        db = client["NovaLAB"]
        print("Connexion à MongoDB réussie")
        return db
    except Exception as e:
        print(f"Erreur de connexion à MongoDB : {e}")
        return None

# Charger coursera.csv et préparer les données
def load_coursera_data(file_path="data/coursera.csv"):
    try:
        df = pd.read_csv(file_path)
        def clean_skills(skills_str):
            if not isinstance(skills_str, str) or skills_str.strip() in ['{}', '{""}', '', '[]']:
                return []
            try:
                skills = re.findall(r'"([^"]+)"', skills_str)
                skills = [skill.strip() for skill in skills if skill.strip()]
                return skills if skills else []
            except Exception as e:
                print(f"Erreur de parsing pour '{skills_str[:30]}...' : {e}")
                return []
        df['skills'] = df['skills'].apply(clean_skills)
        initial_rows = len(df)
        df = df[df['skills'].apply(lambda x: len(x) > 0)]
        print(f"Lignes supprimées avec 'skills' vide : {initial_rows - len(df)}")
        df['skills_text'] = df['skills'].apply(lambda x: ' '.join([preprocess_text(skill) for skill in x]))
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

# Récupérer les messages récents d'un utilisateur
def get_user_messages(user_id, db, days=30):
    try:
        user_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        messages = db.messages.find({
            "sender": user_id,
            "isSystemMessage": False,
            "createdAt": {"$gte": cutoff_date}
        })
        messages_list = [msg["content"] for msg in messages if "content" in msg and msg["content"] and len(msg["content"].strip()) >= 5]
        print(f"get_user_messages : {len(messages_list)} messages trouvés pour user_id {user_id}: {messages_list[:3]}")
        return messages_list if messages_list else ["No recent activity"]
    except Exception as e:
        print(f"Erreur lors de la récupération des messages pour user_id {user_id}: {e}")
        return ["No recent activity"]

# Entraîner le modèle SVM
def train_svm_model(coursera_df, model_path="svm_model.pkl"):
    try:
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                vectorizer, svm_model = pickle.load(f)
            print("Modèle SVM chargé depuis", model_path)
            return vectorizer, svm_model

        # Préparer les données d'entraînement
        # Utiliser la première compétence comme label pour simplifier (classification multi-classe)
        X = coursera_df['skills_text']
        y = coursera_df['skills'].apply(lambda x: x[0] if x else None).dropna()
        X = X.loc[y.index]  # Aligner X et y

        # Vectorisation TF-IDF
        vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        X_tfidf = vectorizer.fit_transform(X)

        # Diviser les données
        X_train, X_test, y_train, y_test = train_test_split(X_tfidf, y, test_size=0.2, random_state=42)

        # Entraîner le modèle SVM
        svm_model = SVC(kernel='linear', probability=True, random_state=42)
        svm_model.fit(X_train, y_train)

        # Évaluer le modèle
        y_pred = svm_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        print(f"Performance du modèle SVM sur les données de test :")
        print(f"  Accuracy: {accuracy:.4f}")
        print(f"  F1-Score: {f1:.4f}")

        # Sauvegarder le modèle
        with open(model_path, 'wb') as f:
            pickle.dump((vectorizer, svm_model), f)
        print("Modèle SVM sauvegardé à", model_path)

        return vectorizer, svm_model
    except Exception as e:
        print(f"Erreur lors de l'entraînement du modèle SVM : {e}")
        return None, None

# Prédire les compétences avec SVM
def predict_user_skills(user_id, db, vectorizer, svm_model):
    try:
        # Récupérer l'utilisateur
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            print(f"Aucun utilisateur trouvé pour _id {user_id}")
            return None

        # Récupérer les messages récents
        user_messages = get_user_messages(user_id, db, days=30)
        user_text = ' '.join([preprocess_text(msg) for msg in user_messages])
        if not user_text or user_text == 'no recent activity':
            print(f"Aucun texte pour user_id {user_id}")
            return {
                'user_id': user_id,
                'firstName': user.get('firstName', 'Unknown'),
                'lastName': user.get('lastName', 'Unknown'),
                'keywords': [],
                'predicted_skills': [],
                'confidence_scores': []
            }

        # Extraire les mots-clés
        temp_vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
        try:
            temp_vectorizer.fit_transform([user_text])
            keywords = temp_vectorizer.get_feature_names_out().tolist()
        except Exception as e:
            print(f"Erreur lors de l'extraction des mots-clés pour user_id {user_id}: {e}")
            keywords = []

        # Vectoriser le texte avec le vectorizer du modèle
        user_tfidf = vectorizer.transform([user_text])

        # Prédire la compétence
        predicted_skill = svm_model.predict(user_tfidf)[0]
        confidence = svm_model.predict_proba(user_tfidf)[0].max()

        result = {
            'user_id': user_id,
            'firstName': user.get('firstName', 'Unknown'),
            'lastName': user.get('lastName', 'Unknown'),
            'keywords': keywords,
            'predicted_skills': [predicted_skill],
            'confidence_scores': [round(float(confidence), 4)]
        }
        print(f"Prédiction pour user_id {user_id}: {result}")
        return result
    except Exception as e:
        print(f"Erreur dans predict_user_skills pour user_id {user_id}: {e}")
        return None

# Tester la performance sur les utilisateurs
def test_skill_prediction(db, coursera_df, vectorizer, svm_model, test_samples=10):
    try:
        users = list(db.users.find().limit(test_samples))
        predictions = []
        true_skills = []
        predicted_skills = []

        for user in users:
            user_id = str(user['_id'])
            messages = get_user_messages(user_id, db, days=30)
            if messages == ["No recent activity"]:
                # Générer un message fictif
                sample_skill = coursera_df['skills'].iloc[np.random.randint(0, len(coursera_df))][0]
                while sample_skill.startswith('(') and 'reviews' in sample_skill:
                    sample_skill = coursera_df['skills'].iloc[np.random.randint(0, len(coursera_df))][0]
                messages = [f"I'm learning {sample_skill}"]
            else:
                sample_skill = None  # Pas de compétence vraie pour les messages réels

            prediction = predict_user_skills(user_id, db, vectorizer, svm_model)
            if prediction:
                predictions.append(prediction)
                predicted_skills.append(prediction['predicted_skills'][0])
                true_skills.append(sample_skill if sample_skill else "Unknown")

        # Calculer les métriques (seulement pour les utilisateurs avec compétence vraie)
        valid_indices = [i for i, true_skill in enumerate(true_skills) if true_skill != "Unknown"]
        if valid_indices:
            valid_true = [true_skills[i] for i in valid_indices]
            valid_pred = [predicted_skills[i] for i in valid_indices]
            accuracy = accuracy_score(valid_true, valid_pred)
            f1 = f1_score(valid_true, valid_pred, average='weighted')
            print(f"Performance sur les utilisateurs :")
            print(f"  Accuracy: {accuracy:.4f}")
            print(f"  F1-Score: {f1:.4f}")
        else:
            accuracy, f1 = 0, 0
            print("Aucune compétence vraie disponible pour évaluer les utilisateurs.")

        return predictions, accuracy, f1
    except Exception as e:
        print(f"Erreur dans test_skill_prediction: {e}")
        return [], 0, 0

# Fonction pour exécuter le test au démarrage
def run_initial_test(db, coursera_df, vectorizer, svm_model):
    try:
        if db is None:
            print("Erreur : Connexion à la base de données non disponible")
            return
        if coursera_df is None or coursera_df.empty:
            print("Erreur : Données de cours non disponibles")
            return

        # Récupérer tous les utilisateurs
        users = list(db.users.find())
        print(f"Nombre d'utilisateurs trouvés : {len(users)}")

        # Tester les prédictions
        predictions, accuracy, f1 = test_skill_prediction(db, coursera_df, vectorizer, svm_model, test_samples=min(10, len(users)))

        # Afficher les résultats
        print("\n=== Résultats des prédictions pour l'administrateur ===")
        for pred in predictions:
            print(f"Utilisateur: {pred['firstName']} {pred['lastName']} ({pred['user_id']})")
            print(f"  Mots-clés: {pred['keywords']}")
            print(f"  Compétences prédites: {pred['predicted_skills']}")
            print(f"  Scores de confiance: {pred['confidence_scores']}")
            print("-" * 50)

        print(f"Métriques finales :")
        print(f"  Accuracy: {accuracy:.4f}")
        print(f"  F1-Score: {f1:.4f}")
        if accuracy > 0.5 and f1 > 0.5:
            print("✅ Les métriques sont satisfaisantes ! Vous pouvez utiliser le serveur Flask.")
        else:
            print("⚠️ Les métriques sont faibles. Essayez d'ajouter des messages plus explicites.")
    except Exception as e:
        print(f"Erreur dans run_initial_test: {e}")

# Route pour l'administrateur
@app.route('/api/predict_skills', methods=['GET'])
def predict_skills():
    try:
        if db is None:
            return jsonify({'error': 'Connexion à la base de données non disponible'}), 500
        if coursera_df is None or coursera_df.empty:
            return jsonify({'error': 'Données de cours non disponibles'}), 500

        # Récupérer tous les utilisateurs
        users = list(db.users.find())
        print(f"Nombre d'utilisateurs trouvés : {len(users)}")

        predictions = []
        for user in users:
            user_id = str(user['_id'])
            prediction = predict_user_skills(user_id, db, vectorizer, svm_model)
            if prediction:
                predictions.append(prediction)

        return jsonify({
            'predictions': predictions,
            'metrics': {
                'accuracy': 0,  # Métriques non recalculées ici
                'f1_score': 0
            }
        }), 200
    except Exception as e:
        print(f"Erreur dans /api/predict_skills: {e}")
        return jsonify({'error': str(e)}), 500

# Route pour la santé
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

# Initialisation
db = connect_to_mongodb()
coursera_df = load_coursera_data('data/coursera.csv')
vectorizer, svm_model = train_svm_model(coursera_df)

# Exécuter le test initial
if __name__ == '__main__':
    run_initial_test(db, coursera_df, vectorizer, svm_model)
    app.run(host='0.0.0.0', port=5004, debug=True)