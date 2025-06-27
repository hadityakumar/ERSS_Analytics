import pandas as pd
from datetime import datetime, timedelta
import json
import sys
import os
import logging
from dateutil.relativedelta import relativedelta # Import for month/year offsets

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
CONFIG = {
    "DATA_DIR": os.path.join(os.path.dirname(__file__), ""),
    "INPUT_FILENAME": "csv_use_new.csv",
    "DATE_COLUMN": "signal_lan",
    "MAIN_EVENT_TYPE_COL": "ahp_weighted_event_types_main_type",
    "SUB_EVENT_TYPE_COL": "ahp_weighted_event_types_sub_type",
    "EVENT_LABEL_COL": "ahp_weighted_event_types_label",
    "AHP_WEIGHT_COL": "ahp_weighted_event_types_ahp_weight",
    "NOR_WEIGHT_COL": "ahp_weighted_event_types_nor_weight",
}

# --- Data Loading and Preprocessing (optimized for a single call) ---
# This part is still global-ish but executed per script invocation
def load_and_preprocess_data():
    filepath = os.path.join(CONFIG["DATA_DIR"], CONFIG["INPUT_FILENAME"])
    try:
        logging.info(f"Loading data from: {filepath}")
        df = pd.read_csv(filepath, low_memory=False)

        df[CONFIG["DATE_COLUMN"]] = pd.to_datetime(df[CONFIG["DATE_COLUMN"]], errors='coerce')
        df.dropna(subset=[CONFIG["DATE_COLUMN"]], inplace=True)

        df['event_year'] = df[CONFIG["DATE_COLUMN"]].dt.year
        df['event_month'] = df[CONFIG["DATE_COLUMN"]].dt.month
        df['event_day'] = df[CONFIG["DATE_COLUMN"]].dt.day
        df['event_hour'] = df[CONFIG["DATE_COLUMN"]].dt.hour
        df['event_day_of_week'] = df[CONFIG["DATE_COLUMN"]].dt.day_name()

        def get_part_of_day(hour):
            if 5 <= hour < 12: return 'Morning'
            elif 12 <= hour < 17: return 'Afternoon'
            elif 17 <= hour < 21: return 'Evening'
            else: return 'Night'

        df['event_part_of_day'] = df['event_hour'].apply(get_part_of_day).astype('category')

        for col in [CONFIG["MAIN_EVENT_TYPE_COL"], CONFIG["SUB_EVENT_TYPE_COL"], CONFIG["EVENT_LABEL_COL"], 'event_day_of_week', 'event_part_of_day']:
            if col in df.columns:
                df[col] = df[col].astype('category')

        if CONFIG["EVENT_LABEL_COL"] in df.columns:
            desired_order = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']
            filtered_desired_order = [label for label in desired_order if label in df[CONFIG["EVENT_LABEL_COL"]].unique()]
            if filtered_desired_order:
                df[CONFIG["EVENT_LABEL_COL"]] = pd.Categorical(df[CONFIG["EVENT_LABEL_COL"]], categories=filtered_desired_order, ordered=True)

        logging.info("Data loaded and preprocessed successfully.")
        return df
    except FileNotFoundError:
        logging.error(f"Error: Data file not found at {filepath}", exc_info=True)
        return pd.DataFrame()
    except Exception as e:
        logging.error(f"An error occurred during initial data loading/preprocessing: {e}", exc_info=True)
        return pd.DataFrame()

# Load data once when the script starts (efficient for single run)
df_cached = load_and_preprocess_data()

