import datetime
import time
import requests 
import urllib3

requests.packages.urllib3.disable_warnings()
requests.packages.urllib3.util.ssl_.DEFAULT_CIPHERS += 'HIGH:!DH:!aNULL'
try:
    requests.packages.urllib3.contrib.pyopenssl.DEFAULT_SSL_CIPHER_LIST += 'HIGH:!DH:!aNULL'
except AttributeError:
    # no pyopenssl support used / needed / available
    pass
 
while True:
	try:
		start_time = datetime.datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
		print("Program starts running at ", start_time)
		response = requests.get( 'https://syctest-i.sycube.at/preprod/service/si.json', auth=('test', 'test'), verify=False)
		station_data = response.json()['stationlist']
		station_list = []
		data_type = 'RentalBikeStationtest24'
		headers = {"Content-Type": "application/json", 'Accept': 'application/json'}
		orionUri = "http://0.0.0.0:1026/v2/entities"
		for station in station_data:
			data = {'id': str(data_type) + ':' + str(station['id']), 'type': data_type}
			data['name'] = {'type': 'Text', 'value': station['name']}
			data['temperature'] = {'type': 'Number', 'value': int(station['temperature']['value'])}
			data['temperature_observed'] = {'type': 'DateTime', 'value': datetime.datetime.fromtimestamp(station['temperature']['key'] / 1e3).strftime('%Y-%m-%dT%H-%M-%S')}
			data['stationType'] = {'type': 'Text', 'value': str(station['type'])}
			data['emptyCnt'] = {'type': 'Number', 'value': int(station['emptyCnt'])}
			data['ebikeCnt'] = {'type': 'Number', 'value': int(station['ebikeCnt'])}
			data['offline'] = {'type': 'Boolean', 'value': station['offline']}
			data['boxOfflineCnt'] = {'type': 'Number', 'value': int(station['boxOfflineCnt'])}
			data['boxErrCnt'] = {'type': 'Number', 'value': int(station['boxErrCnt'])}
			data['boxOfflineCnt'] = {'type': 'Number', 'value': int(station['boxOfflineCnt'])}
			data['boxAvailCnt'] = {'type': 'Number', 'value': int(station['boxAvailCnt'])}
			data['bikeCnt'] = {'type': 'Number', 'value': int(station['bikeCnt'])}
			data['ip'] = {'type': 'Text', 'value': str(station['ip'])}
			data['dateObserverd'] = {'type': 'DateTime', 'value': start_time}
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