from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

class TaleForgeLSTMChatbot:
    def __init__(self):
        self.load_model_and_utils()

    def load_model_and_utils(self):
        # Load the trained LSTM model
        self.model = tf.keras.models.load_model('taleforge_lstm_model.h5')

        # Load the tokenizer
        with open('tokenizer.pkl', 'rb') as f:
            self.tokenizer = pickle.load(f)

        # Load the label encoder
        with open('label_encoder.pkl', 'rb') as f:
            self.label_encoder = pickle.load(f)

        # Set max_len to the value used during training (if known, you can hardcode)
        self.max_len = 20  # Replace with the actual value if it's different

    def predict_response(self, user_input):
        seq = self.tokenizer.texts_to_sequences([user_input])
        padded = pad_sequences(seq, maxlen=self.max_len, padding='post')
        pred = self.model.predict(padded)[0]
        predicted_index = np.argmax(pred)
        response = self.label_encoder.inverse_transform([predicted_index])[0]
        return response

# Initialize the chatbot
bot = TaleForgeLSTMChatbot()

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    response = bot.predict_response(user_input)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
