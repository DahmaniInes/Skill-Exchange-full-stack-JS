from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib
import logging
import os

app = Flask(__name__)

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Chemins des fichiers
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'random_forest_model.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
LABEL_ENCODER_SKILL_PATH = os.path.join(MODEL_DIR, 'label_encoder_skill.pkl')
LABEL_ENCODER_SPEED_PATH = os.path.join(MODEL_DIR, 'label_encoder_speed.pkl')
LABEL_ENCODER_COMPETENCES_PATH = os.path.join(MODEL_DIR, 'label_encoder_competences.pkl')
DATA_PATH = os.path.join(BASE_DIR, 'data', 'data3.xls')

# Définir l'ordre des features explicitement
FEATURE_ORDER = [
    'skill_name', 'progression', 'temps_consacre_heures', 'nombre_sessions',
    'regularity_score', 'taux_reussite_exercices', 'competences_prealables',
    'risque_abandon', 'engagement_score', 'user_learning_speed', 'user_retention_days'
]

# Créer le dossier models s'il n'existe pas
def ensure_model_directory():
    try:
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)
            logger.info(f"Dossier créé : {MODEL_DIR}")
        if not os.access(MODEL_DIR, os.W_OK):
            raise PermissionError(f"Permission d'écriture manquante pour le dossier : {MODEL_DIR}")
    except Exception as e:
        logger.error(f"Erreur lors de la création du dossier {MODEL_DIR} : {str(e)}")
        raise

# Fonction pour charger et préparer les données
def load_and_prepare_data():
    try:
        if not os.path.exists(DATA_PATH):
            logger.error(f"Le fichier {DATA_PATH} n'existe pas")
            raise FileNotFoundError(f"Le fichier {DATA_PATH} n'existe pas")
        
        df = pd.read_csv(DATA_PATH)
        logger.info("Données chargées avec succès")
        
        logger.info(f"Colonnes du fichier : {df.columns.tolist()}")
        logger.info(f"Types de colonnes : {df.dtypes}")
        
        if 'user-id' in df.columns:
            df = df.rename(columns={'user-id': 'user_id'})
        
        columns_to_drop = [
            'user_id', 'course_id', 'skill_category', 'skill_difficulty',
            'date_debut_apprentissage', 'date_derniere_activite', 'statut_apprentissage'
        ]
        existing_columns_to_drop = [col for col in columns_to_drop if col in df.columns]
        df = df.drop(columns=existing_columns_to_drop)
        
        # Réorganiser les colonnes pour correspondre à FEATURE_ORDER
        missing_features = [f for f in FEATURE_ORDER if f not in df.columns]
        if missing_features:
            logger.error(f"Colonnes manquantes dans les données : {missing_features}")
            raise ValueError(f"Colonnes manquantes dans les données : {missing_features}")
        
        df = df[FEATURE_ORDER]
        
        # Encoder les variables catégoriques
        label_encoder_skill = LabelEncoder()
        label_encoder_speed = LabelEncoder()
        label_encoder_competences = LabelEncoder()
        
        # Remplir les valeurs manquantes et inclure 'unknown'
        if 'skill_name' in df.columns:
            df['skill_name'] = df['skill_name'].fillna('unknown')
            unique_skills = np.append(df['skill_name'].unique(), 'unknown')
            label_encoder_skill.fit(unique_skills)
            df['skill_name'] = label_encoder_skill.transform(df['skill_name'])
        
        if 'user_learning_speed' in df.columns:
            df['user_learning_speed'] = df['user_learning_speed'].fillna('unknown')
            unique_speeds = np.append(df['user_learning_speed'].unique(), 'unknown')
            label_encoder_speed.fit(unique_speeds)
            df['user_learning_speed'] = label_encoder_speed.transform(df['user_learning_speed'])
        
        if 'competences_prealables' in df.columns:
            df['competences_prealables'] = df['competences_prealables'].fillna('unknown')
            unique_competences = np.append(df['competences_prealables'].unique(), 'unknown')
            label_encoder_competences.fit(unique_competences)
            df['competences_prealables'] = label_encoder_competences.transform(df['competences_prealables'])
        
        X = df
        y = pd.read_csv(DATA_PATH)['statut_apprentissage']
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        return X_scaled, y, scaler, label_encoder_skill, label_encoder_speed, label_encoder_competences
    except Exception as e:
        logger.error(f"Erreur lors du chargement des données : {str(e)}")
        raise

