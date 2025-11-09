# backend/Dockerfile

# Use a lean Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /usr/src/app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port (e.g., 5000 is common for Flask)
EXPOSE 5000

# Command to run the application using a production-ready server (Gunicorn)
# Install gunicorn in your requirements.txt if you haven't already.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]