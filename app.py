from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
from chatbot import TaleForgeLSTMChatbot
import sys

# Initialize debug prints
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())

# Load environment variables
load_dotenv('OPENAI_API_KEY.env')

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={
    r"/*": {"origins": "*"}  # Allow all routes for CORS
})

# Verify OpenAI API key
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY is empty or not set")
    
    client = openai.OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully")
    
    # Test the connection
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
    sys.exit(1)

# Helper functions
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

# Routes
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/generate', methods=['POST'])
def handle_generate():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    print("Received generation request:", data)

    try:
        genre = data.get('genre', 'Fantasy')
        setting = data.get('setting', 'Space')
        character = data.get('character', 'Hero')
        keywords = data.get('keywords', 'Magic')
        sentiment = data.get('sentiment', 'Happy')

        prompt = create_prompt(genre, setting, character, keywords, sentiment)
        print("Generated prompt:", prompt)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative storyteller."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=700,
            temperature=0.7
        )
        
        story = response.choices[0].message.content
        modified_story = adjust_sentiment(story, sentiment)
        
        return jsonify({
            'status': 'success',
            'story': modified_story,
            'original_story': story,
            'prompt': prompt  # Return prompt for art generation
        })
        
    except Exception as e:
        print("Generation error:", str(e))
        return jsonify({
            'status': 'error',
            'message': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/generate-pixel-art', methods=['POST'])
def generate_pixel_art():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    print("Received art request:", data)

    if 'prompt' not in data:
        return jsonify({"error": "Missing 'prompt' field"}), 400

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"8-bit pixel art of: {data['prompt']}. Vibrant colors, retro video game style, 16-bit era",
            size="1024x1024",
            quality="standard",
            n=1,
            style="vivid"
        )
        
        return jsonify({
            'status': 'success',
            'image_url': response.data[0].url,
            'revised_prompt': response.data[0].revised_prompt
        })
        
    except Exception as e:
        print("Art generation error:", str(e))
        return jsonify({
            'status': 'error',
            'message': str(e),
            'type': type(e).__name__
        }), 500
# Initialize your custom chatbot
bot = TaleForgeLSTMChatbot()

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    response = bot.predict_response(user_input)
    return jsonify({
        'question': user_input,
        'answer': response
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Starting TaleForge Flask Application")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Debug Mode: {app.debug}")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)