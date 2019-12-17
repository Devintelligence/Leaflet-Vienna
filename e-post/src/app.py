#!/usr/bin/python3
from datetime import datetime
import requests
import os
import csv
import threading
import logging

from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.dirname(os.path.abspath(__file__)) + '/files/'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# -- form handlers --
def process_haufgasse(filename):
    orionUri = os.getenv('orionUri', 'http://0.0.0.0:1026/') + 'v2/entities'
    headers = {
        "Content-Type": "application/json", 'Accept': 'application/json',
        "fiware-service": "vienna_buildings"
    }
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(file_path) as f:
        file_data = csv.reader(f)
        _id, _type, cols, location = '', 'hauffgasse', [], None

        for i, row in enumerate(file_data):
            print('\n--------------------------- hauffgasse Request No ::  %s---------------------------------' % i)
            # Skip the header from the CSV file
            if not _id and i == 0:
                _id = _type + ":" + row[0]
                location = {'type': 'geo:json', 'value': {'type': 'Point', 'coordinates': [float(row[2]), float(row[1])]}}
            if i in (0,1,3):
                continue
            if i == 2:
                for r in row:
                    cols.append(''.join(e for e in r.replace(' ', '_') if e.isalnum() or e=='_'))
                continue

            orion_data = {}
            for j, col in enumerate(cols):
                if j==0:
                    date_observed = datetime.strptime(row[0], "%d.%m.%Y %H:%M").strftime('%Y-%m-%dT%H:%M:%S')
                    orion_data[col] = {"type": "DateTime", "value": date_observed}
                else:
                    orion_data[col] = {"type": "Number", "value": row[j]}
            orion_data['location'] = location

            try:
                # Enter the PATCH first to reduce the failure rate of request
                patch_uri = '%s/%s/attrs' % (orionUri, _id)
                response = requests.patch(patch_uri, json=orion_data, headers=headers)
                if response.status_code == 204:
                    print('PATCH >>>>>>>> ID : %s >>>>> Type : %s >>>>> Code: %s' % (_id, _type, response.status_code))
                    continue
                try:
                    print (response.json())
                except:
                    pass
            except Exception as e:
                print("----------- PATCH request Error -----\n", e)
                pass

            try:
                # POST request after patch request
                orion_data.update({'id': _id, 'type': _type})
                response = requests.post(orionUri, json=orion_data, headers=headers)
                print('POST========== ID : %s ==== Type : %s ==== Code: %s' % (_id, _type, response.status_code))
                try:
                    print (response.json())
                except:
                    pass
            except Exception as e:
                print('------------- POST request Error --------------\n', e)
                pass
    print('--------------- haufgasse file completed ---------- ')

def process_epost(filename):
    orionUri = os.getenv('orionUri', 'http://0.0.0.0:1026/') + 'v2/entities'
    headers = {
        "Content-Type": "application/json", 'Accept': 'application/json',
        "fiware-service": "elogistics"
    }
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(file_path) as f:
        file_data = csv.reader(f)
        for i, row in enumerate(file_data):
            print('\n--------------------------- epost Request No ::  %s---------------------------------' % i)
            # Skip the header from the CSV file
            if i == 0:
                continue

            row_id = row[1] + ":" + row[2]
            row_type = "elogistics"
            orion_data = {
                "datamodel": {'type': 'Text', 'value': row[0]},
                "deviceid": {'type': 'Text', 'value': row[1]},
                "datapoint": {'type': 'Text', 'value': row[2]},
                "dateobservered": {'type': 'DateTime', 'value': row[3][:19]},
                "value": {'type': 'Number', 'value': int(row[4]) if str(row[4]).isdigit() else -1},
                "location": {'type': 'geo:json', 'value': {'type': 'Point', 'coordinates': [float(row[5]), float(row[6])]}}
            }

            try:
                # Enter the PATCH first to reduce the failure rate of request
                patch_uri = '%s/%s/attrs' % (orionUri, row_id)
                response = requests.patch(patch_uri, json=orion_data, headers=headers)
                if response.status_code == 204:
                    print('PATCH >>>>>>>> ID : %s >>>>> Type : %s >>>>> Code: %s' % (row_id, row_type, response.status_code))
                    continue
            except Exception as e:
                print("----------- PATCH request Error -----\n", e)
                pass

            try:
                # POST request after patch request
                orion_data.update({"id": row_id, "type": row_type})
                response = requests.post(orionUri, json=orion_data, headers=headers)
                print('POST========== ID : %s ==== Type : %s ==== Code: %s' % (row_id, row_type, response.status_code))
            except Exception as e:
                print('------------- POST request Error --------------\n', e)
                pass
    print('--------------- epost file completed ---------- ')

# Have a map handy to get function from form name.
form_handlers = {
    'haufgasse' : process_haufgasse,
    'epost' : process_epost
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload')
def upload():
    return render_template('upload.html')

@app.route('/')
def index():
    return redirect(url_for('upload'))

@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        form_name = request.form.get('FormName')
        file = request.files.get('epost_file') or request.files.get('haufgasse_file')

        filename = secure_filename(file.filename)
        if file and allowed_file(file.filename):
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            fun = form_handlers[form_name]
            x = threading.Thread(target=fun, args=(filename,))
            x.start()
            return "File upload success"

    return "File upload success"

if __name__ == "__main__":

    if not os.path.exists(UPLOAD_FOLDER):
        os.mkdir(UPLOAD_FOLDER)

    app.run(host="0.0.0.0", debug=False)

