"""API Key & Model Diagnostic Script"""
import os
from dotenv import load_dotenv

load_dotenv()

# Step 1: Check API key
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
print(f"[1] API Key found: {'Yes' if api_key else 'No'}")
if api_key:
    print(f"    Key preview: {api_key[:10]}...{api_key[-4:]}")
    print(f"    Key length: {len(api_key)}")
    print(f"    Key repr: {repr(api_key)}")  # Check for hidden chars

# Step 2: Test with google.generativeai directly
print("\n[2] Testing with google.generativeai SDK directly...")
try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    # List available models
    print("    Available embedding models:")
    for m in genai.list_models():
        if "embed" in m.name.lower():
            print(f"      - {m.name}")
    
    # Test embedding
    result = genai.embed_content(
        model="models/text-embedding-004",
        content="test embedding"
    )
    print(f"    Embedding test: SUCCESS (dim={len(result['embedding'])})")
except Exception as e:
    print(f"    Embedding test FAILED: {e}")

# Step 3: Test LLM
print("\n[3] Testing LLM (gemini-2.5-flash-lite)...")
try:
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    response = model.generate_content("Say hello in one word.")
    print(f"    LLM test: SUCCESS -> {response.text.strip()}")
except Exception as e:
    print(f"    LLM test FAILED: {e}")

# Step 4: Test LangChain embedding
print("\n[4] Testing LangChain GoogleGenerativeAIEmbeddings...")
try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=api_key
    )
    result = embeddings.embed_query("test")
    print(f"    LangChain embedding: SUCCESS (dim={len(result)})")
except Exception as e:
    print(f"    LangChain embedding FAILED: {e}")

print("\n[DONE] Diagnostics complete.")
