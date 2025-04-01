# llm_backend.py (Flask server using Groq API directly, no python-chess)
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import re

app = Flask(__name__)
CORS(app)  # ✅ Allow CORS for all routes

# ✅ Hardcoded Groq API Key for development (replace with env for production)
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

@app.route('/move', methods=['POST'])
def get_llm_move():
    print("POST /move hit ✅")  # 🔍 debug
    data = request.get_json()
    print("Incoming data:", data)
    fen = data.get("fen")

    if not fen:
        return jsonify({"error": "Missing FEN"}), 400

    prompt = (
        f"You are a chess engine playing a serious tournament game.\n"
        f"Given the following FEN position, return the BEST LEGAL MOVE for the side to move.\n"
        f"Respond in 4-character UCI format only (e.g., e2e4, g1f3).\n"
        f"Do not use SAN like Nf6 or any words. Only return the move.\n"
        f"FEN: {fen}\n"
        f"Move:"
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are a chess engine. Output only legal moves in 4-character UCI format like e2e4. No explanations."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 10
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=body)
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text)

        result = response.json()
        move = result['choices'][0]['message']['content'].strip()

        print("LLM replied with move:", move)

        # ✅ Validate UCI format (like e2e4)
        if not re.match(r"^[a-h][1-8][a-h][1-8]$", move):
            print("Invalid UCI format:", move)
            return jsonify({"error": "Invalid move format", "raw": move}), 400

        return jsonify({"move": move})
    except Exception as e:
        print("EXCEPTION:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