def get_filtered_data(df, filters):
    df_filtered = df.copy()

    # Apply Date Range
    if filters.get('start_date'):
        start_dt = datetime.strptime(filters['start_date'], '%Y-%m-%d')
        df_filtered = df_filtered[df_filtered[CONFIG["DATE_COLUMN"]] >= start_dt]
    if filters.get('end_date'):
        end_dt = datetime.strptime(filters['end_date'], '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        df_filtered = df_filtered[df_filtered[CONFIG["DATE_COLUMN"]] <= end_dt]

    # Apply Part of Day Filter
    if filters.get('part_of_day') and 'event_part_of_day' in df_filtered.columns:
        parts = filters['part_of_day']
        df_filtered = df_filtered[df_filtered['event_part_of_day'].isin(parts)]

    # Apply Main Event Type Filter
    if filters.get('main_event_type') and CONFIG["MAIN_EVENT_TYPE_COL"] in df_filtered.columns:
        main_types = filters['main_event_type']
        df_filtered = df_filtered[df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].isin(main_types)]

    # Apply Severity Label Filter
    if filters.get('severity_label') and CONFIG["EVENT_LABEL_COL"] in df_filtered.columns:
        labels = filters['severity_label']
        df_filtered = df_filtered[df_filtered[CONFIG["EVENT_LABEL_COL"]].isin(labels)]

    # Apply Sub Event Type Filter
    if filters.get('sub_event_type') and CONFIG["SUB_EVENT_TYPE_COL"] in df_filtered.columns:
        sub_types = filters['sub_event_type']
        df_filtered = df_filtered[df_filtered[CONFIG["SUB_EVENT_TYPE_COL"]].isin(sub_types)]

    return df_filtered

# --- Analysis Functions ---

