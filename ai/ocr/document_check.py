import pytesseract
from PIL import Image
import re
import os

def check_document(image_path):
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
    except Exception as e:
        return {"error": str(e), "verdict": "ERROR"}

    flags = []

    # Check for NIN format (11 digits)
    nin_matches = re.findall(r'\b\d{11}\b', text)
    if not nin_matches:
        flags.append('No valid NIN found in document')

    # Check for expiry date
    if 'expires' not in text.lower() and 'expiry' not in text.lower():
        flags.append('No expiry date detected')

    # Check for issuing authority
    keywords = ['federal', 'republic', 'nigeria', 'nimc', 'inec']
    if not any(k in text.lower() for k in keywords):
        flags.append('No recognized Nigerian issuing authority found')

    return {
        'extracted_text': text[:500],  # first 500 chars
        'nin_found': nin_matches[0] if nin_matches else None,
        'flags': flags,
        'verdict': 'SUSPICIOUS' if len(flags) >= 2 else 'LIKELY_VALID'
    }