# Charger les données et entraîner ou charger le modèle
try:
    ensure_model_directory()

    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoder_skill = joblib.load(LABEL_ENCODER_SKILL_PATH)
        label_encoder_speed = joblib.load(LABEL_ENCODER_SPEED_PATH)
        label_encoder_competences = joblib.load(LABEL_ENCODER_COMPETENCES_PATH)
        logger.info("Modèle et encodeurs chargés depuis les fichiers")
        
        # Vérifier que 'unknown' est dans les classes des encodeurs
        if 'unknown' not in label_encoder_skill.classes_:
            new_classes = np.append(label_encoder_skill.classes_, 'unknown')
            label_encoder_skill.classes_ = new_classes
        if 'unknown' not in label_encoder_speed.classes_:
            new_classes = np.append(label_encoder_speed.classes_, 'unknown')
            label_encoder_speed.classes_ = new_classes
        if 'unknown' not in label_encoder_competences.classes_:
            new_classes = np.append(label_encoder_competences.classes_, 'unknown')
            label_encoder_competences.classes_ = new_classes
        
        X_scaled, y, _, _, _, _ = load_and_prepare_data()
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        logger.info("Métriques de performance du modèle :")
        logger.info(f"Précision : {accuracy:.4f}")
        logger.info(f"Précision (weighted) : {precision:.4f}")
        logger.info(f"Rappel (weighted) : {recall:.4f}")
        logger.info(f"F1-Score (weighted) : {f1:.4f}")
        logger.info("Matrice de confusion :")
        logger.info("\n" + str(conf_matrix))
        
    else:
        X_scaled, y, scaler, label_encoder_skill, label_encoder_speed, label_encoder_competences = load_and_prepare_data()
        
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        logger.info("Métriques de performance du modèle :")
        logger.info(f"Précision : {accuracy:.4f}")
        logger.info(f"Précision (weighted) : {precision:.4f}")
        logger.info(f"Rappel (weighted) : {recall:.4f}")
        logger.info(f"F1-Score (weighted) : {f1:.4f}")
        logger.info("Matrice de confusion :")
        logger.info("\n" + str(conf_matrix))
        
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
        joblib.dump(label_encoder_skill, LABEL_ENCODER_SKILL_PATH)
        joblib.dump(label_encoder_speed, LABEL_ENCODER_SPEED_PATH)
        joblib.dump(label_encoder_competences, LABEL_ENCODER_COMPETENCES_PATH)
        logger.info("Modèle et encodeurs sauvegardés avec succès")
        
except Exception as e:
    logger.error(f"Erreur lors de l'initialisation du modèle : {str(e)}")
    raise

# Route pour la prédiction
@app.route('/api/predict_learning_status', methods=['POST'])
def predict_learning_status():
    try:
        data = request.get_json()
        logger.info(f"Données reçues pour prédiction : {data}")
        
        # Si une liste de données est envoyée, traiter chaque élément
        if isinstance(data, list):
            results = []
            for item in data:
                result = predict_single(item, label_encoder_skill, label_encoder_speed, label_encoder_competences, scaler, model)
                results.append(result)
            return jsonify(results)
        else:
            result = predict_single(data, label_encoder_skill, label_encoder_speed, label_encoder_competences, scaler, model)
            return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erreur lors de la prédiction : {str(e)}")
        return jsonify({'error': str(e)}), 500

def predict_single(data, label_encoder_skill, label_encoder_speed, label_encoder_competences, scaler, model):
    # Validation des données
    required_fields = [
        'skill_name', 'progression', 'temps_consacre_heures', 'nombre_sessions',
        'regularity_score', 'taux_reussite_exercices', 'risque_abandon',
        'engagement_score', 'user_learning_speed', 'user_retention_days'
    ]
    
    for field in required_fields:
        if field not in data:
            logger.error(f"Champ manquant : {field}")
            raise ValueError(f'Champ {field} manquant')
            
    # Préparer les données pour la prédiction
    skill_name = data['skill_name'] if data['skill_name'] in label_encoder_skill.classes_ else 'unknown'
    user_learning_speed = data['user_learning_speed'] if data['user_learning_speed'] in label_encoder_speed.classes_ else 'unknown'
    competences_prealables = data.get('competences_prealables', 'unknown')
    if competences_prealables not in label_encoder_competences.classes_:
        competences_prealables = 'unknown'
    
    input_data = {
        'skill_name': label_encoder_skill.transform([skill_name])[0],
        'progression': float(data['progression']),
        'temps_consacre_heures': float(data['temps_consacre_heures']),
        'nombre_sessions': int(data['nombre_sessions']),
        'regularity_score': float(data['regularity_score']),
        'taux_reussite_exercices': float(data['taux_reussite_exercices']),
        'competences_prealables': label_encoder_competences.transform([competences_prealables])[0],
        'risque_abandon': float(data['risque_abandon']),
        'engagement_score': float(data['engagement_score']),
        'user_learning_speed': label_encoder_speed.transform([user_learning_speed])[0],
        'user_retention_days': int(data['user_retention_days'])
    }
    
    # Créer un DataFrame avec l'ordre des features défini
    input_df = pd.DataFrame([input_data], columns=FEATURE_ORDER)
    
    # Standardiser les données
    input_scaled = scaler.transform(input_df)
    
    # Faire la prédiction
    prediction = model.predict(input_scaled)[0]
    prediction_proba = model.predict_proba(input_scaled)[0]
    
    # Obtenir la confiance maximale
    confidence = float(np.max(prediction_proba))
    
    logger.info(f"Prédiction : {prediction}, Confiance : {confidence}")
    
    return {
        'skill_name': data['skill_name'],
        'predicted_status': prediction,
        'confidence': confidence
    }

# Lancer le serveur
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5004)