import pandas as pd
df = pd.read_csv('backend/csv_use_new.csv')
print("Columns in the DataFrame:", df.columns.tolist())
try:
    if 'event_main' in df.columns:
        df = df.drop(['event_main'], axis=1)
        df.to_csv('backend/csv_use_new.csv', index=False)
        print("Column 'event_main' dropped successfully and DataFrame saved.")
    else:
        print("Column 'event_main' does not exist in the DataFrame.")
except Exception as e:
    print(f"Error: {e}")
