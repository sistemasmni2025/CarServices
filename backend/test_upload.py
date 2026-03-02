import requests
import os

def test_photo_upload():
    # Creamos una imagen dummy
    with open("dummy.jpg", "wb") as f:
        f.write(b"this is a fake image")

    url = "http://127.0.0.1:3000/api/proxy/upload"
    files = {"foto": ("dummy.jpg", open("dummy.jpg", "rb"), "image/jpeg")}
    data = {"tipo": "Foto General", "ordenid": "268"}

    try:
        print("Sending to proxy...")
        r = requests.post(url, files=files, data=data)
        print("Status code:", r.status_code)
        print("Response:", r.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_photo_upload()
    if os.path.exists("dummy.jpg"):
        os.remove("dummy.jpg")
