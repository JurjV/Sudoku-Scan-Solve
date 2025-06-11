def analyze_difficulty(grid):
    from copy import deepcopy

    candidates_grid = [[get_candidates(grid, i, j) for j in range(9)] for i in range(9)]
    working_grid = deepcopy(grid)
    techniques_used = set()

    # Try solving with basic techniques
    changed = True
    while changed:
        changed = False

        if not changed:
            changed = apply_naked_singles(working_grid, candidates_grid)
            if changed: techniques_used.add("naked_singles")

        if not changed:
            changed = apply_hidden_singles(working_grid, candidates_grid)
            if changed: techniques_used.add("hidden_singles")

        if not changed:
            changed = apply_naked_pairs(working_grid, candidates_grid)
            if changed: techniques_used.add("naked_pairs")

        if not changed:
            changed = apply_locked_candidates(working_grid, candidates_grid)
            if changed: techniques_used.add("locked_candidates")

    # Classification rules updated:
    if not techniques_used:
        return "easy" if is_solved(working_grid) else "hard"
    elif techniques_used <= {"naked_singles"}:
        return "easy"
    elif techniques_used <= {"naked_singles", "hidden_singles", "naked_pairs", "locked_candidates"}:
        return "medium" if is_solved(working_grid) else "hard"
    else:
        return "hard"

def apply_naked_singles(grid, candidates_grid):
    changed = False
    for i in range(9):
        for j in range(9):
            if grid[i][j] == 0 and len(candidates_grid[i][j]) == 1:
                num = candidates_grid[i][j].pop()
                grid[i][j] = num
                eliminate_candidates(candidates_grid, i, j, [num])
                changed = True
    return changed


def apply_hidden_singles(grid, candidates_grid):
    changed = False
    for i in range(9):
        for j in range(9):
            if grid[i][j] == 0:
                for num in candidates_grid[i][j]:
                    # Check row
                    if is_unique_in_row(candidates_grid, num, i, j):
                        grid[i][j] = num
                        eliminate_candidates(candidates_grid, i, j, [num])
                        changed = True
                        break
                    # Check column
                    if is_unique_in_col(candidates_grid, num, i, j):
                        grid[i][j] = num
                        eliminate_candidates(candidates_grid, i, j, [num])
                        changed = True
                        break
                    # Check box
                    if is_unique_in_box(candidates_grid, num, i, j):
                        grid[i][j] = num
                        eliminate_candidates(candidates_grid, i, j, [num])
                        changed = True
                        break
    return changed


def apply_naked_pairs(grid, candidates_grid):
    changed = False
    # Check rows
    for i in range(9):
        pairs = {}
        for j in range(9):
            if grid[i][j] == 0 and len(candidates_grid[i][j]) == 2:
                pair = tuple(sorted(candidates_grid[i][j]))
                if pair in pairs:
                    # Found naked pair - remove these candidates from other cells in row
                    for other_j in range(9):
                        if other_j != j and other_j != pairs[pair] and grid[i][other_j] == 0:
                            before = len(candidates_grid[i][other_j])
                            candidates_grid[i][other_j] -= set(pair)
                            if len(candidates_grid[i][other_j]) < before:
                                changed = True
                else:
                    pairs[pair] = j

    # Check columns
    for j in range(9):
        pairs = {}
        for i in range(9):
            if grid[i][j] == 0 and len(candidates_grid[i][j]) == 2:
                pair = tuple(sorted(candidates_grid[i][j]))
                if pair in pairs:
                    # Found naked pair - remove these candidates from other cells in column
                    for other_i in range(9):
                        if other_i != i and other_i != pairs[pair] and grid[other_i][j] == 0:
                            before = len(candidates_grid[other_i][j])
                            candidates_grid[other_i][j] -= set(pair)
                            if len(candidates_grid[other_i][j]) < before:
                                changed = True
                else:
                    pairs[pair] = i

    # Check boxes
    for box_row in range(0, 9, 3):
        for box_col in range(0, 9, 3):
            pairs = {}
            for i in range(box_row, box_row + 3):
                for j in range(box_col, box_col + 3):
                    if grid[i][j] == 0 and len(candidates_grid[i][j]) == 2:
                        pair = tuple(sorted(candidates_grid[i][j]))
                        if pair in pairs:
                            # Found naked pair - remove these candidates from other cells in box
                            for other_i in range(box_row, box_row + 3):
                                for other_j in range(box_col, box_col + 3):
                                    if (other_i != i or other_j != j) and (
                                            other_i != pairs[pair][0] or other_j != pairs[pair][1]) and grid[other_i][
                                        other_j] == 0:
                                        before = len(candidates_grid[other_i][other_j])
                                        candidates_grid[other_i][other_j] -= set(pair)
                                        if len(candidates_grid[other_i][other_j]) < before:
                                            changed = True
                        else:
                            pairs[pair] = (i, j)
    return changed


