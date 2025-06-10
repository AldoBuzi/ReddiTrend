from pyspark.sql.functions import udf
from pyspark.sql.types import  StringType, ArrayType

kw_model = None

def extract_keywords_udf(text, accuracy = 0.35):
    global kw_model
    if kw_model is None:
        from keybert import KeyBERT
        kw_model = KeyBERT()  # Initialize once per executor
    
    if text:
        keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 1), top_n=5)
        # Just return keywords, or filter by relevance if needed
        return [kw[0] for kw in keywords if kw[1] > accuracy]
    return []
# Register UDF
extract_keywords = udf(extract_keywords_udf, ArrayType(StringType()))