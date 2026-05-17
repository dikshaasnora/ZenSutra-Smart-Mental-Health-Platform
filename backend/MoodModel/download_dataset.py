import os
import zipfile
import pandas as pd
import numpy as np
import cv2
import urllib.request
import sys

url = "https://www.dropbox.com/s/opuvvdv3uligypx/fer2013.csv.zip?dl=1"
file_name = "fer2013.csv.zip"

print(f"Downloading FER-2013 dataset from {url}...")
try:
    urllib.request.urlretrieve(url, file_name)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading the dataset: {e}")
    sys.exit(1)

print("Extracting zip file...")
with zipfile.ZipFile(file_name, 'r') as zip_ref:
    zip_ref.extractall(".")

print("Parsing CSV and saving images to 'data/' directory...")
try:
    df = pd.read_csv("fer2013.csv")
except FileNotFoundError:
    print("Error: fer2013.csv not found after extraction.")
    sys.exit(1)

emotions = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'sad', 5: 'surprise', 6: 'neutral'}

for subset in ['train', 'test']:
    for emotion in emotions.values():
        os.makedirs(f"data/{subset}/{emotion}", exist_ok=True)

print(f"Processing {len(df)} images. This may take a moment...")
for index, row in df.iterrows():
    emotion = emotions[row['emotion']]
    usage = row['Usage']
    
    # Parse the space-separated pixel values
    pixels = np.fromstring(row['pixels'], dtype=int, sep=' ').reshape(48, 48)
    
    # Usage contains 'Training', 'PublicTest', or 'PrivateTest'
    subset = 'train' if usage == 'Training' else 'test'
    
    img_path = f"data/{subset}/{emotion}/{index}.jpg"
    cv2.imwrite(img_path, pixels)
    
    if index > 0 and index % 5000 == 0:
        print(f"Processed {index} images...")

print("Dataset successfully extracted to data/ folder.")

# Clean up
try:
    os.remove(file_name)
    os.remove("fer2013.csv")
    print("Cleaned up temporary files.")
except OSError:
    pass
