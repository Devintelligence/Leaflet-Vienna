FROM python:3

RUN pip3 install requests && \
    rm -r /root/.cache
RUN pip3 install python-dateutil && \
    rm -r /root/.cache
COPY carusoreservationhistory.py .
CMD [ "python", "carusoreservationhistory.py" ]