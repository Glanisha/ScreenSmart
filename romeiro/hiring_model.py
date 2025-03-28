import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
import xgboost as xgb
from sklearn.metrics import precision_score, confusion_matrix, classification_report, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
import re

class EnhancedHiringPredictor:
    def __init__(self):
        self.model_path = 'hiring_model.joblib'
        self.pipeline = None
        self.precision = 0
        self.accuracy = 0

    def advanced_text_preprocessing(self, text: str) -> str:
        """Advanced text cleaning and feature extraction"""
        if not isinstance(text, str):
            return ""
        text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
        text = ' '.join(text.split())
        return text
        
    def calculate_skill_match(self, candidate_skills, required_skills):
        """Calculate the match between candidate skills and required skills"""
        if not isinstance(candidate_skills, str) or not isinstance(required_skills, str):
            return 0.0
            
        candidate_skills_list = [s.strip().lower() for s in candidate_skills.split(',')]
        required_skills_list = [s.strip().lower() for s in required_skills.split(',')]
        
        if not required_skills_list:
            return 1.0
            
        matches = sum(1 for skill in candidate_skills_list if skill in required_skills_list)
        
        return matches / len(required_skills_list) if len(required_skills_list) > 0 else 0.0

    def prepare_data(self, df: pd.DataFrame):
        """Enhanced data preparation with more features and error checking"""
        required_columns = [
            'Resume_Text', 'Job_Description', 'Skills', 'Required_Skills', 
            'Experience (Years)', 'Offered_Salary', 'Salary_Expectation', 
            'Education', 'Industry', 'Location', 
            'Applied_Job_Title', 'Work_Type', 'Hired'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing columns: {missing_columns}")

        df = df.copy()
        df['Resume_Text'] = df['Resume_Text'].fillna('')
        df['Job_Description'] = df['Job_Description'].fillna('')
        df['Skills'] = df['Skills'].fillna('')
        df['Required_Skills'] = df['Required_Skills'].fillna('')
        
        numeric_cols = ['Experience (Years)', 'Offered_Salary', 'Salary_Expectation']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].fillna(df[col].median())

        df['Resume_Text_Clean'] = df['Resume_Text'].apply(self.advanced_text_preprocessing)
        df['Job_Description_Clean'] = df['Job_Description'].apply(self.advanced_text_preprocessing)

        df['Skill_Match_Score'] = df.apply(
            lambda row: self.calculate_skill_match(row['Skills'], row['Required_Skills']), 
            axis=1
        )

        df['Experience_Level'] = pd.cut(
            df['Experience (Years)'], 
            bins=[-1, 1, 3, 5, 8, 15, np.inf], 
            labels=['Entry', 'Junior', 'Mid', 'Senior', 'Expert', 'Leadership']
        )

        df['Salary_Diff_Percentage'] = (df['Offered_Salary'] - df['Salary_Expectation']) / df['Salary_Expectation'] * 100
        df['Salary_Diff_Percentage'] = df['Salary_Diff_Percentage'].fillna(0)

        features = [
            'Resume_Text_Clean', 'Job_Description_Clean', 
            'Experience (Years)', 'Skill_Match_Score',
            'Salary_Diff_Percentage',
            'Education', 'Industry', 'Location', 
            'Applied_Job_Title', 'Work_Type', 
            'Experience_Level'
        ]
        
        missing_features = [feat for feat in features if feat not in df.columns]
        if missing_features:
            raise ValueError(f"Missing feature columns: {missing_features}")

        X = df[features]
        y = df['Hired']

        print("Data preparation info:")
        print(X.info())
        print("\nTarget variable distribution:")
        print(y.value_counts(normalize=True))

        return X, y

    def build_pipeline(self):
        """Construct advanced preprocessing and model pipeline"""
        text_cols = ['Resume_Text_Clean', 'Job_Description_Clean']
        categorical_cols = ['Education', 'Industry', 'Location', 
                            'Applied_Job_Title', 'Work_Type', 'Experience_Level']
        numeric_cols = ['Experience (Years)', 'Skill_Match_Score', 'Salary_Diff_Percentage']

        text_transformers = [
            (f'text_{col}', TfidfVectorizer(max_features=250), col) 
            for col in text_cols
        ]
        
        preprocessor = ColumnTransformer(
            transformers=[
                *text_transformers,
                ('num', StandardScaler(), numeric_cols),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
            ])

        self.pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', xgb.XGBClassifier(
                n_estimators=200,
                max_depth=7,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=3,
                scale_pos_weight=5,
                random_state=42
            ))
        ])

    def train(self, df: pd.DataFrame):
        """Train the enhanced hiring prediction model"""
        try:
            X, y = self.prepare_data(df)
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, stratify=y, random_state=42
            )

            self.build_pipeline()
            self.pipeline.fit(X_train, y_train)

            y_pred = self.pipeline.predict(X_test)
            
            self.precision = precision_score(y_test, y_pred)
            self.accuracy = accuracy_score(y_test, y_pred)

            plt.figure(figsize=(8, 6))
            cm = confusion_matrix(y_test, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
            plt.title('Enhanced Hiring Prediction Confusion Matrix')
            plt.xlabel('Predicted Label')
            plt.ylabel('True Label')
            plt.tight_layout()
            plt.savefig('enhanced_confusion_matrix.png')
            plt.close()

            os.makedirs('models', exist_ok=True)
            joblib.dump(self.pipeline, os.path.join('models', self.model_path))

            print(f"Model Performance:")
            print(f"Precision: {self.precision:.2%}")
            print(f"Accuracy: {self.accuracy:.2%}")
            print("\nClassification Report:")
            print(classification_report(y_test, y_pred))

        except Exception as e:
            print(f"Error during training: {e}")
            raise

def main():
    try:
        df = pd.read_csv('candidate_data.csv')
        predictor = EnhancedHiringPredictor()
        predictor.train(df)
    except Exception as e:
        print(f"Error in main execution: {e}")

if __name__ == "__main__":
    main()