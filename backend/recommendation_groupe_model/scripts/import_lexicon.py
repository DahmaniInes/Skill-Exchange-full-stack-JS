import pymongo
import csv
import json
import os

# Connexion à MongoDB
client = pymongo.MongoClient("mongodb://127.0.0.1:27017/NovaLAB")
db = client["NovaLAB"]

# Chemins absolus
BASE_DIR = r"D:\CloneMainPi\Skill-Exchange-full-stack-JS\backend\recommendation_groupe_model"
NRC_DIR = os.path.join(BASE_DIR, "data", "nrc_lexicon")
EMOJI_FILE = os.path.join(BASE_DIR, "data", "emojis.json")

def calculate_weight(emotions):
    """Calculate a weight based on emotions for compatibility with older logic."""
    if emotions['positive'] or emotions['joy']:
        return 1.0
    if emotions['negative'] or emotions['sadness']:
        return -1.0
    if emotions['anger'] or emotions['disgust'] or emotions['fear']:
        return -0.8
    if emotions['anticipation'] or emotions['surprise'] or emotions['trust']:
        return 0.5
    return 0.0

def import_language_file(file_path, language, language_code):
    """Import lexicon file for a specific language with normalized language code."""
    if not os.path.exists(file_path):
        print(f"Erreur : Fichier {file_path} non trouvé")
        return
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            entries = []
            key_words = ['love', 'happy']  # Mots à vérifier pour le débogage
            key_words_found = {word: False for word in key_words}
            for row in reader:
                emotions = {
                    'anger': int(row['anger']),
                    'anticipation': int(row['anticipation']),
                    'disgust': int(row['disgust']),
                    'fear': int(row['fear']),
                    'joy': int(row['joy']),
                    'sadness': int(row['sadness']),
                    'surprise': int(row['surprise']),
                    'trust': int(row['trust']),
                    'positive': int(row['positive']),
                    'negative': int(row['negative'])
                }
                word = row.get(f'{language.capitalize()} Word', '').strip()
                if word:
                    entries.append({
                        'word': word.lower(),
                        'language': language_code,
                        'emotions': emotions,
                        'weight': calculate_weight(emotions)
                    })
                    if word.lower() in key_words:
                        key_words_found[word.lower()] = True
                        print(f"Mot '{word}' trouvé dans {language} avec émotions : {emotions}")
            db.SentimentLexicon.insert_many(entries)
            print(f"Importé {len(entries)} mots pour {language} (code: {language_code})")
            for word, found in key_words_found.items():
                if not found:
                    print(f"Attention : Mot '{word}' NON trouvé dans {language}")
    except Exception as e:
        print(f"Erreur lors de l'importation de {file_path} : {e}")

def import_english_lexicon():
    """Import English lexicon from individual emotion files."""
    emotions = ['anger', 'anticipation', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'trust', 'positive', 'negative']
    word_scores = {}
    key_words = ['love', 'happy']  # Mots à vérifier pour le débogage
    key_words_found = {word: [] for word in key_words}
    
    for emotion in emotions:
        file_path = os.path.join(NRC_DIR, "OneFilePerEmotion", f"{emotion}-NRC-Emotion-Lexicon.txt")
        if not os.path.exists(file_path):
            print(f"Erreur : Fichier {file_path} non trouvé")
            continue
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    # Gérer le format mot\tcoefficient
                    parts = line.strip().split('\t')
                    if len(parts) == 2:
                        word, coefficient = parts
                        word = word.strip()
                        coefficient = int(coefficient)
                        if word:
                            if word.lower() in key_words and coefficient == 1:
                                key_words_found[word.lower()].append(emotion)
                                print(f"Mot '{word}' trouvé dans {emotion}-NRC-Emotion-Lexicon.txt avec coefficient {coefficient}")
                            if word not in word_scores:
                                word_scores[word] = {e: 0 for e in emotions}
                            if coefficient == 1:
                                word_scores[word][emotion] = 1
        except Exception as e:
            print(f"Erreur lors de la lecture de {file_path} : {e}")
    
    entries = [
        {
            'word': word.lower(),
            'language': 'eng',
            'emotions': scores,
            'weight': calculate_weight(scores)
        }
        for word, scores in word_scores.items()
    ]
    db.SentimentLexicon.insert_many(entries)
    print(f"Importé {len(entries)} mots pour anglais (code: eng)")
    for word, emotions in key_words_found.items():
        if emotions:
            print(f"Mot '{word}' trouvé dans les fichiers : {emotions}")
        else:
            print(f"Attention : Mot '{word}' NON trouvé avec coefficient 1 dans le lexique anglais")

def import_emojis():
    """Import emojis from JSON file."""
    if not os.path.exists(EMOJI_FILE):
        print(f"Erreur : Fichier {EMOJI_FILE} non trouvé")
        return
    try:
        with open(EMOJI_FILE, 'r', encoding='utf-8') as f:
            emojis = json.load(f)
        entries = [
            {
                'word': emoji['emoji'],
                'language': 'universal',
                'emotions': emoji['emotions'],
                'weight': calculate_weight(emoji['emotions'])
            }
            for emoji in emojis
        ]
        db.SentimentLexicon.insert_many(entries)
        print(f"Importé {len(entries)} emojis")
    except Exception as e:
        print(f"Erreur lors de l'importation de {EMOJI_FILE} : {e}")

def main():
    """Main function to import all lexicons."""
    # Vider la collection
    db.SentimentLexicon.drop()
    print("Collection SentimentLexicon vidée")
    
    # Importer les lexiques avec codes normalisés
    import_language_file(os.path.join(NRC_DIR, "French-NRC-EmoLex.txt"), 'French', 'fra')
    import_language_file(os.path.join(NRC_DIR, "Arabic-NRC-EmoLex.txt"), 'Arabic', 'ara')
    import_language_file(os.path.join(NRC_DIR, "Tunis-NRC-EmoLex.txt"), 'Tunisian', 'tun')
    import_english_lexicon()
    import_emojis()

if __name__ == "__main__":
    main()