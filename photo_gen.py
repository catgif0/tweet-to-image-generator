import logging
from flask import Flask, jsonify, request
from celery import Celery
from PIL import Image, ImageDraw, ImageFont
import io
import requests

app = Flask(__name__)
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# Configure Celery Beat Schedule
celery.conf.beat_schedule = {
    'generate-image-every-2-minutes': {
        'task': 'photo_gen.test_periodic_task',
        'schedule': 120.0,  # run every 2 minutes
    },
}

# Set up basic logging
logging.basicConfig(level=logging.DEBUG)

@celery.task
def process_image_task(tweet_text):
    width, height = 800, 200
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("/usr/share/fonts/truetype/arial.ttf", 24)

    draw.text((10, 10), tweet_text, fill="black", font=font)
    
    # Save image to a BytesIO object
    image_bytes = io.BytesIO()
    image.save(image_bytes, format='PNG')
    image_bytes.seek(0)
    
    # Upload image to Imgur
    headers = {"Authorization": "Client-ID e272492b3b91c8c"}  # Replace with your Imgur Client ID
    response = requests.post("https://api.imgur.com/3/image", headers=headers, files={'image': image_bytes})
    
    if response.status_code == 200:
        json_response = response.json()
        logging.info(f"Image uploaded successfully: {json_response['data']['link']}")
        return json_response['data']['link']
    else:
        logging.error("Error uploading image to Imgur")
        return None

@celery.task
def test_periodic_task():
    tweet_text = "This is a test tweet to generate and upload an image every 2 minutes."
    imgur_link = process_image_task(tweet_text)
    if imgur_link:
        logging.info(f"Generated image and uploaded to Imgur: {imgur_link}")
    else:
        logging.error("Failed to generate and upload image to Imgur")

@app.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.json
    tweet_text = data.get('tweet_text')
    if tweet_text:
        task = process_image_task.delay(tweet_text)
        return jsonify({"status": "success", "task_id": task.id}), 202
    return jsonify({"status": "error", "message": "Invalid request: tweet_text not provided"}), 400

@app.route('/task-status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = process_image_task.AsyncResult(task_id)
    if task.state == 'PENDING':
        response = {'status': 'pending'}
    elif task.state == 'SUCCESS':
        response = {'status': 'completed', 'result': task.result}
    else:
        response = {'status': 'failed'}
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
