from flask import Flask

from routes.daily_puzzle import daily_puzzle_bp
from routes.sudoku_routes import sudoku_bp

app = Flask(__name__)
app.register_blueprint(sudoku_bp)
app.register_blueprint(daily_puzzle_bp)


