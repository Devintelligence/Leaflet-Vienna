import datetime
import requests
import time 
import urllib3
import os
from dateutil import parser
from datetime import timedelta
import configparser

requests.packages.urllib3.disable_warnings()
requests.packages.urllib3.util.ssl_.DEFAULT_CIPHERS += 'HIGH:!DH:!aNULL'
try:
    requests.packages.urllib3.contrib.pyopenssl.DEFAULT_SSL_CIPHER_LIST += 'HIGH:!DH:!aNULL'
except AttributeError:
    # no pyopenssl support used / needed / available
    pass
 
while True:
	try:
		today = datetime.datetime.now()
		start_time = today.strftime('%Y-%m-%dT%H:%M:%S')
		modified_gte = (today - timedelta(hours = 25)).strftime('%Y-%m-%dT%H:%M:%S')
		modified_lte = (today - timedelta(hours = 24)).strftime('%Y-%m-%dT%H:%M:%S')
		print("Program starts running at ", start_time)
		orionUri = os.getenv('orionUri', 'http://0.0.0.0:1026/') + 'v2/entities'
		print('Orion Uri: ', orionUri)
		config = configparser.ConfigParser()
		config.read('/carusoreservationhistory.ini')
		uri = config['carusoreservationhistory']['url']
		token = config['carusoreservationhistory']['token']
		uri += '?state=closed&modified_gte=' + modified_gte + '&modified_lte=' + modified_lte 
		print(uri)
		response = requests.get( uri, headers={'Authorization': 'token {}'.format(token)}, verify=False)
		results = response.json()['results']
		data_type = 'ReservationHistory'
		headers = {"fiware-service": "carusoReservationHistory", "Content-Type": "application/json", 'Accept': 'application/json'}
		for res in results:
			data = {'id': str(data_type) + ':' + str(res['user_id']), 'type': data_type}
			data['reservation_start'] = {'type': 'DateTime', 'value': parser.parse(res['reservation_start']).strftime('%Y-%m-%dT%H:%M:%S')}
			data['reservation_end'] = {'type': 'DateTime', 'value': parser.parse(res['reservation_end']).strftime('%Y-%m-%dT%H:%M:%S')}
			data['state'] = {'type': 'Text', 'value': str(res['state'])}
			data['distance'] = {'type': 'Number', 'value': res['distance']}
			data['vehicle_id'] = {'type': 'Number', 'value': res['vehicle_id']}
			data['modified'] = {'type': 'DateTime', 'value': parser.parse(res['modified']).strftime('%Y-%m-%dT%H:%M:%S')}
			data['date_observerd'] = {'type': 'DateTime', 'value': start_time}
			data['user_id'] = {'type': 'Text', 'value': str(res['user_id'])}
			utilization_start = utilization_end = start_time
			batterylevel_at_start = batterylevel_at_end = -1
			if 'state_of_charge' in res and res['state_of_charge']:
				if 'utilization_start' in res['state_of_charge'] and 'date_time' in res['state_of_charge']['utilization_start']:
					utilization_start = parser.parse(res['state_of_charge']['utilization_start']['date_time']).strftime('%Y-%m-%dT%H:%M:%S')
					batterylevel_at_start = res['state_of_charge']['utilization_start']['batterylevel']
				if 'utilization_end' in res['state_of_charge'] and 'date_time' in res['state_of_charge']['utilization_end']:
					utilization_end = parser.parse(res['state_of_charge']['utilization_end']['date_time']).strftime('%Y-%m-%dT%H:%M:%S')
					batterylevel_at_end = res['state_of_charge']['utilization_end']['batterylevel']
			data['utilization_start'] = {'type': 'DateTime', 'value':utilization_start}
			data['batterylevel_at_start'] = {'type': 'Number', 'value': batterylevel_at_start}
			data['utilization_end'] = {'type': 'DateTime', 'value':utilization_end}
			data['batterylevel_at_end'] = {'type': 'Number', 'value': batterylevel_at_end}
			response = requests.post( orionUri , json = data, headers = headers  )
			print('Post operation --------------------------------------------------------')
			print('Data', data)
			print('Response code from context broker after post: ',response.status_code)
			try:
				print('Response context broker after post: ', response.json())
				if response.status_code == 422 and response.json()['description'] == 'Already Exists':
					print('Patch operation ------------------------------------------------------------')
					patch_uri = '%s/%s/attrs' %(orionUri, data['id'])
					del data['id']
					del data['type']
					response = requests.patch( patch_uri , json = data, headers = headers  )
					print('Response code from context broker after Patch: ',response.status_code)
					try:
						print('Response context broker after patch: ', response.json())
					except:
						pass
			except:
				pass
		print('Sleep for one hour')
		time.sleep(3600)
		print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
	except Exception as e:
		print('Error: ', e)