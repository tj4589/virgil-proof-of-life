import kagglehub
import shutil
import os

# Download datasets
print("Downloading HR Analytics Prediction...")
path1 = kagglehub.dataset_download("rishikeshkonapure/hr-analytics-prediction")
print(f"Path1: {path1}")

print("Downloading Employees Payroll in Los Angeles...")
path2 = kagglehub.dataset_download("dsfelix/employees-payroll-in-los-angeles")
print(f"Path2: {path2}")

print("Downloading Employee Attrition Data...")
path3 = kagglehub.dataset_download("HRAnalyticRepository/employee-attrition-data")
print(f"Path3: {path3}")

# We will let the user know we have downloaded them or we can copy the CSVs to frontend/public/datasets
dest_dir = r"c:\Users\DELL\.gemini\antigravity\scratch\ghostdetect\frontend\public\datasets"
os.makedirs(dest_dir, exist_ok=True)

def copy_csvs(src, prefix):
    for root, dirs, files in os.walk(src):
        for f in files:
            if f.endswith(".csv"):
                src_file = os.path.join(root, f)
                # Keep names simple and unique
                dst_name = f"{prefix}_{f}"
                dst_file = os.path.join(dest_dir, dst_name)
                shutil.copy(src_file, dst_file)
                print(f"Copied {dst_name}")

copy_csvs(path1, "hr_analytics")
copy_csvs(path2, "la_payroll")
copy_csvs(path3, "attrition")

print("Done!")
