import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os
import sys

# Ensure features.py can be imported
sys.path.append(os.path.dirname(__file__))
from features import engineer_features

if __name__ == '__main__':
    # Ensure this is run from the `ai` directory
    if not os.path.basename(os.getcwd()) == 'ai':
        print("Please run this script from the `ai` directory: python model/train.py")
        exit(1)

    # Load + engineer features
    if not os.path.exists('data/synthetic_payroll.csv'):
        print("Error: data/synthetic_payroll.csv not found.")
        print("Please run data/generate.py first.")
        exit(1)

    df = pd.read_csv('data/synthetic_payroll.csv')
    X = engineer_features(df)
    y = df['is_ghost']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    print(classification_report(y_test, model.predict(X_test)))
    
    os.makedirs('model', exist_ok=True)
    joblib.dump(model, 'model/ghost_detector.pkl')
    print("Model saved to model/ghost_detector.pkl")