def analyze_temporal_trend(df_filtered, trend_type, original_df, filters, baseline_options=None):
    """
    Analyzes temporal trends and includes baseline data for comparison.

    Args:
        df_filtered (pd.DataFrame): The DataFrame filtered by current selections.
        trend_type (str): Type of trend ('hourly', 'daily', 'monthly', 'yearly').
        original_df (pd.DataFrame): The complete, unfiltered DataFrame.
        filters (dict): The active filters dictionary, used for determining baseline periods.
        baseline_options (list): A list of strings indicating which baselines to calculate.
                                 Options: 'mean_overall', 'last_period', 'previous_year'.

    Returns:
        dict: A dictionary containing current trend data and selected baseline data.
    """
    if baseline_options is None:
        baseline_options = []

    result = {
        "current_trend": [],
        "baselines": {},
        "title": "",
        "x_axis_label": "",
        "y_axis_label": "Number of Incidents",
        "current_period_range": "N/A"
    }

    if df_filtered.empty:
        result["title"] = "No Data"
        return result

    # --- Determine column and order based on trend_type ---
    time_col_map = {
        'hourly': 'event_hour',
        'daily': 'event_day_of_week',
        'monthly': 'event_month',
        'yearly': 'event_year'
    }

    x_axis_label_map = {
        'hourly': 'Hour of Day (24-hour)',
        'daily': 'Day of Week',
        'monthly': 'Month',
        'yearly': 'Year'
    }

    title_map = {
        'hourly': 'Hourly Incident Trend',
        'daily': 'Daily Incident Trend',
        'monthly': 'Monthly Incident Trend',
        'yearly': 'Yearly Incident Trend'
    }

    col_to_group = time_col_map.get(trend_type)
    result["title"] = title_map.get(trend_type, "Temporal Incident Trend")
    result["x_axis_label"] = x_axis_label_map.get(trend_type, "")

    if not col_to_group or col_to_group not in df_filtered.columns:
        logging.warning(f"Column '{col_to_group}' not found for trend_type '{trend_type}'.")
        return result

    # --- Calculate Current Trend ---
    current_trend_df = df_filtered[col_to_group].value_counts().reset_index()
    current_trend_df.columns = [result["x_axis_label"], 'Count']

    # Apply specific ordering if necessary (for daily, monthly, hourly)
    if trend_type == 'daily':
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        current_trend_df = current_trend_df.set_index(result["x_axis_label"]).reindex(day_order).fillna(0).reset_index()
    elif trend_type == 'hourly' or trend_type == 'monthly':
        current_trend_df = current_trend_df.sort_values(by=result["x_axis_label"]).reset_index(drop=True)

    result["current_trend"] = current_trend_df.to_dict(orient='records')

    # Calculate Current Period Date Range
    if not df_filtered.empty:
        min_date_current = df_filtered[CONFIG["DATE_COLUMN"]].min()
        max_date_current = df_filtered[CONFIG["DATE_COLUMN"]].max()
        if pd.notna(min_date_current) and pd.notna(max_date_current):
            result["current_period_range"] = f"{min_date_current.strftime('%Y-%m-%d')} to {max_date_current.strftime('%Y-%m-%d')}"

    # Create a base set of filters for baselines, excluding date filters
    baseline_base_filters = {
        k: v for k, v in filters.items()
        if k not in ['start_date', 'end_date', 'trend_type', 'baseline_options',
                      'last_period_start_date', 'last_period_end_date'] # Exclude new baseline dates
    }

    # --- Calculate Baselines ---
    for baseline_type in baseline_options:
        logging.info(f"Attempting to calculate baseline: {baseline_type}")
        baseline_data_dict = []
        baseline_period_range = "N/A"

        if baseline_type == 'mean_overall':
            # Apply common filters to the overall data
            filtered_for_mean_overall = get_filtered_data(original_df, baseline_base_filters)
            if col_to_group in filtered_for_mean_overall.columns:
                baseline_df = filtered_for_mean_overall[col_to_group].value_counts().reset_index()
                baseline_df.columns = [result["x_axis_label"], 'Mean_Overall']

                if trend_type == 'daily':
                    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                    baseline_df = baseline_df.set_index(result["x_axis_label"]).reindex(day_order).fillna(0).reset_index()
                elif trend_type == 'hourly' or trend_type == 'monthly':
                    baseline_df = baseline_df.sort_values(by=result["x_axis_label"]).reset_index(drop=True)

                if not filtered_for_mean_overall.empty and filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].nunique() > 0:
                    if trend_type == 'hourly':
                        num_days_in_overall_data = filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].dt.date.nunique()
                        if num_days_in_overall_data > 0:
                            baseline_df['Mean_Overall'] = baseline_df['Mean_Overall'] / num_days_in_overall_data
                    elif trend_type == 'daily':
                        num_weeks_in_overall_data = filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].dt.isocalendar().week.nunique()
                        if filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].dt.year.nunique() > 1:
                             num_weeks_in_overall_data = filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].dt.to_period('W').nunique()

                        if num_weeks_in_overall_data > 0:
                            baseline_df['Mean_Overall'] = baseline_df['Mean_Overall'] / num_weeks_in_overall_data
                    elif trend_type == 'monthly':
                        num_years_in_overall_data = filtered_for_mean_overall['event_year'].nunique()
                        if num_years_in_overall_data > 0:
                            baseline_df['Mean_Overall'] = baseline_df['Mean_Overall'] / num_years_in_overall_data

                baseline_data_dict = baseline_df.to_dict(orient='records')
                # For Mean_Overall period range, use min/max of the *filtered_for_mean_overall* dataset's dates
                if not filtered_for_mean_overall.empty:
                    min_date_overall = filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].min()
                    max_date_overall = filtered_for_mean_overall[CONFIG["DATE_COLUMN"]].max()
                    if pd.notna(min_date_overall) and pd.notna(max_date_overall):
                        baseline_period_range = f"{min_date_overall.strftime('%Y-%m-%d')} to {max_date_overall.strftime('%Y-%m-%d')}"
                result["baselines"]["Mean_Overall"] = {
                    "data": baseline_data_dict,
                    "period_range": baseline_period_range
                }
                logging.info(f"Calculated Mean_Overall baseline for {trend_type}. Data points: {len(baseline_data_dict)}")

        elif baseline_type == 'last_period':
            baseline_start_dt = None
            baseline_end_dt = None

            # Check if custom last period dates are provided
            if filters.get('last_period_start_date') and filters.get('last_period_end_date'):
                try:
                    baseline_start_dt = datetime.strptime(filters['last_period_start_date'], '%Y-%m-%d')
                    baseline_end_dt = datetime.strptime(filters['last_period_end_date'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                    logging.info(f"Using custom 'Last Period' baseline dates: {baseline_start_dt.strftime('%Y-%m-%d')} to {baseline_end_dt.strftime('%Y-%m-%d')}")
                except ValueError:
                    logging.warning("Invalid custom 'last_period_start_date' or 'last_period_end_date' format. Falling back to automatic calculation.")
                    pass # Fall through to automatic calculation if custom dates are invalid

            # If custom dates not provided or invalid, calculate automatically
            if not baseline_start_dt or not baseline_end_dt:
                current_start_dt = None
                current_end_dt = None

                if filters.get('start_date') and filters.get('end_date'):
                    current_start_dt = datetime.strptime(filters['start_date'], '%Y-%m-%d')
                    current_end_dt = datetime.strptime(filters['end_date'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                elif not df_filtered.empty:
                    current_start_dt = df_filtered[CONFIG["DATE_COLUMN"]].min().replace(hour=0, minute=0, second=0, microsecond=0)
                    current_end_dt = df_filtered[CONFIG["DATE_COLUMN"]].max().replace(hour=23, minute=59, second=59, microsecond=999999)

                if current_start_dt and current_end_dt:
                    if trend_type == 'hourly' or trend_type == 'daily':
                        baseline_end_dt = current_start_dt - timedelta(days=1)
                        baseline_start_dt = current_start_dt - timedelta(weeks=1) # A week before as 'last period'
                    elif trend_type == 'monthly':
                        baseline_end_dt = current_start_dt - timedelta(days=1)
                        baseline_start_dt = current_start_dt - relativedelta(months=1)
                    elif trend_type == 'yearly':
                        baseline_end_dt = current_start_dt - timedelta(days=1)
                        baseline_start_dt = current_start_dt - relativedelta(years=1)
                    logging.info(f"Automatically calculated 'Last Period' baseline dates: {baseline_start_dt.strftime('%Y-%m-%d')} to {baseline_end_dt.strftime('%Y-%m-%d')}")
                else:
                    logging.warning("Cannot calculate 'last_period' baseline without valid current period start/end dates.")


            if baseline_start_dt and baseline_end_dt:
                # Create filters for the last period baseline
                last_period_filters = {**baseline_base_filters,
                                       'start_date': baseline_start_dt.strftime('%Y-%m-%d'),
                                       'end_date': baseline_end_dt.strftime('%Y-%m-%d')}
                last_period_df = get_filtered_data(original_df, last_period_filters)

                if not last_period_df.empty:
                    baseline_df = last_period_df[col_to_group].value_counts().reset_index()
                    baseline_df.columns = [result["x_axis_label"], 'Last_Period']
                    if trend_type == 'daily':
                        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        baseline_df = baseline_df.set_index(result["x_axis_label"]).reindex(day_order).fillna(0).reset_index()
                    elif trend_type == 'hourly' or trend_type == 'monthly':
                        baseline_df = baseline_df.sort_values(by=result["x_axis_label"]).reset_index(drop=True)
                    baseline_data_dict = baseline_df.to_dict(orient='records')
                    baseline_period_range = f"{baseline_start_dt.strftime('%Y-%m-%d')} to {baseline_end_dt.strftime('%Y-%m-%d')}"
                else:
                    logging.info(f"No data found for 'last_period' baseline for {trend_type} with applied filters. Baseline will be empty.")
            else:
                logging.warning("No valid baseline start/end dates determined for 'last_period'.")

            result["baselines"]["Last_Period"] = {
                "data": baseline_data_dict,
                "period_range": baseline_period_range
            }
            logging.info(f"Calculated Last_Period baseline for {trend_type}. Data points: {len(baseline_data_dict)}")

        elif baseline_type == 'previous_year':
            current_start_dt = None
            current_end_dt = None

            if filters.get('start_date') and filters.get('end_date'):
                current_start_dt = datetime.strptime(filters['start_date'], '%Y-%m-%d')
                current_end_dt = datetime.strptime(filters['end_date'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            elif not df_filtered.empty:
                current_start_dt = df_filtered[CONFIG["DATE_COLUMN"]].min().replace(hour=0, minute=0, second=0, microsecond=0)
                current_end_dt = df_filtered[CONFIG["DATE_COLUMN"]].max().replace(hour=23, minute=59, second=59, microsecond=999999)

            if current_start_dt and current_end_dt:
                baseline_start_dt = current_start_dt - relativedelta(years=1)
                baseline_end_dt = current_end_dt - relativedelta(years=1)
                logging.info(f"Previous Year Baseline: From {baseline_start_dt.strftime('%Y-%m-%d')} to {baseline_end_dt.strftime('%Y-%m-%d')}")

                # Create filters for the previous year baseline
                prev_year_filters = {**baseline_base_filters,
                                     'start_date': baseline_start_dt.strftime('%Y-%m-%d'),
                                     'end_date': baseline_end_dt.strftime('%Y-%m-%d')}
                prev_year_df = get_filtered_data(original_df, prev_year_filters)

                if not prev_year_df.empty:
                    baseline_df = prev_year_df[col_to_group].value_counts().reset_index()
                    baseline_df.columns = [result["x_axis_label"], 'Previous_Year']

                    if trend_type == 'daily':
                        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        baseline_df = baseline_df.set_index(result["x_axis_label"]).reindex(day_order).fillna(0).reset_index()
                    elif trend_type == 'hourly' or trend_type == 'monthly':
                        baseline_df = baseline_df.sort_values(by=result["x_axis_label"]).reset_index(drop=True)

                    baseline_data_dict = baseline_df.to_dict(orient='records')
                    baseline_period_range = f"{baseline_start_dt.strftime('%Y-%m-%d')} to {baseline_end_dt.strftime('%Y-%m-%d')}"
                else:
                    logging.info(f"No data found for 'previous_year' baseline for {trend_type} with applied filters. Baseline will be empty.")
            else:
                logging.warning("Cannot determine 'previous_year' baseline without valid current period start/end dates.")

            result["baselines"]["Previous_Year"] = {
                "data": baseline_data_dict,
                "period_range": baseline_period_range
            }
            logging.info(f"Calculated Previous_Year baseline for {trend_type}. Data points: {len(baseline_data_dict)}")

    return result

def analyze_main_event_distribution(df_filtered):
    if df_filtered.empty or CONFIG["MAIN_EVENT_TYPE_COL"] not in df_filtered.columns:
        return {"data": [], "title": "Main Event Type Distribution", "x_axis_label": "Main Event Type", "y_axis_label": "Number of Incidents"}

    distribution_df = df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].value_counts().reset_index()
    distribution_df.columns = ['MainEventType', 'Count']
    data_list = distribution_df.to_dict(orient='records')
    return {
        "data": data_list,
        "title": "Main Event Type Distribution",
        "x_axis_label": "Main Event Type",
        "y_axis_label": "Number of Incidents"
    }

def analyze_severity_distribution(df_filtered):
    if df_filtered.empty or CONFIG["EVENT_LABEL_COL"] not in df_filtered.columns:
        return {"data": [], "title": "Incident Severity Distribution", "x_axis_label": "Severity", "y_axis_label": "Number of Incidents"}

    # Ensure correct order for severity labels
    severity_order = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW']

    distribution_df = df_filtered[CONFIG["EVENT_LABEL_COL"]].value_counts().reindex(severity_order).fillna(0).reset_index()
    distribution_df.columns = ['Severity', 'Count']
    data_list = distribution_df.to_dict(orient='records')
    return {
        "data": data_list,
        "title": "Incident Severity Distribution",
        "x_axis_label": "Severity Level",
        "y_axis_label": "Number of Incidents"
    }

def analyze_event_by_part_of_day(df_filtered):
    if df_filtered.empty or CONFIG["MAIN_EVENT_TYPE_COL"] not in df_filtered.columns or 'event_part_of_day' not in df_filtered.columns:
        return {"data": [], "title": "Main Event Types by Part of Day", "x_axis_label": "Part of Day", "y_axis_label": "Number of Incidents"}

    # Create a cross-tabulation for counts
    crosstab_df = pd.crosstab(
        df_filtered['event_part_of_day'],
        df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]]
    )

    # Reindex columns to ensure consistent order (important for stacking)
    if isinstance(df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].dtype, pd.CategoricalDtype):
        all_event_types = df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].cat.categories.tolist()
    else:
        all_event_types = df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].unique().tolist()

    crosstab_df = crosstab_df.reindex(columns=all_event_types, fill_value=0)

    # Reindex rows to ensure consistent order for parts of day
    part_of_day_order = ['Morning', 'Afternoon', 'Evening', 'Night']
    crosstab_df = crosstab_df.reindex(part_of_day_order, fill_value=0)

    # Convert to a format suitable for Recharts (each row is a part of day, columns are event types)
    data_list = crosstab_df.reset_index().rename(columns={'index': 'Part of Day'}).to_dict(orient='records')

    # Get the list of event types for the keys in Recharts
    event_type_keys = crosstab_df.columns.tolist()

    return {
        "data": data_list,
        "title": "Main Event Types by Part of Day",
        "x_axis_label": "Part of Day",
        "y_axis_label": "Number of Incidents",
        "keys": event_type_keys
    }

