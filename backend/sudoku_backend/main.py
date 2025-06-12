import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.daily_puzzle import daily_puzzle_bp
from routes.sudoku_routes import sudoku_bp
from gevent import monkey
monkey.patch_all()

app = Flask(__name__)
CORS(app)
app.register_blueprint(sudoku_bp, url_prefix='/api')
app.register_blueprint(daily_puzzle_bp, url_prefix='/api')

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)