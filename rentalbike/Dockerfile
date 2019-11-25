FROM python:3

RUN pip3 install requests && \
    rm -r /root/.cache
RUN    apt-get update \
    && apt-get install openssl \
    && apt-get install ca-certificates
RUN pip3 install pyopenssl
COPY rentalbike.py .
CMD [ "python", "rentalbike.py" ]