# --- NEW ANALYSIS FUNCTIONS ---

def get_kpi_data(df_filtered):
    total_incidents = len(df_filtered)

    most_common_main_event = None
    if not df_filtered.empty and CONFIG["MAIN_EVENT_TYPE_COL"] in df_filtered.columns:
        most_common_main_event_series = df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].value_counts()
        if not most_common_main_event_series.empty:
            most_common_main_event = most_common_main_event_series.index[0]

    emergency_incidents_count = 0
    if not df_filtered.empty and CONFIG["EVENT_LABEL_COL"] in df_filtered.columns:
        emergency_incidents_count = df_filtered[df_filtered[CONFIG["EVENT_LABEL_COL"]] == 'EMERGENCY'].shape[0]

    # Calculate average daily incidents if a date range is present in filters
    avg_daily_incidents = 0
    if not df_filtered.empty:
        min_date = df_filtered[CONFIG["DATE_COLUMN"]].min().normalize()
        max_date = df_filtered[CONFIG["DATE_COLUMN"]].max().normalize()
        if pd.notna(min_date) and pd.notna(max_date):
            num_days = (max_date - min_date).days + 1
            if num_days > 0:
                avg_daily_incidents = round(total_incidents / num_days, 2)

    return {
        "total_incidents": total_incidents,
        "most_common_main_event": most_common_main_event,
        "emergency_incidents_count": emergency_incidents_count,
        "average_daily_incidents": avg_daily_incidents
    }

