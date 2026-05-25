FROM python:latest
ENV PASSWORD=hunter2
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
