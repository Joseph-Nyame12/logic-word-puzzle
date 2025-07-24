from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)

words_file = os.path.join(os.path.dirname(__file__), 'words.json')
scores_file = os.path.join(os.path.dirname(__file__), 'scores.json')
leaderboard_file = os.path.join(os.path.dirname(__file__), 'leaderboard.json')

@app.route('/api/words', methods=['GET'])
def get_words():
    try:
        with open(words_file, 'r') as f:
            words_data = json.load(f)
        return jsonify(words_data)
    except FileNotFoundError:
        return jsonify({'error': 'words.json not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json()
    name = data.get('name')
    score = data.get('score')

    if not name or score is None:
        return jsonify({"error": "Missing name or score"}), 400

    # Save all scores
    if not os.path.exists(scores_file):
        with open(scores_file, 'w') as f:
            json.dump([], f)

    with open(scores_file, 'r+') as f:
        scores = json.load(f)
        scores.append({"name": name, "score": score})
        f.seek(0)
        json.dump(scores, f, indent=2)
        f.truncate()

    # Update leaderboard (top 10)
    leaderboard = scores.copy()
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    leaderboard = leaderboard[:10]

    with open(leaderboard_file, 'w') as f:
        json.dump(leaderboard, f, indent=2)

    return jsonify({"message": "Score saved and leaderboard updated"}), 200

@app.route('/api/get-scores', methods=['GET'])
def get_scores():
    if not os.path.exists(scores_file):
        return jsonify([])

    with open(scores_file, 'r') as f:
        scores = json.load(f)
    return jsonify(scores)

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    if not os.path.exists(leaderboard_file):
        return jsonify([])

    with open(leaderboard_file, 'r') as f:
        leaderboard = json.load(f)
    return jsonify(leaderboard)

if __name__ == '__main__':
    app.run(debug=False)