def get_top_main_event_types(df_filtered, top_n):
    try:
        top_n_int = int(top_n)
    except (ValueError, TypeError):
        logging.error(f"Could not convert top_n '{top_n}' to an integer. Defaulting to 5.", exc_info=True)
        top_n_int = 5

    if df_filtered.empty or CONFIG["MAIN_EVENT_TYPE_COL"] not in df_filtered.columns:
        return {
            "data": [],
            "title": f"Top {top_n_int} Main Event Types",
            "x_axis_label": "Main Event Type",
            "y_axis_label": "Number of Incidents"
        }

    top_events_df = df_filtered[CONFIG["MAIN_EVENT_TYPE_COL"]].value_counts().reset_index().head(top_n_int)

    top_events_df.columns = ['MainEventType', 'Count']
    data_list = top_events_df.to_dict(orient='records')

    return {
        "data": data_list,
        "title": f"Top {top_n_int} Main Event Types",
        "x_axis_label": "Main Event Type",
        "y_axis_label": "Number of Incidents"
    }

def get_filtered_sub_event_types(df_filtered):
    """
    Returns unique sub-event types based on the currently filtered data.
    This is used for hierarchical filtering in the frontend.
    """
    if df_filtered.empty or CONFIG["SUB_EVENT_TYPE_COL"] not in df_filtered.columns:
        return {"sub_event_types": []}

    unique_sub_types = df_filtered[CONFIG["SUB_EVENT_TYPE_COL"]].unique().tolist()
    unique_sub_types.sort()
    return {"sub_event_types": unique_sub_types}

