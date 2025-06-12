from flask import Blueprint, request, jsonify

from routes.daily_puzzle import generate_sudoku
from service.board_scan import recognise_sudoku
from io import BytesIO
from PIL import Image
import numpy as np

from service.solver import analyze_sudoku

sudoku_bp = Blueprint("sudoku", __name__)


@sudoku_bp.route("/recognise", methods=["POST"])
def recognise_endpoint():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:
        file = request.files["image"]
        img = Image.open(BytesIO(file.read())).convert("RGB")
        img_np = np.array(img)
        grid = recognise_sudoku(img_np)
        return jsonify({"grid": grid})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal error: {e}"}), 500


@sudoku_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    grid = data.get("grid")
    if not grid or len(grid) != 9 or not all(len(row) == 9 for row in grid):
        return jsonify({"error": "Invalid grid"}), 400
    return analyze_sudoku(grid)


@sudoku_bp.route("/generate", methods=["POST"])
def generate_puzzle():
    data = request.get_json()
    difficulty = data.get("difficulty", "medium")

    try:
        puzzle = generate_sudoku(difficulty)
        return jsonify({
            "grid": puzzle,
            "difficulty": difficulty
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

