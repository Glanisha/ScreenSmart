import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import FunctionTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import xgboost as xgb
from sentence_transformers import SentenceTransformer
import joblib
import warnings
warnings.filterwarnings('ignore')
import os
import re

# Updated text preprocessing function without NLTK
def preprocess_text(text):
    """Clean and preprocess text data using regex"""
    if isinstance(text, str):
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common stopwords manually
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = text.split()
        words = [word for word in words if word not in stopwords]
        
        return ' '.join(words)
    else:
        return ""

# 1. Load the dataset
print("Loading dataset...")
# Replace with your actual data path
df = pd.read_csv('candidate_data.csv')  # Adjust path as needed

# 2. Preprocess text columns
print("Preprocessing text data...")
df['Resume_Text_Clean'] = df['Resume_Text'].apply(preprocess_text)
df['Job_Description_Clean'] = df['Job_Description'].apply(preprocess_text)

# 3. Feature engineering for skills matching
def skill_match_ratio(candidate_skills, required_skills):
    """Calculate the ratio of matching skills between candidate and job requirements"""
    if isinstance(candidate_skills, str) and isinstance(required_skills, str):
        candidate_skills_list = [skill.strip().lower() for skill in candidate_skills.split(',')]
        required_skills_list = [skill.strip().lower() for skill in required_skills.split(',')]
        
        if not required_skills_list:
            return 0
        
        matches = sum(1 for skill in candidate_skills_list if skill in required_skills_list)
        return matches / len(required_skills_list)
    else:
        return 0

# Calculate skill match ratio
df['Skill_Match_Ratio'] = df.apply(lambda x: skill_match_ratio(x['Skills'], x['Required_Skills']), axis=1)

# 4. Extract numerical features
print("Extracting features...")
# Handle salary information
df['Salary_Expectation'] = pd.to_numeric(df['Salary_Expectation'], errors='coerce')
df['Offered_Salary'] = pd.to_numeric(df['Offered_Salary'], errors='coerce')
df['Salary_Difference'] = df['Offered_Salary'] - df['Salary_Expectation']

# 5. Define features and target
X = df.drop(['Hired', 'Candidate_ID', 'Resume_Text', 'Job_Description', 'Application_Status'], axis=1)
y = df['Hired']

# 6. Split dataset into training and testing sets
print("Splitting data into training and testing sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 7. Define text and categorical columns for preprocessing
text_cols = ['Resume_Text_Clean', 'Job_Description_Clean']
categorical_cols = ['Education', 'Industry', 'Work_Type', 'Location', 'Applied_Job_Title']
numerical_cols = ['Experience (Years)', 'Salary_Expectation', 'Offered_Salary', 'Salary_Difference', 'Skill_Match_Ratio']

# 8. Create preprocessing pipelines
print("Creating preprocessing pipelines...")
# Option 1: Using TF-IDF vectorizer for text data
text_transformer_tfidf = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=100, ngram_range=(1, 2)))
])

# Option 2: Using Sentence Transformers for text data
def sentence_transformer_embeddings(X):
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')  # Smaller, efficient model
    return model.encode(X.tolist(), show_progress_bar=True)

# Choose which text transformer to use (TF-IDF is faster for large datasets)
use_sentence_transformer = False

if use_sentence_transformer:
    text_transformer = Pipeline([
        ('embeddings', FunctionTransformer(sentence_transformer_embeddings, validate=False))
    ])
else:
    text_transformer = text_transformer_tfidf

# Preprocessing for categorical and numerical features
categorical_transformer = Pipeline([
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

numerical_transformer = Pipeline([
    ('scaler', StandardScaler())
])

# Create column transformer
preprocessor = ColumnTransformer(
    transformers=[
        ('text_resume', text_transformer, 'Resume_Text_Clean'),
        ('text_job', text_transformer, 'Job_Description_Clean'),
        ('categorical', categorical_transformer, categorical_cols),
        ('numerical', numerical_transformer, numerical_cols)
    ],
    remainder='drop'
)

# 9. Create a pipeline with preprocessing and XGBoost model
print("Building XGBoost pipeline...")
xgb_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', xgb.XGBClassifier(random_state=42))
])

# 10. Define hyperparameters for tuning
param_grid = {
    'classifier__n_estimators': [100, 200],
    'classifier__max_depth': [3, 6],
    'classifier__learning_rate': [0.1, 0.01],
    'classifier__subsample': [0.8, 1.0]
}

# 11. Perform hyperparameter tuning
print("Performing hyperparameter tuning (this may take a while)...")
grid_search = GridSearchCV(
    xgb_pipeline, 
    param_grid,
    cv=3,
    scoring='f1',
    verbose=1,
    n_jobs=-1
)

