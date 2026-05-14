def engineer_features(df):
    # Count how many workers share this NIN
    df['nin_count'] = df.groupby('nin')['nin'].transform('count')

    # Count how many workers share this bank account
    df['account_count'] = df.groupby('bank_account')['bank_account'].transform('count')

    # Salary z-score (how far from average)
    df['salary_zscore'] = (df['salary'] - df['salary'].mean()) / df['salary'].std()

    # Missing fields score (0-3, higher = more suspicious)
    df['missing_score'] = (
        df['department'].isna().astype(int) +
        df['last_verified'].isna().astype(int) +
        (df['salary'] == 0).astype(int)
    )

    feature_cols = ['nin_count', 'account_count', 'salary_zscore', 'missing_score']
    return df[feature_cols]
