"""
CSV Auto-Analyzer

A lightweight Streamlit web app that takes any CSV file and automatically:
  - Generates summary statistics (rows, columns, dtypes, missing %, min/max/mean)
  - Draws charts (histograms for numeric columns, bar charts for categorical columns)
  - Writes plain-English insight bullets (skew, missing values, high cardinality...)

Stack: Python + pandas + Streamlit + Plotly. No paid APIs. Runs fine on a MacBook Air.

Run it with:
    streamlit run app.py
"""

import io

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

# Page config and theme.
# A few tunable constants so the look-and-feel lives in one place.
ACCENT = "#22d3ee"        # cyan accent used across the UI
BG = "#0e1117"            # main dark background
CARD_BG = "#161b22"       # slightly lighter panels / metric cards
TEXT = "#e6edf3"          # primary text color

st.set_page_config(
    page_title="CSV Auto-Analyzer",
    page_icon="📊",
    layout="wide",
)

# Custom CSS to enforce the dark + cyan minimal look. Streamlit's default
# theme is close, but this polishes the accent color, metric cards and tabs.
st.markdown(
    f"""
    <style>
        .stApp {{ background-color: {BG}; color: {TEXT}; }}

        /* Headings + accent text */
        h1, h2, h3 {{ color: {TEXT}; font-weight: 700; }}
        .accent {{ color: {ACCENT}; }}

        /* Metric cards */
        div[data-testid="stMetric"] {{
            background-color: {CARD_BG};
            border: 1px solid #21262d;
            border-radius: 12px;
            padding: 16px;
        }}
        div[data-testid="stMetricValue"] {{ color: {ACCENT}; }}

        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {{ gap: 4px; }}
        .stTabs [data-baseweb="tab"] {{
            background-color: {CARD_BG};
            border-radius: 8px 8px 0 0;
            padding: 8px 18px;
            color: {TEXT};
        }}
        .stTabs [aria-selected="true"] {{
            background-color: {ACCENT};
            color: {BG};
            font-weight: 700;
        }}

        /* Insight bullet cards */
        .insight {{
            background-color: {CARD_BG};
            border-left: 4px solid {ACCENT};
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 10px;
            font-size: 0.95rem;
        }}

        /* File uploader dashed box */
        section[data-testid="stFileUploaderDropzone"] {{
            background-color: {CARD_BG};
            border: 2px dashed {ACCENT};
            border-radius: 14px;
        }}
    </style>
    """,
    unsafe_allow_html=True,
)

# Plotly template so every chart matches the dark theme automatically.
PLOTLY_LAYOUT = dict(
    paper_bgcolor=CARD_BG,
    plot_bgcolor=CARD_BG,
    font=dict(color=TEXT),
    margin=dict(l=10, r=10, t=40, b=10),
)


# Data helpers. Each does one small job; cached where it helps.
@st.cache_data(show_spinner=False)
def load_csv(file_bytes: bytes) -> pd.DataFrame:
    """Read uploaded bytes into a DataFrame.

    We cache on the raw bytes so re-running the script (which Streamlit does on
    every interaction) doesn't re-parse the same file over and over.
    """
    return pd.read_csv(io.BytesIO(file_bytes))


def numeric_columns(df: pd.DataFrame) -> list:
    """Return the list of numeric column names."""
    return df.select_dtypes(include=np.number).columns.tolist()


def categorical_columns(df: pd.DataFrame) -> list:
    """Return non-numeric columns (text / category / boolean)."""
    return df.select_dtypes(exclude=np.number).columns.tolist()


def summary_table(df: pd.DataFrame) -> pd.DataFrame:
    """Build a per-column overview: dtype, missing %, unique count, and
    basic numeric stats (min/max/mean). Non-numeric stats show as '—'."""
    rows = []
    n = len(df)
    for col in df.columns:
        series = df[col]
        missing_pct = series.isna().mean() * 100 if n else 0
        is_num = pd.api.types.is_numeric_dtype(series)
        rows.append(
            {
                "Column": col,
                "Type": str(series.dtype),
                "Missing %": round(missing_pct, 1),
                "Unique": int(series.nunique(dropna=True)),
                "Min": round(series.min(), 3) if is_num else "—",
                "Max": round(series.max(), 3) if is_num else "—",
                "Mean": round(series.mean(), 3) if is_num else "—",
            }
        )
    return pd.DataFrame(rows)


