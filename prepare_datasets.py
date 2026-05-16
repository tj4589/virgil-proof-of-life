import pandas as pd
import numpy as np
import os

repo_root = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.join(repo_root, "frontend", "public", "datasets")

# 1. LA Payroll (Huge, let's take a sample of 2000)
la_file = os.path.join(base_dir, "la_payroll_payroll.csv")
if os.path.exists(la_file):
    df_la = pd.read_csv(la_file).sample(n=2000, random_state=42)
    # Use existing fields: RECORD_NBR, JOB_TITLE, DEPARTMENT_TITLE, REGULAR_PAY
    df_la['worker_id'] = df_la['RECORD_NBR'].astype(str).apply(lambda x: "LA-" + x)
    df_la['full_name'] = "Employee " + df_la['RECORD_NBR'].astype(str)
    df_la['department'] = df_la['DEPARTMENT_TITLE']
    df_la['job_role'] = df_la['JOB_TITLE']
    df_la['salary'] = df_la['REGULAR_PAY']
    
    # Synthetic operational fields
    df_la['account_number'] = ["009" + str(1000000 + i) for i in range(len(df_la))]
    df_la['attendance_score'] = np.random.randint(85, 100, size=len(df_la))
    df_la['last_verification'] = "2026-05-01"
    
    # Drop old to make it clean
    cols_to_keep = ['worker_id', 'full_name', 'department', 'job_role', 'salary', 'account_number', 'attendance_score', 'last_verification', 'EMPLOYMENT_TYPE']
    df_la = df_la[[c for c in cols_to_keep if c in df_la.columns]]
    df_la.to_csv(os.path.join(base_dir, "adapted_la_payroll.csv"), index=False)
    
    # Create Fraud Injected version
    df_la_fraud = df_la.copy()
    # Inject 8% fraud
    fraud_indices = df_la_fraud.sample(frac=0.08, random_state=1).index
    df_la_fraud.loc[fraud_indices[:len(fraud_indices)//2], 'attendance_score'] = np.random.randint(0, 15, size=len(fraud_indices)//2)
    df_la_fraud.loc[fraud_indices[len(fraud_indices)//2:], 'last_verification'] = "2025-01-15"
    # Duplicate some accounts
    df_la_fraud.iloc[10:20, df_la_fraud.columns.get_loc('account_number')] = df_la_fraud.iloc[0:10]['account_number'].values
    df_la_fraud.to_csv(os.path.join(base_dir, "adapted_la_payroll_fraud.csv"), index=False)

# 2. HR Analytics
hr_file = os.path.join(base_dir, "hr_analytics_HR-Employee-Attrition.csv")
if os.path.exists(hr_file):
    df_hr = pd.read_csv(hr_file)
    df_hr['worker_id'] = "HRA-" + df_hr['EmployeeNumber'].astype(str)
    df_hr['full_name'] = "Staff " + df_hr['EmployeeNumber'].astype(str)
    df_hr['department'] = df_hr['Department']
    df_hr['job_role'] = df_hr['JobRole']
    df_hr['salary'] = df_hr['MonthlyIncome'] * 12 # Annualize
    df_hr['tenure'] = df_hr['YearsAtCompany']
    df_hr['employment_status'] = df_hr['Attrition'].apply(lambda x: 'Terminated' if x == 'Yes' else 'Active')
    
    df_hr['account_number'] = ["012" + str(2000000 + i) for i in range(len(df_hr))]
    df_hr['attendance_score'] = np.random.randint(80, 100, size=len(df_hr))
    df_hr['last_verification'] = "2026-04-15"
    
    cols_to_keep = ['worker_id', 'full_name', 'department', 'job_role', 'salary', 'tenure', 'employment_status', 'account_number', 'attendance_score', 'last_verification']
    df_hr = df_hr[[c for c in cols_to_keep if c in df_hr.columns]]
    df_hr.to_csv(os.path.join(base_dir, "adapted_hr_analytics.csv"), index=False)

print("Pre-processing complete.")
