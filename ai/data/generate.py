import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import uuid
import os

def get_random_date(start_years_ago, end_years_ago=0):
    start_date = datetime.now() - timedelta(days=365*start_years_ago)
    end_date = datetime.now() - timedelta(days=365*end_years_ago)
    random_days = random.randrange((end_date - start_date).days + 1)
    return (start_date + timedelta(days=random_days)).isoformat()

def generate_payroll(n=5000, ghost_rate=0.15):
    records = []
    used_nins = set()

    for i in range(n):
        is_ghost = np.random.random() < ghost_rate
        nin = "".join([str(random.randint(0, 9)) for _ in range(11)])

        # Ghost workers share NINs or have missing fields
        if is_ghost and used_nins:
            nin = np.random.choice(list(used_nins))  # duplicate NIN

        record = {
            'worker_id': str(uuid.uuid4()),
            'name': f"Worker {random.randint(1000, 9999)}",
            'nin': nin,
            'bvn': "".join([str(random.randint(0, 9)) for _ in range(11)]),
            'bank_account': "".join([str(random.randint(0, 9)) for _ in range(10)]),
            'salary': np.random.normal(150000, 50000) if not is_ghost 
                      else np.random.choice([0, 999999999, 150000]),
            'department': f"Dept {random.randint(1, 20)}" if not is_ghost else None,
            'date_added': get_random_date(3),
            'last_verified': get_random_date(1) if not is_ghost else None,
            'is_ghost': int(is_ghost)
        }
        records.append(record)
        used_nins.add(nin)

    return pd.DataFrame(records)

if __name__ == '__main__':
    # Ensure this is run from the `ai` directory
    if not os.path.basename(os.getcwd()) == 'ai':
        print("Please run this script from the `ai` directory: python data/generate.py")
        exit(1)
        
    df = generate_payroll()
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/synthetic_payroll.csv', index=False)
    print("Generated data/synthetic_payroll.csv")
