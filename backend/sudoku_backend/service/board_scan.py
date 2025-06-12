import cv2
import numpy as np
import torch
from model.model_training import DigitCNN
import os


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../model/digit_cnn_v2.pth")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file missing at {MODEL_PATH}")
model = DigitCNN().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

def warp_to_fixed_grid(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY_INV, 57, 5)
    cnts = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            ar = w / float(h)
            if min(w, h) < 200 or not (0.9 < ar < 1.1): continue
            corners = np.array([pt[0] for pt in approx], dtype="float32")
            break
    else:
        raise ValueError("No valid Sudoku board found.")

    def order_pts(pts):
        s = pts.sum(1)
        diff = np.diff(pts, axis=1)
        return np.array([
            pts[np.argmin(s)],
            pts[np.argmin(diff)],
            pts[np.argmax(s)],
            pts[np.argmax(diff)]
        ], dtype="float32")

    ordered = order_pts(corners)
    dst = np.array([[0,0], [449,0], [449,449], [0,449]], dtype="float32")
    M = cv2.getPerspectiveTransform(ordered, dst)
    return cv2.warpPerspective(gray, M, (450, 450))

def recognise_sudoku(image_np):
    warped = warp_to_fixed_grid(image_np)
    grid = np.zeros((9, 9), dtype=int)

    for r in range(9):
        for c in range(9):
            cell = warped[r*50:(r+1)*50, c*50:(c+1)*50]
            cell = cv2.GaussianBlur(cell, (3, 3), 0)
            thresh = cv2.adaptiveThreshold(cell, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY_INV, 11, 2)
            clean = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, np.ones((2,2), np.uint8))

            mask = np.zeros((50,50), dtype=np.uint8)
            cv2.circle(mask, (25,25), 8, 1, -1)
            if np.count_nonzero((clean == 255) & (mask == 1)) < 5:
                continue

            cell_resized = cv2.resize(clean, (28,28), interpolation=cv2.INTER_AREA)
            tensor = torch.from_numpy(cell_resized.astype("float32") / 255.).unsqueeze(0).unsqueeze(0).to(device)
            with torch.no_grad():
                pred = torch.argmax(model(tensor)).item()
            if pred != 0:
                grid[r, c] = pred
    return grid.tolist()
