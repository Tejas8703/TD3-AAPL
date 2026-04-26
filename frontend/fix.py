import sys

path = 'd:/Final Try/frontend/src/pages/Predict.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r'\`', '`').replace(r'\$', '$')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed")