def apply_locked_candidates(grid, candidates_grid):
    changed = False
    # Check for candidates locked in a box's row/column
    for box_row in range(0, 9, 3):
        for box_col in range(0, 9, 3):
            for num in range(1, 10):
                # Find all positions of this number in the box
                positions = []
                for i in range(box_row, box_row + 3):
                    for j in range(box_col, box_col + 3):
                        if grid[i][j] == 0 and num in candidates_grid[i][j]:
                            positions.append((i, j))

                if len(positions) >= 2:
                    # Check if all in same row
                    if all(pos[0] == positions[0][0] for pos in positions):
                        row = positions[0][0]
                        # Eliminate from rest of row
                        for j in range(9):
                            if j < box_col or j >= box_col + 3:
                                if grid[row][j] == 0 and num in candidates_grid[row][j]:
                                    candidates_grid[row][j].remove(num)
                                    changed = True

                    # Check if all in same column
                    elif all(pos[1] == positions[0][1] for pos in positions):
                        col = positions[0][1]
                        # Eliminate from rest of column
                        for i in range(9):
                            if i < box_row or i >= box_row + 3:
                                if grid[i][col] == 0 and num in candidates_grid[i][col]:
                                    candidates_grid[i][col].remove(num)
                                    changed = True
    return changed


# Helper functions
def get_candidates(grid, row, col):
    """Returns possible numbers for a cell as a set"""
    if grid[row][col] != 0:
        return set()

    used = set()
    # Check row
    used.update(grid[row])
    # Check column
    used.update(grid[i][col] for i in range(9))
    # Check box
    box_row, box_col = (row // 3) * 3, (col // 3) * 3
    used.update(grid[i][j] for i in range(box_row, box_row + 3)
                for j in range(box_col, box_col + 3))

    return set(range(1, 10)) - used


def eliminate_candidates(candidates_grid, row, col, nums):
    """
    Removes specific candidates from a cell and propagates the elimination to affected cells
    Args:
        candidates_grid: 9x9 grid of sets containing possible numbers for each cell
        row, col: The cell coordinates (0-8) where a number was placed
        nums: The number(s) that were placed in this cell (as a list)
    """
    # Remove all candidates from the solved cell
    candidates_grid[row][col] = set()

    # Remove these numbers from candidates in the same row
    for j in range(9):
        if j != col:
            candidates_grid[row][j] -= set(nums)

    # Remove these numbers from candidates in the same column
    for i in range(9):
        if i != row:
            candidates_grid[i][col] -= set(nums)

    # Remove these numbers from candidates in the same 3x3 box
    box_row, box_col = (row // 3) * 3, (col // 3) * 3
    for i in range(box_row, box_row + 3):
        for j in range(box_col, box_col + 3):
            if i != row or j != col:
                candidates_grid[i][j] -= set(nums)


def is_unique_in_row(candidates_grid, num, row, col):
    for j in range(9):
        if j != col and num in candidates_grid[row][j]:
            return False
    return True


def is_unique_in_col(candidates_grid, num, row, col):
    for i in range(9):
        if i != row and num in candidates_grid[i][col]:
            return False
    return True


def is_unique_in_box(candidates_grid, num, row, col):
    box_row, box_col = (row // 3) * 3, (col // 3) * 3
    for i in range(box_row, box_row + 3):
        for j in range(box_col, box_col + 3):
            if (i != row or j != col) and num in candidates_grid[i][j]:
                return False
    return True


def is_solved(grid):
    """Check if grid is completely solved"""
    return all(cell != 0 for row in grid for cell in row)