grid_search.fit(X_train, y_train)

# 12. Get the best model and parameters
best_model = grid_search.best_estimator_
print(f"\nBest parameters: {grid_search.best_params_}")

# 13. Make predictions on test set
y_pred = best_model.predict(X_test)

# 14. Evaluate the model
print("\nModel Evaluation:")
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 15. Display confusion matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Not Hired', 'Hired'], yticklabels=['Not Hired', 'Hired'])
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')
plt.savefig('confusion_matrix.png')
plt.close()
print("Confusion matrix saved as 'confusion_matrix.png'")

# 16. Feature importance analysis
# Extract feature names from the preprocessor
def get_feature_names(column_transformer):
    output_features = []
    
    for name, pipe, columns in column_transformer.transformers_:
        if name == 'categorical':
            # Get feature names from one-hot encoder
            encoder = pipe.named_steps['onehot']
            cats = encoder.categories_
            for i, category in enumerate(cats):
                output_features.extend([f"{columns[i]}_{cat}" for cat in category])
        elif name in ['text_resume', 'text_job']:
            # For TFIDF
            if 'tfidf' in pipe.named_steps:
                vectorizer = pipe.named_steps['tfidf']
                feature_names = vectorizer.get_feature_names_out()
                if name == 'text_resume':
                    output_features.extend([f"resume_{feature}" for feature in feature_names])
                else:
                    output_features.extend([f"job_{feature}" for feature in feature_names])
            # For Sentence Transformer, we don't have feature names
            else:
                if name == 'text_resume':
                    output_features.extend([f"resume_emb_{i}" for i in range(384)])  # 384 dimensions for paraphrase-MiniLM-L6-v2
                else:
                    output_features.extend([f"job_emb_{i}" for i in range(384)])
        elif name == 'numerical':
            output_features.extend(columns)
    
    return output_features

# Try to extract feature names and plot feature importance
try:
    # Get feature names
    feature_names = get_feature_names(best_model.named_steps['preprocessor'])
    
    # Get feature importances
    importances = best_model.named_steps['classifier'].feature_importances_
    
    # Sort feature importances
    indices = np.argsort(importances)[::-1]
    
    # Plot the top 20 features
    plt.figure(figsize=(12, 8))
    plt.title('Feature Importances')
    
    # Ensure we don't try to plot more features than we have
    n_features_to_plot = min(20, len(feature_names))
    top_indices = indices[:n_features_to_plot]
    
    plt.barh(range(n_features_to_plot), importances[top_indices], align='center')
    plt.yticks(range(n_features_to_plot), [feature_names[i] for i in top_indices])
    plt.xlabel('Importance')
    plt.gca().invert_yaxis()
    plt.savefig('feature_importance.png', bbox_inches='tight')
    plt.close()
    print("Feature importance plot saved as 'feature_importance.png'")
    
    # Save top 20 important features to a CSV for reference
    importance_df = pd.DataFrame({
        'Feature': [feature_names[i] for i in indices[:20]],
        'Importance': importances[indices[:20]]
    })
    importance_df.to_csv('feature_importance.csv', index=False)
    print("Top 20 features saved to 'feature_importance.csv'")
    
except Exception as e:
    print(f"Couldn't generate feature importance plot: {str(e)}")
    print("This might be due to dimension mismatch in feature names or using Sentence Transformers.")

# 17. Save the model for deployment
# Create models directory
model_dir = "models"
os.makedirs(model_dir, exist_ok=True)

# Save model with timestamp for versioning
from datetime import datetime
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
model_filename = f"hiring_model_{timestamp}.joblib"
model_path = os.path.join(model_dir, model_filename)

# Save the model
print(f"Saving model to {model_path}...")
joblib.dump(best_model, model_path)

# Also save a copy with a standard name for the API to use
standard_model_path = os.path.join(model_dir, "hiring_prediction_model.joblib") 
joblib.dump(best_model, standard_model_path)
print(f"Model saved to {model_path} and {standard_model_path}")

# 18. Example of loading and using the model for predictions in FastAPI
print("\nExample code for loading and using the model in FastAPI:")
print('''
from fastapi import FastAPI, Body
import joblib
import pandas as pd

app = FastAPI()

# Load the trained model
model = joblib.load('models/hiring_prediction_model.joblib')

@app.post("/predict/")
async def predict_hiring(candidate_data: dict = Body(...)):
    # Convert input data to DataFrame
    input_df = pd.DataFrame([candidate_data])
    
    # Make prediction
    prediction = model.predict(input_df)[0]
    probability = model.predict_proba(input_df)[0][1]
    
    return {
        "hired_prediction": bool(prediction),
        "hiring_probability": float(probability)
    }
''')

print("\nModel training and evaluation completed successfully!")