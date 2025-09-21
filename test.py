import os
import requests

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def test_gemini():
    prompt = "Hey, how are you?"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)
    try:
        reply = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        print("Gemini says:", reply)
    except Exception as e:
        print("Error or key issue:", resp.text)

if __name__ == "__main__":
    test_gemini()
