import random
from pathlib import Path
from typing import Sequence, List

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import torch, torch.nn as nn, torch.optim as optim
from torch.utils.data import Dataset, DataLoader, ConcatDataset
from torchvision import datasets, transforms
from tqdm import tqdm

# Setup
DEVICE = torch.device("cpu")
CHECKPOINT = "digit_cnn_v2.pth"
SAFE_ANGLE = 5
SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)

# Synthetic Dataset
class SyntheticDigits(Dataset):
    def __init__(self, fonts: Sequence[Path], img_size: int = 28, per_class: int = 2500,
                 digits: Sequence[int] = range(1, 10), add_blank: bool = True, seed: int = 0):
        if not fonts: raise ValueError("No fonts provided.")
        self.data, self.labels = [], []
        rng = random.Random(seed)

        for d in digits:
            for _ in range(per_class):
                font = ImageFont.truetype(str(rng.choice(fonts)), rng.randint(22, 32))
                canvas = Image.new("L", (40, 40), 255)
                draw = ImageDraw.Draw(canvas)
                char = str(d)
                bbox = font.getbbox(char)
                w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                pos = ((40 - w) // 2 + rng.randint(-2, 2),
                       (40 - h) // 2 + rng.randint(-2, 2))
                draw.text(pos, char, 0, font=font)

                if rng.random() < 0.3:
                    canvas = canvas.rotate(rng.uniform(-SAFE_ANGLE, SAFE_ANGLE), expand=1, fillcolor=255)
                if rng.random() < 0.3:
                    line_draw = ImageDraw.Draw(canvas)
                    if rng.random() < 0.5:
                        y = rng.randint(5, 35)
                        line_draw.line((0, y, 40, y), fill=0, width=1)
                    else:
                        x = rng.randint(5, 35)
                        line_draw.line((x, 0, x, 40), fill=0, width=1)
                if rng.random() < 0.4:
                    canvas = Image.eval(canvas, lambda px: max(0, min(255, px + rng.randint(-30, 30))))
                if rng.random() < 0.3:
                    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.5, 1.2)))

                crop = canvas.crop(canvas.getbbox()).resize((img_size, img_size), Image.BILINEAR)
                self.data.append(np.array(crop, np.uint8))
                self.labels.append(d)

        if add_blank:
            for _ in range(per_class):
                blank = np.full((img_size, img_size), rng.randint(230, 255), np.uint8)
                self.data.append(blank)
                self.labels.append(0)

    def __len__(self): return len(self.labels)
    def __getitem__(self, idx):
        return transforms.ToTensor()(self.data[idx]), self.labels[idx]

# Font Discovery
def _font_ok(p: Path) -> bool:
    return all(b not in p.stem.lower() for b in {"symbol", "wingdings", "dingbats", "emoji"})

def discover_windows_fonts() -> List[Path]:
    win_fonts = Path("C:/Windows/Fonts")
    return [p for p in win_fonts.rglob("*.[ot]tf") if _font_ok(p)] if win_fonts.exists() else []

# Dataset
def get_datasets(per_class=2500):
    tfm = transforms.Compose([transforms.ToTensor()])
    mnist_tr = datasets.MNIST("data", True, download=True, transform=tfm)
    mnist_val = datasets.MNIST("data", False, download=True, transform=tfm)
    fonts = discover_windows_fonts()
    if not fonts: raise RuntimeError("No fonts found on system.")
    synth_tr  = SyntheticDigits(fonts, per_class=per_class, seed=SEED)
    synth_val = SyntheticDigits(fonts, per_class=per_class//4, seed=SEED+1)
    return ConcatDataset([mnist_tr, synth_tr]), ConcatDataset([mnist_val, synth_val])

# CNN
class _Block(nn.Module):
    def __init__(self, cin, cout):
        super().__init__()
        self.seq = nn.Sequential(
            nn.Conv2d(cin, cout, 3, padding=1, bias=False),
            nn.BatchNorm2d(cout),
            nn.LeakyReLU(0.1, True),
            nn.Conv2d(cout, cout, 3, padding=1, bias=False),
            nn.BatchNorm2d(cout),
            nn.LeakyReLU(0.1, True),
        )
    def forward(self, x): return self.seq(x)

class DigitCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.s1 = _Block(1, 32)
        self.s2 = _Block(32, 64)
        self.s3 = _Block(64, 128)
        self.pool = nn.MaxPool2d(2)
        self.gap  = nn.AdaptiveAvgPool2d(1)
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.4),
            nn.Linear(128, 128), nn.LeakyReLU(0.1, True), nn.Dropout(0.3),
            nn.Linear(128, 10)
        )
    def forward(self, x):
        x = self.pool(self.s1(x))
        x = self.pool(self.s2(x))
        x = self.pool(self.s3(x))
        x = self.gap(x)
        return self.head(x)

# Eval
@torch.no_grad()
def evaluate(model, loader):
    model.eval(); correct = total = 0
    for xb, yb in loader:
        pred = model(xb.to(DEVICE)).argmax(1).cpu()
        correct += (pred == yb).sum().item(); total += yb.size(0)
    return correct / total

# Training
def train(epochs=15, batch=256, per_class=2500, lr=1e-3):
    tr_ds, val_ds = get_datasets(per_class)
    tr_loader = DataLoader(tr_ds, batch, True)
    val_loader = DataLoader(val_ds, batch, False)

    model = DigitCNN().to(DEVICE)
    opt = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = optim.lr_scheduler.CosineAnnealingLR(opt, epochs * len(tr_loader))
    loss_fn = nn.CrossEntropyLoss()
    best = 0.0

    for ep in range(1, epochs + 1):
        model.train(); total_loss = 0
        for xb, yb in tqdm(tr_loader, desc=f"Epoch {ep}/{epochs}"):
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward(); opt.step(); sched.step()
            total_loss += loss.item() * xb.size(0)
        acc = evaluate(model, val_loader)
        print(f"Epoch {ep}: loss {total_loss/len(tr_ds):.4f} | val acc {acc:.4%}")
        if acc > best:
            best = acc
            torch.save(model.state_dict(), CHECKPOINT)
            print(f"New best saved to {CHECKPOINT}")
    print(f"Finished training. Best val accuracy: {best:.4%}")

if __name__ == "__main__":
    train()
