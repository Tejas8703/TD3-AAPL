import torch

checkpoint = torch.load("d:\\Final Try\\td3_stock_prediction_model_AAPL_full.pth", map_location='cpu')
if "model_state_dict" in checkpoint:
    checkpoint = checkpoint["model_state_dict"]
elif "actor" in checkpoint:
    checkpoint = checkpoint["actor"]

for k, v in checkpoint.items():
    print(k, v.shape)
