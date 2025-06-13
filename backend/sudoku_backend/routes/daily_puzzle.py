import random
from datetime import datetime
from flask import Blueprint, jsonify

daily_puzzle_bp = Blueprint("daily_puzzle", __name__)

# Cache for the daily puzzle
current_puzzle = None
current_puzzle_date = None


def generate_sudoku(difficulty='medium'):
    """Generate a Sudoku puzzle of given difficulty"""
    base = 3
    side = base * base

    def pattern(r, c): return (base * (r % base) + r // base + c) % side

    def shuffle(s): return random.sample(s, len(s))

    rBase = range(base)
    rows = [g * base + r for g in shuffle(rBase) for r in shuffle(rBase)]
    cols = [g * base + c for g in shuffle(rBase) for c in shuffle(rBase)]
    nums = shuffle(range(1, base * base + 1))

    board = [[nums[pattern(r, c)] for c in cols] for r in rows]

    squares = side * side
    empties = {
        'easy': random.randint(36, 42),
        'medium': random.randint(46, 52),
        'hard': random.randint(56, 64)
    }[difficulty]

    for p in random.sample(range(squares), empties):
        board[p // side][p % side] = 0

    return board

def get_daily_puzzle():
    global current_puzzle, current_puzzle_date

    today = datetime.now().date()
    if current_puzzle_date != today:
        # Seed the random generator with today's date to ensure consistency
        random.seed(int(today.strftime("%Y%m%d")))
        current_puzzle = generate_sudoku('medium')
        current_puzzle_date = today

    return current_puzzle


@daily_puzzle_bp.route("/daily", methods=["GET"])
def daily_puzzle():
    try:
        puzzle = get_daily_puzzle()
        return jsonify({
            "grid": puzzle,
            "date": current_puzzle_date.isoformat(),
            "difficulty": "medium",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500