
import os
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

# Load environment variables - override=True forces .env to take priority over system env vars
load_dotenv(override=True)

# Initialize Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Initialize Embeddings - explicitly pass API key from .env
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY in .env")

print(f"Using API key: {api_key[:10]}...{api_key[-4:]}")

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=api_key
)

# Define Data Paths
# __file__ = backend/app/ingest_data.py
# dirname x2 = backend/  -> dirname x3 = project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "pdfs")
PERSIST_DIRECTORY = os.path.join(PROJECT_ROOT, "data", "chroma_db")

def process_pdfs():
    print(f"Loading PDFs from {DATA_DIR}...")
    
    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory {DATA_DIR} does not exist.")
        return

    all_docs = []
    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found.")
        return

    for filename in pdf_files:
        filepath = os.path.join(DATA_DIR, filename)
        try:
            loader = PyMuPDFLoader(filepath)
            docs = loader.load()
            print(f"Loaded {len(docs)} pages from {filename}")
            all_docs.extend(docs)
        except Exception as e:
            print(f"Error loading {filename}: {e}")

    print(f"\nTotal pages loaded: {len(all_docs)}")

    # Chunking
    print("Chunking documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    splits = text_splitter.split_documents(all_docs)
    print(f"Created {len(splits)} chunks.")

    # Embedding and Initializing Vector DB
    print(f"Creating/Updating Vector DB at {PERSIST_DIRECTORY}...")
    
    # Process all at once first, fall back to batches if needed
    batch_size = 50
    vectorstore = None
    total_batches = (len(splits) - 1) // batch_size + 1
    
    for i in range(0, len(splits), batch_size):
        batch = splits[i:i+batch_size]
        batch_num = i // batch_size + 1
        try:
            if vectorstore is None:
                vectorstore = Chroma.from_documents(
                    documents=batch,
                    embedding=embeddings,
                    persist_directory=PERSIST_DIRECTORY
                )
            else:
                vectorstore.add_documents(batch)
            print(f"  Batch {batch_num}/{total_batches} processed ({len(batch)} chunks)")
        except Exception as e:
            print(f"  Error in batch {batch_num}/{total_batches}: {e}")
            # If first batch fails, we can't continue
            if vectorstore is None:
                print("FATAL: First batch failed. Cannot create vector store. Aborting.")
                return

    print(f"\nRAG Pipeline processing complete!")
    print(f"Vector DB saved at: {PERSIST_DIRECTORY}")

if __name__ == "__main__":
    process_pdfs()
