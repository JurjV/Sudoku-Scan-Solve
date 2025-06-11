from flask import jsonify

from service.difficulty_analization import analyze_difficulty


def analyze_sudoku(grid):
    solved_grid = [row[:] for row in grid]

    if not solve(solved_grid):
        return jsonify({"error": "Puzzle is not solvable."}), 400

    filled = sum(cell != 0 for row in grid for cell in row)
    if filled > 30:
        return jsonify({"error": "Puzzle is too easy to solve."}), 400
    difficulty = analyze_difficulty(grid)

    return jsonify({
        "difficulty": difficulty,
        "solution": solved_grid
    })

def find_empty(grid):
    for i in range(9):
        for j in range(9):
            if grid[i][j] == 0:
                return i, j
    return None


def is_valid(grid, num, pos):
    row, col = pos
    for j in range(9):
        if grid[row][j] == num and j != col:
            return False
    for i in range(9):
        if grid[i][col] == num and i != row:
            return False
    box_x = col // 3
    box_y = row // 3
    for i in range(box_y * 3, box_y * 3 + 3):
        for j in range(box_x * 3, box_x * 3 + 3):
            if grid[i][j] == num and (i, j) != pos:
                return False
    return True


def solve(grid):
    empty = find_empty(grid)
    if not empty:
        return True
    row, col = empty

    for num in range(1, 10):
        if is_valid(grid, num, (row, col)):
            grid[row][col] = num
            if solve(grid):
                return True
            grid[row][col] = 0
    return False


def get_candidates(grid, row, col):
    if grid[row][col] != 0:
        return []

    candidates = []
    for num in range(1, 10):
        if is_valid(grid, num, (row, col)):
            candidates.append(num)
    return candidates


def find_hint(grid):
    min_candidates = 10
    hint = None
    for i in range(9):
        for j in range(9):
            if grid[i][j] == 0:
                candidates = get_candidates(grid, i, j)
                if 0 < len(candidates) < min_candidates:
                    min_candidates = len(candidates)
                    hint = (i, j, candidates)
    return hint
