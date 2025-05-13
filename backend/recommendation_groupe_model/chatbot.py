from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime
import pandas as pd
import re
import os
from fuzzywuzzy import fuzz  # Ajout de fuzzywuzzy pour la correspondance approximative

app = Flask(__name__)

# Connexion MongoDB
def connect_to_mongodb():
    try:
        client = MongoClient("mongodb://127.0.0.1:27017/")
        db = client["NovaLAB"]
        db.command("ping")
        print("Connexion à MongoDB réussie pour le chatbot")
        return db
    except Exception as e:
        print(f"Erreur de connexion à MongoDB pour le chatbot : {e}")
        return None

db = connect_to_mongodb()

# Charger le dataset Coursera
def load_coursera_data(file_path="data/coursera.csv"):
    try:
        if not os.path.exists(file_path):
            print(f"Fichier {file_path} non trouvé!")
            return None
        df = pd.read_csv(file_path)
        df['skills'] = df['skills'].apply(lambda x: re.findall(r'"([^"]+)"', x) if isinstance(x, str) else [])
        print(f"Chargement de {file_path} réussi avec {len(df)} entrées.")
        return df
    except Exception as e:
        print(f"Erreur lors du chargement de {file_path} : {e}")
        return None

# Charger le dataset des compétences avec gestion manuelle des virgules
def load_skills_data(file_path="data/Skills_Descriptions_Tunisian_Complete.csv"):
    try:
        if not os.path.exists(file_path):
            print(f"Fichier {file_path} non trouvé!")
            return None

        data = []
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            headers = lines[0].strip().split(',', 1)
            for line in lines[1:]:
                parts = line.strip().split(',', 1)
                if len(parts) == 2:
                    data.append(parts)
                else:
                    print(f"Ligne mal formatée ignorée : {line.strip()}")

        df = pd.DataFrame(data, columns=headers)
        print(f"Chargement de {file_path} réussi avec {len(df)} entrées.")
        return df
    except Exception as e:
        print(f"Erreur lors du chargement de {file_path} : {e}")
        return None

coursera_df = load_coursera_data()
skills_df = load_skills_data()

# Fonction pour trouver des informations ou répondre
def find_courses(user_input):
    if coursera_df is None or skills_df is None:
        return "Désolé, ma najjmech n7emel l-fichiers ta3 l-cours w l-skills! Chouf ken el fichiers ta3ek fi 'data/' w 5eddemhom barcha."

    user_input = user_input.lower().strip()
    
    # Gestion des questions hors sujet (ex. date)
    if "date" in user_input or "lioum" in user_input:
        current_date = datetime.now().strftime("%d/%m/%Y")
        return f"L-youm {current_date}. Ken 3andek so2al o5er, t7eb t3arf 3la 7aja tanya, ma t7ebbesnich!"

    # Détection des intentions
    keywords = {
        r'entii|chcounek|entaa|chnouwa ta3mel|chcoun|chkun': 'who',
        r'a7kili 3la|a3tini des infos 3la|golli 3la|kfeh|chnou ta3mel': 'info'
    }
    
    intent = 'unknown'
    for pattern, action in keywords.items():
        if re.search(pattern, user_input, re.IGNORECASE):
            intent = action
            break
    
    if intent == 'who':
        return "Ana chatbot mte3 MindSpark, houni bash n3awnek t5dem w t3awed! 😊 Nta3mel n3awn el nas y5demou barcha 7kayet w ynajmou y3awdou b-sahla."

    # Recherche directe d'un skill dans l'input (même sans "a7kili 3la")
    # Utilisation de fuzzy matching pour gérer les erreurs (ex. Lunix -> Linux)
    best_match = None
    best_score = 0
    threshold = 80  # Seuil de similarité pour fuzzy matching

    # Recherche dans skills_df
    for skill in skills_df['Skill'].str.lower():
        score = fuzz.partial_ratio(skill, user_input)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = skill

    if best_match:
        skill_info = skills_df[skills_df['Skill'].str.lower() == best_match]
        skill_desc = skill_info.iloc[0]['Description']
        response = f"L-skill '{best_match}' hiya chnuwé: {skill_desc}\n"
        matches = coursera_df[coursera_df['skills'].apply(lambda x: best_match in [sk.lower() for sk in x])]
        if not matches.empty:
            for _, row in matches.iterrows():
                response += f"- Fih fi l-cours {row['course']} (mta3 {row['partner']}): Niveau {row['level']}, Durée {row['duration']}\n"
        other_skills = skills_df[skills_df['Skill'].str.lower() != best_match]['Skill'].head(3).tolist()
        if other_skills:
            response += f"Ken 3andek so2al o5er, t7eb t3arf 3la 7aja tanya, ma t7ebbesnich! Chouf skills o5rin: {', '.join(other_skills)}."
        return response

    # Recherche dans coursera_df (logique existante)
    for skill in coursera_df['skills']:
        for s in skill:
            s = s.lower().strip()
            if s in user_input:
                matches = coursera_df[coursera_df['skills'].apply(lambda x: s in [sk.lower() for sk in x])]
                if not matches.empty:
                    response = f"Voilà les cours pour {s}:\n"
                    for _, row in matches.iterrows():
                        response += f"- {row['course']} (par {row['partner']}): Note {row['rating']}/5, Niveau {row['level']}, Durée {row['duration']}\n"
                    return response

    for course in coursera_df['course'].str.lower():
        if course in user_input:
            match = coursera_df[coursera_df['course'].str.lower() == course]
            if not match.empty:
                row = match.iloc[0]
                return (f"Voilà les infos pour {row['course']}:\n"
                        f"Partenaire: {row['partner']}\n"
                        f"Note: {row['rating']}/5\n"
                        f"Niveau: {row['level']}\n"
                        f"Durée: {row['duration']}\n"
                        f"Compétences: {', '.join(row['skills'])}\n")

    return "Désolé, ma fhemtch 3la chnuwé t7eb! Essaye de préciser el cours ou el compétence (ex. 'Data Analysis' ou 'Google Data Analytics')."

# Route pour gérer les messages du chatbot
@app.route("/chatbot/message", methods=["POST"])
def chatbot_message():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        message = data.get("message")
        
        if not user_id or not message:
            return jsonify({"error": "user_id et message sont requis"}), 400

        response = find_courses(message)

        if db is not None:
            conversation_entry = {
                "user_id": user_id,
                "message": message,
                "response": response,
                "timestamp": datetime.utcnow()
            }
            db.chatbot_conversations.insert_one(conversation_entry)

        return jsonify({"response": response}), 200
    except Exception as e:
        print(f"Erreur dans /chatbot/message : {str(e)}")
        return jsonify({"error": str(e)}), 500

# Route pour récupérer l'historique des conversations
@app.route("/chatbot/history/<user_id>", methods=["GET"])
def chatbot_history(user_id):
    try:
        if db is None:
            return jsonify({"error": "Connexion à la base de données non disponible"}), 500

        conversations = list(db.chatbot_conversations.find({"user_id": user_id}).sort("timestamp", 1))
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            conv["timestamp"] = conv["timestamp"].isoformat()

        return jsonify({"history": conversations}), 200
    except Exception as e:
        print(f"Erreur dans /chatbot/history : {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)