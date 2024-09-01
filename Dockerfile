# Use an official Python runtime as a parent image
FROM python:3.8-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install additional packages and dependencies
RUN apt-get update && apt-get install -y \
    supervisor \
    redis-server \
    libjpeg-dev \
    zlib1g-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy the font file into the appropriate directory in the container
COPY font/arial.ttf /usr/share/fonts/truetype/arial.ttf

# Ensure the logging directory exists
RUN mkdir -p /var/log && chmod -R 777 /var/log

# Expose the Redis and Flask application ports
EXPOSE 6379
EXPOSE 8081

# Run Redis, Celery worker, and Flask app using supervisor
CMD ["/usr/bin/supervisord", "-c", "/usr/src/app/supervisord.conf"]
