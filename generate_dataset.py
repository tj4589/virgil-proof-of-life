import pandas as pd
import numpy as np
import random

names = ["Aisha Bello", "Emeka Obi", "Chinedu Okafor", "Fatima Yusuf", "Kwame Mensah", "Ngozi Eze", "Ibrahim Musa", "Adebayo Johnson", "Sarah Ojo", "David Nwachukwu", "Blessing Okoro", "Tunde Bakare", "Joy Uche", "Emmanuel Kalu", "Mary Ibeh", "Samuel Peters", "Grace Olatunji", "Michael Danjuma", "Ruth Osei", "Kingsley Chukwu"]
depts = ["Sanitation", "Health", "Education", "Transport", "Finance", "Works", "Administration", "Agriculture", "Housing", "Security"]
titles = ["Officer I", "Officer II", "Director", "Clerk", "Manager", "Analyst", "Supervisor", "Inspector", "Coordinator", "Assistant"]

data = []
for i in range(1, 801):
    name = random.choice(names) + " " + random.choice(["A.", "B.", "C.", "D.", "E.", "F.", "G."])
    dept = random.choice(depts)
    title = random.choice(titles)
    is_anomaly = random.random() < 0.05
    salary = max(50000, np.random.normal(150000, 30000))
    if is_anomaly:
        salary = np.random.normal(850000, 50000) # High salary outlier
    
    account = f"00{random.randint(10000000, 99999999)}"
    if is_anomaly and random.random() < 0.5:
        account = "0081234501" # Shared account anomaly
    
    data.append([
        f"EMP-2026-{i:04d}",
        name,
        dept,
        title,
        int(salary),
        account,
        random.randint(15, 23),
        "2026-05-01"
    ])

df = pd.DataFrame(data, columns=["emp_id", "employee_name", "department", "job_title", "base_salary", "bank_account", "days_present", "last_evaluation_date"])
df.to_csv("frontend/public/real-hr-data.csv", index=False)
print("Generated 800 rows of highly realistic HR dataset.")