def generate_insights(df: pd.DataFrame) -> list:
    """Scan the DataFrame and return a list of plain-English insight strings."""
    insights = []
    n = len(df)
    if n == 0:
        return ["The file has no rows to analyze."]

    # --- Missing values per column ---
    for col in df.columns:
        miss = df[col].isna().mean() * 100
        if miss > 0:
            level = "⚠️" if miss >= 20 else "•"
            insights.append(f"{level} **{col}** has **{miss:.0f}%** missing values.")

    # --- Numeric column shape: skew, near-constant, outlier hints ---
    for col in numeric_columns(df):
        s = df[col].dropna()
        if s.empty:
            continue

        # Skewness tells us if the distribution leans left or right.
        skew = s.skew()
        if skew > 1:
            insights.append(f"📈 **{col}** is **right-skewed** (long tail of high values).")
        elif skew < -1:
            insights.append(f"📉 **{col}** is **left-skewed** (long tail of low values).")

        # A column with (almost) one value carries little information.
        if s.nunique() == 1:
            insights.append(f"🔒 **{col}** is **constant** — every row has the same value.")

        # Simple outlier check using the standard deviation rule.
        std = s.std()
        if std and std > 0:
            extreme = ((s - s.mean()).abs() > 3 * std).sum()
            if extreme > 0:
                insights.append(
                    f"❗ **{col}** has **{extreme}** potential outlier(s) (>3 std from mean)."
                )

    # --- Categorical column cardinality + dominant categories ---
    for col in categorical_columns(df):
        unique = df[col].nunique(dropna=True)
        if unique > 0.5 * n and unique > 20:
            insights.append(
                f"🔑 **{col}** has **high cardinality** ({unique} unique values) — "
                "likely an ID or free-text field."
            )
        elif unique > 0:
            top = df[col].value_counts(normalize=True)
            if not top.empty and top.iloc[0] > 0.8:
                insights.append(
                    f"🏷️ **{col}** is dominated by **'{top.index[0]}'** "
                    f"({top.iloc[0] * 100:.0f}% of rows)."
                )

    # --- Duplicate rows ---
    dupes = df.duplicated().sum()
    if dupes > 0:
        insights.append(f"🧬 The dataset contains **{dupes}** duplicate row(s).")

    if not insights:
        insights.append("✅ No issues detected — the data looks clean and well-formed!")
    return insights


# Header.
st.markdown(
    f"<h1>📊 CSV <span class='accent'>Auto-Analyzer</span></h1>"
    "<p style='color:#8b949e;margin-top:-10px;'>"
    "Upload a CSV and get instant stats, charts and insights.</p>",
    unsafe_allow_html=True,
)


# Upload section. Centered and shown front-and-center until a file arrives.
# Center the uploader by placing it in the middle of three columns.
_, mid, _ = st.columns([1, 2, 1])
with mid:
    uploaded = st.file_uploader("Upload your CSV file", type=["csv"], label_visibility="collapsed")

# Nothing uploaded yet → show a friendly prompt and stop here.
if uploaded is None:
    with mid:
        st.info("⬆️ Drag & drop a CSV file above to begin. Everything runs locally on your machine.")
    st.stop()


# Analyze. Runs only after a file is uploaded.
try:
    df = load_csv(uploaded.getvalue())
except Exception as err:  # pragma: no cover - user-facing error path
    st.error(f"Could not read that CSV: {err}")
    st.stop()

if df.empty:
    st.warning("The uploaded file is empty.")
    st.stop()

num_cols = numeric_columns(df)
cat_cols = categorical_columns(df)

st.success(f"Loaded **{uploaded.name}** — analysis ready below.")

# Tabs appear once the data has been processed.
tab_overview, tab_types, tab_charts, tab_insights, tab_data = st.tabs(
    ["📋 Overview", "🧱 Columns", "📈 Charts", "💡 Insights", "🔍 Raw Data"]
)

# Tab 1: Overview.
with tab_overview:
    st.subheader("Dataset summary")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Rows", f"{len(df):,}")
    c2.metric("Columns", f"{df.shape[1]:,}")
    c3.metric("Numeric cols", len(num_cols))
    c4.metric("Text cols", len(cat_cols))

    total_cells = df.size
    missing_cells = int(df.isna().sum().sum())
    miss_pct = (missing_cells / total_cells * 100) if total_cells else 0

    c5, c6, c7 = st.columns(3)
    c5.metric("Missing values", f"{missing_cells:,}", f"{miss_pct:.1f}% of cells")
    c6.metric("Duplicate rows", f"{int(df.duplicated().sum()):,}")
    c7.metric("Memory", f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB")

# Tab 2: Columns and data types.
with tab_types:
    st.subheader("Per-column statistics")
    st.dataframe(summary_table(df), use_container_width=True, hide_index=True)

# Tab 3: Charts.
with tab_charts:
    if num_cols:
        st.subheader("Numeric distributions")
        # Two charts per row keeps things compact on a laptop screen.
        for i in range(0, len(num_cols), 2):
            cols = st.columns(2)
            for slot, col_name in zip(cols, num_cols[i : i + 2]):
                fig = px.histogram(
                    df, x=col_name, nbins=30,
                    title=f"Histogram — {col_name}",
                    color_discrete_sequence=[ACCENT],
                )
                fig.update_layout(**PLOTLY_LAYOUT)
                slot.plotly_chart(fig, use_container_width=True)

    if cat_cols:
        st.subheader("Top categories")
        for i in range(0, len(cat_cols), 2):
            cols = st.columns(2)
            for slot, col_name in zip(cols, cat_cols[i : i + 2]):
                top = df[col_name].value_counts().head(10)
                fig = px.bar(
                    x=top.values, y=top.index.astype(str),
                    orientation="h",
                    title=f"Top 10 — {col_name}",
                    labels={"x": "Count", "y": col_name},
                    color_discrete_sequence=[ACCENT],
                )
                # Show the most frequent value at the top.
                fig.update_layout(**PLOTLY_LAYOUT, yaxis=dict(autorange="reversed"))
                slot.plotly_chart(fig, use_container_width=True)

    if not num_cols and not cat_cols:
        st.info("No chartable columns were detected.")

# Tab 4: Insights.
with tab_insights:
    st.subheader("Auto-generated insights")
    for bullet in generate_insights(df):
        st.markdown(f"<div class='insight'>{bullet}</div>", unsafe_allow_html=True)

# Tab 5: Raw data preview.
with tab_data:
    st.subheader("Raw data")
    st.caption(f"Showing the full table ({len(df):,} rows). Scroll to explore.")
    st.dataframe(df, use_container_width=True)
