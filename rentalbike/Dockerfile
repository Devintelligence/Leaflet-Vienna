FROM python:3

RUN pip3 install requests && \
    rm -r /root/.cache
COPY rentalbike.py .
CMD [ "python", "rentalbike.py" ]