def get_metadata(df):
    if df.empty:
        return {
            "main_event_types": [], "sub_event_types": [], "severity_labels": [],
            "parts_of_day": [], "min_date": None, "max_date": None
        }

    # Ensure lists are returned, even if unique() returns a Pandas Index
    return {
        "main_event_types": (df[CONFIG["MAIN_EVENT_TYPE_COL"]].unique().tolist()
                               if CONFIG["MAIN_EVENT_TYPE_COL"] in df.columns else []),
        "sub_event_types": (df[CONFIG["SUB_EVENT_TYPE_COL"]].unique().tolist()
                             if CONFIG["SUB_EVENT_TYPE_COL"] in df.columns else []),
        "severity_labels": ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'], # Explicitly ordered
        "parts_of_day": ['Morning', 'Afternoon', 'Evening', 'Night'], # Explicitly ordered
        "min_date": (df[CONFIG["DATE_COLUMN"]].min().strftime('%Y-%m-%d')
                     if not df.empty and pd.notna(df[CONFIG["DATE_COLUMN"]].min()) else None),
        "max_date": (df[CONFIG["DATE_COLUMN"]].max().strftime('%Y-%m-%d')
                     if not df.empty and pd.notna(df[CONFIG["DATE_COLUMN"]].max()) else None),
    }

