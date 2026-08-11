import pandas as pd
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

print("1. Loading dataset...")
# Load the CSV you uploaded
df = pd.read_csv("publicopinion-moods-dataset.csv")

# Clean data: drop rows where 'percent' (public mood) is missing
df = df.dropna(subset=['percent'])

# Expanded and Categorized Topic Mapping
topic_mapping = {
    # === ECONOMY & TAXES (Major Topic 100 series) ===
    '101': "Government action to control inflation and lower the cost of living",
    '103': "Government programs to reduce unemployment and create/save jobs",
    '105': "Reducing the national debt and balancing the federal budget",
    '107': "Tax policy (including taxes on the rich, poor, and overall tax burden)",
    '108': "Government assistance to industries and high-tech sectors",
    '110': "Government regulation of business and prices (overlaps with inflation/jobs series)",

    # === CIVIL RIGHTS, LIBERTIES & EQUALITY (Major Topic 200 series) ===
    '200': "Civil liberties and equality issues (including torture, wealth redistribution, and LGBT rights)",
    '201': "Racial equality, desegregation, affirmative action, and aid to Black Americans",
    '202': "Women's rights, LGBT workplace/military rights, and gay marriage",
    '207': "School prayer and book banning (social conservative issues)",
    '208': "Abortion rights and access (all circumstances)",
    '209': "Anti-communism and media regulation (historical Cold War era)",
    '2002': "Whether people in the government waste a lot of the money we pay in taxes",

    # === HEALTH & SOCIAL WELFARE (Major Topic 300 series) ===
    '301': "Implementing a comprehensive national health insurance program funded by the government",
    '331': "Government spending on AIDS research and treatment",
    '398': "Stem-cell research and general science funding",

    # === LABOR, EMPLOYMENT & CHILDCARE (Major Topic 500 series) ===
    '502': "Government job-creation programs and work-hour regulations",
    '504': "Union power and labor protections",
    '508': "Childcare programs and pre-school funding",

    # === EDUCATION (Major Topic 600 series) ===
    '600': "Overall government spending on education and schools",
    '602': "Providing parents with tax money in the form of school vouchers for private or religious schools",

    # === ENVIRONMENT (Major Topic 700 series) ===
    '700': "Stricter government regulations to protect the environment and combat pollution",

    # === ENERGY (Major Topic 800 series) ===
    '800': "Energy policy (drilling, alternative sources, and regulation)",

    # === IMMIGRATION (Major Topic ~900/2100 series) ===
    '900': "Immigration levels and border policy",

    # === LAW & ORDER / CRIME (Major Topic 1200 series) ===
    '1200': "Crime prevention and gun control",
    '1203': "Drug enforcement and the war on drugs",

    # === SOCIAL WELFARE & POVERTY (Major Topic 1300 series) ===
    '1302': "Increasing government spending on welfare programs for low-income families",
    '1303': "Government intervention to ensure housing and shelter for the homeless",

    # === URBAN & TRANSPORTATION (Major Topic 1400 series) ===
    '1403': "Government spending on urban renewal and rebuilding inner-city infrastructure",

    # === DEFENSE & FOREIGN POLICY (Major Topic 1600 series) ===
    '1600': "Defense spending and military readiness",

    # === SCIENCE & SPACE (Major Topic 1700 series) ===
    '1700': "Government funding for science, space exploration, and technology",

    # === GOVERNMENT OPERATIONS (Major Topic 2000 series) ===
    '2000': "Size and power of the federal government",

    # === SPECIAL / ADDITIONAL SERIES ===
    '2100': "Affirmative action in college admissions",
    '2101': "National parks and public lands",
}

print("2. Converting CSV rows into English text for the LLM...")
documents = []

for index, row in df.iterrows():
    topic_code = str(row['Topic']).strip()
    year = int(row['year'])
    mood_percent = row['percent']
    
    # Only process the policies we mapped above
    if topic_code in topic_mapping:
        policy_desc = topic_mapping[topic_code]
        
        # This is the secret sauce: We write a sentence that the LLM can read and understand
        text = f"In the year {year}, the public opinion mood index regarding the policy of '{policy_desc}' was measured at {mood_percent:.2f}."
        
        # Create a LangChain Document with metadata
        doc = Document(
            page_content=text,
            metadata={"year": year, "topic_code": topic_code, "policy": policy_desc}
        )
        documents.append(doc)

print(f"Created {len(documents)} textual documents. Ready to embed!")

# 3. Initialize Local Embeddings
# We use HuggingFace (all-MiniLM-L6-v2) because it runs locally and is 100% FREE. No OpenAI costs here.
print("3. Downloading Embedding Model (this takes a moment on first run)...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 4. Build and Save the Local Chroma Vector Database
print("4. Building ChromaDB...")
vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=embeddings,
    persist_directory="./chroma_db" # This creates a folder to save your DB permanently!
)

print("✅ Success! ChromaDB vector store created and saved locally.")

# 5. Quick Test to prove it works
print("\n--- Testing the RAG Retrieval ---")
query = "What was the public opinion on school vouchers in the past?"
results = vectorstore.similarity_search(query, k=2) # Fetch the top 2 most relevant facts

for res in results:
    print(f"Found Fact: {res.page_content}")