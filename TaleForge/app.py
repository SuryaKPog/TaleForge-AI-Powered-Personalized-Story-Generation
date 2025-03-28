from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv

load_dotenv('OPENAI_API_KEY.env')  # Load from your specific file

app = Flask(__name__)
CORS(app)

# Serve files directly from the root folder
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY is empty or not set")
    
    client = openai.OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully")
    
    test_models = client.models.list()
    print(f"OpenAI connection test successful. Available models: {len(test_models.data)}")
    
except Exception as e:
    print("Failed to initialize OpenAI client:")
    print(f"Error type: {type(e).__name__}")
    print(f"Error details: {str(e)}")
    print("\nTroubleshooting tips:")
    print("1. Verify your .env file contains OPENAI_API_KEY=your_key_here")
    print("2. Check the file is in the correct location")
    print("3. Ensure your OpenAI account is active")
    print("4. Try setting the key directly: client = openai.OpenAI(api_key='sk-...')")
    raise

def adjust_sentiment(story, sentiment):
    sentiment_changes = {
        "Happy": {"dark": "bright", "sad": "joyful", "fear": "hope"},
        "Dark": {"happy": "grim", "joy": "gloomy", "love": "loss"},
        "Mysterious": {"clear": "cryptic", "simple": "enigmatic", "known": "unknown"},
        "Thrilling": {"calm": "intense", "soft": "explosive", "slow": "fast-paced"}
    }

    if sentiment in sentiment_changes:
        for key, value in sentiment_changes[sentiment].items():
            story = story.replace(key, value)
    return story

def create_prompt(genre, setting, character, keywords, sentiment):
    return (f"Write a {genre} story set in {setting}. "
            f"The main character is named {character}. Include elements of {keywords}. "
            f"Make the story engaging and immersive with a {sentiment.lower()} tone.")

@app.route('/')
def serve_frontend():
    return app.send_static_file('index.html')

@app.route('/generate', methods=['POST'])
def handle_generate():
    data = request.json
    genre = data.get('genre', 'Fantasy')
    setting = data.get('setting', 'Space')
    character = data.get('character', 'Hero')
    keywords = data.get('keywords', 'Magic')
    sentiment = data.get('sentiment', 'Happy')

    try:
        prompt = create_prompt(genre, setting, character, keywords, sentiment)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative storyteller."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=700
        )
        
        story = response.choices[0].message.content
        modified_story = adjust_sentiment(story, sentiment)
        
        return jsonify({
            'status': 'success',
            'story': modified_story,
            'original_story': story
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
# Add this new route before if __name__ == '__main__':
@app.route('/generate-art', methods=['POST'])
def generate_art():
    try:
        data = request.json
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"8-bit pixel art of: {data['prompt']}. Vibrant colors, retro video game style, 16-bit era",
            n=1,
            size="1024x1024",
            quality="standard"
        )
        return jsonify({
            'image_url': response.data[0].url,
            'revised_prompt': response.data[0].revised_prompt
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Starting TaleForge Flask Application")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Debug Mode: {app.debug}")
    print("="*50 + "\n")
    
        app.run(host='0.0.0.0', port=5000, debug=True)