def get_column_metadata(df):
    """
    Analyzes DataFrame columns and returns their names and inferred types.
    """
    column_metadata = []
    for col in df.columns:
        dtype = df[col].dtype
        col_type = 'categorical'
        if pd.api.types.is_numeric_dtype(dtype):
            col_type = 'numerical'
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            col_type = 'datetime'
        # Add more specific checks if needed (e.g., for booleans)
        column_metadata.append({'name': col, 'type': col_type})
    return {"columns": column_metadata}

def get_custom_chart_data(df_filtered, x_axis, y_axis, chart_type):
    """
    Generates data for custom charts based on selected x_axis, y_axis, and chart_type.
    You will need to expand this function to handle various chart types and data aggregations.
    """
    if df_filtered.empty or x_axis not in df_filtered.columns or y_axis not in df_filtered.columns:
        logging.warning(f"Missing required columns for custom chart: X={x_axis}, Y={y_axis}")
        return {"data": []}

    # Basic handling for different chart types
    if chart_type == 'LineChart' or chart_type == 'BarChart':
        # For line/bar charts, typically group by x_axis and sum/mean y_axis
        # This is a basic aggregation, you might need more complex logic
        if pd.api.types.is_numeric_dtype(df_filtered[y_axis]):
            # If y_axis is numeric, sum it by x_axis
            chart_df = df_filtered.groupby(x_axis)[y_axis].sum().reset_index()
            chart_df.columns = [x_axis, y_axis] # Rename for consistency
            return {"data": chart_df.to_dict(orient='records')}
        else:
            # If y_axis is not numeric, count occurrences by x_axis
            chart_df = df_filtered[x_axis].value_counts().reset_index()
            chart_df.columns = [x_axis, 'Count']
            return {"data": chart_df.to_dict(orient='records')}
    elif chart_type == 'PieChart':
        # For pie charts, count occurrences of x_axis or sum y_axis by x_axis
        if pd.api.types.is_numeric_dtype(df_filtered[y_axis]):
            chart_df = df_filtered.groupby(x_axis)[y_axis].sum().reset_index()
            chart_df.columns = [x_axis, y_axis]
        else:
            chart_df = df_filtered[x_axis].value_counts().reset_index()
            chart_df.columns = [x_axis, 'count'] # Use 'count' for pie slice size
            # If y_axis is provided and not numeric, we can't use it directly for size,
            # so we'll just count the x_axis occurrences.
            # If you want to use a specific numeric column for pie slice size,
            # ensure y_axis refers to a numeric column.
            # For simplicity, if y_axis is not numeric, we'll make 'count' the default value.
            y_axis = 'count' # Force y_axis to 'count' for pie chart if original was not numeric
        return {"data": chart_df.to_dict(orient='records')}
    # Add more chart specific data preparation here (e.g., Scatter, Heatmap)

    return {"data": []} # Default empty data

