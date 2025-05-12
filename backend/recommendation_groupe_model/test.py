from utils.sentiment_analyzer import analyze_sentiment

message = "I love you I am so happy"
result = analyze_sentiment(message, language='eng')
print(result)