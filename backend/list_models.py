import os
from dotenv import load_dotenv
load_dotenv(override=True)

import google.generativeai as genai
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("=== Available Embedding Models ===")
for m in genai.list_models():
    if "embed" in m.name.lower():
        print(f"  {m.name}  ->  methods: {m.supported_generation_methods}")

print("\n=== Available Generative Models (gemini) ===")
for m in genai.list_models():
    if "gemini" in m.name.lower():
        print(f"  {m.name}")