# --- Main script execution ---
if __name__ == '__main__':
    action_performed = None
    try:
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
            action_performed = input_data.get('action')
            filters = input_data.get('filters', {})

            if action_performed in ['get_trends', 'get_main_event_distribution', 'get_severity_distribution',
                                    'get_event_by_part_of_day', 'get_kpi_data', 'get_top_main_event_types',
                                    'get_filtered_sub_event_types', 'get_filtered_raw_data', 'get_column_metadata',
                                    'get_custom_chart_data']: # Added get_custom_chart_data
                filtered_df = get_filtered_data(df_cached, filters)
            else:
                filtered_df = df_cached

            result = {}
            if action_performed == 'get_trends':
                trend_type = filters.get('trend_type')
                baseline_options = filters.get('baseline_options', [])
                result = analyze_temporal_trend(filtered_df, trend_type, df_cached, filters, baseline_options)
            elif action_performed == 'get_main_event_distribution':
                result = analyze_main_event_distribution(filtered_df)
            elif action_performed == 'get_severity_distribution':
                result = analyze_severity_distribution(filtered_df)
            elif action_performed == 'get_event_by_part_of_day':
                result = analyze_event_by_part_of_day(filtered_df)
            elif action_performed == 'get_metadata':
                result = get_metadata(df_cached)
            elif action_performed == 'get_kpi_data':
                top_n = filters.get('top_n', 5) # Default to 5 if not provided
                result = get_kpi_data(filtered_df)
            elif action_performed == 'get_top_main_event_types':
                top_n = filters.get('top_n', 5)
                result = get_top_main_event_types(filtered_df, top_n)
            elif action_performed == 'get_filtered_sub_event_types':
                result = get_filtered_sub_event_types(filtered_df)
            elif action_performed == 'get_filtered_raw_data':
                if CONFIG["DATE_COLUMN"] in filtered_df.columns:
                    filtered_df_copy = filtered_df.copy()
                    filtered_df_copy[CONFIG["DATE_COLUMN"]] = filtered_df_copy[CONFIG["DATE_COLUMN"]].dt.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    filtered_df_copy = filtered_df

                result = {"data": filtered_df_copy.to_dict(orient='records')}
            elif action_performed == 'get_column_metadata':
                result = get_column_metadata(df_cached) # Use df_cached as it's the full, loaded df
            elif action_performed == 'get_custom_chart_data':
                x_axis = filters.get('x_axis')
                y_axis = filters.get('y_axis')
                chart_type = filters.get('chart_type')
                result = get_custom_chart_data(filtered_df, x_axis, y_axis, chart_type)

            else:
                logging.warning(f"Invalid action specified: {action_performed}")
                result = {"error": "Invalid action."}

            print(json.dumps(result))

        else:
            logging.error("No input arguments provided to Python script.")
            print(json.dumps({"error": "No input."}))

    except json.JSONDecodeError:
        logging.error("Invalid JSON input provided to Python script.", exc_info=True)
        print(json.dumps({"error": "Invalid JSON input."}))
    except Exception as e:
        logging.error(f"An error occurred in Python script for action '{action_performed}': {e}", exc_info=True)

        error_response = {"error": str(e), "action": action_performed if action_performed else "unknown_action", "status": "error"}
        print(json.dumps(error_response))
        sys.exit(1)