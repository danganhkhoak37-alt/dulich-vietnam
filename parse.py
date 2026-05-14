import docx
import json
import re

doc = docx.Document(r"c:\Users\Windows\Downloads\demo_anh.docx")

map_data = {}
lines = []
for para in doc.paragraphs:
    text = para.text.strip()
    if text:
        lines.append(text)

for i in range(len(lines) - 1):
    line = lines[i]
    next_line = lines[i+1]
    
    if next_line.startswith('http'):
        # Clean up the key
        key = re.sub(r'^[•\-]\s*', '', line)
        key = re.sub(r'^Cảnh quan chi tiết:\s*', '', key, flags=re.IGNORECASE)
        key = re.sub(r'^Cảnh quan:\s*', '', key, flags=re.IGNORECASE)
        key = re.sub(r':$', '', key)
        key = key.strip()
        
        map_data[key] = next_line

with open("image_map.json", "w", encoding="utf-8") as f:
    json.dump(map_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(map_data)} entries to image_map.json")
