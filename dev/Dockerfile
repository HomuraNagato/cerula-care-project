FROM python:3.13-bookworm

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /home

# Auto-activate venv
ENV VIRTUAL_ENV=/home/.venv
ENV PATH="/home/.venv/bin:$PATH"
