from torch import nn


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
