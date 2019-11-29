import datetime
import requests
import time 
import urllib3
import os
from dateutil import parser
import configparser
import json

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
		print("Program starts running at ", start_time)
		orionUri = os.getenv('orionUri', 'http://0.0.0.0:1026/') + 'v2/entities'
		print('Orion Uri: ', orionUri)
		data_type = 'StopMonitorTest'
		headers = {"fiware-service": "stopmonitortest", "Content-Type": "application/json", 'Accept': 'application/json'}
		for stop in range(1,25):
			uri = 'http://www.wienerlinien.at/ogd_realtime/monitor?stopId='+str(stop)+'&senderKey=4AhgRqktp8Ve'
			response = requests.get( uri, verify=False)
			results = response.json()['data']['monitors']
			if len(results):
				print('============================================================')
				print("stopId: " + str(stop))
			for res in results:
				if 'locationStop' in res:
					locationStop = res['locationStop'] 
					data = {'id': str(data_type) + ':' + str(locationStop['properties']['name']), 'type': data_type}
					data['locationstop_type'] = {'type': 'Text', 'value': str(locationStop['type'])}
					data['locationstop_location'] = {'type': 'geo:json', 'value': {'type': 'Point', 'coordinates': [locationStop['geometry']['coordinates'][0], locationStop['geometry']['coordinates'][1]]}}
					data['date_observerd'] = {'type': 'DateTime', 'value': start_time}
					data['locationstop_name'] = {'type': 'Text', 'value': str(locationStop['properties']['name'])}
					data['locationstop_title'] = {'type': 'Text', 'value': str(locationStop['properties']['title'])}
					data['locationstop_municipality'] = {'type': 'Text', 'value': str(locationStop['properties']['municipality'])}
					data['locationstop_municipalityId'] = {'type': 'Number', 'value': locationStop['properties']['municipalityId']}
					data['locationstop_property_type'] = {'type': 'Text', 'value': str(locationStop['properties']['type'])}
					data['locationstop_coordName'] = {'type': 'Text', 'value': str(locationStop['properties']['coordName'])}
					locationstop_gate = ''
					if 'gate' in locationStop['properties']:
						locationstop_gate = str(locationStop['properties']['gate'])
					data['locationstop_gate'] = {'type': 'Text', 'value': locationstop_gate}
					data['locationstop_attributes'] = {'type': 'StructuredValue', 'value': locationStop['properties']['attributes']}
					data['attributes'] = {'type': 'StructuredValue', 'value':res['attributes']}
					line_name = line_towards = line_direction = line_platform = line_richtungsId  = line_type =  ''
					line_realtimeSupported = line_trafficjam = line_barrierFree = False
					line_lineId = -1
					departures = []
					if 'lines' in res:
						for lines in res['lines']:
							line_name = lines['name']
							line_towards = lines['towards']
							line_direction = lines['direction']	
							line_platform = lines['platform']
							line_richtungsId = lines['richtungsId']
							line_barrierFree = lines['barrierFree']
							line_realtimeSupported = lines['realtimeSupported']
							line_trafficjam =lines['trafficjam']
							line_type = lines['type']
							line_lineId = lines['trafficjam']
							if 'departures' in lines:
								for dep in lines['departures']['departure']:
									if 'departureTime' in dep:
										dept = dep['departureTime']
										dep_dict = {'timePlanned': {'type': 'DateTime', 'value': parser.parse(dept['timePlanned']).strftime('%Y-%m-%dT%H:%M:%S')}, 'timeReal': {'type': 'DateTime', 'value': parser.parse(dept['timeReal']).strftime('%Y-%m-%dT%H:%M:%S')}, 'countdown': {'type': 'Number', 'value': dept['countdown']}}
										vehicle = {}
										if 'vehicle' in dep:
											vehicle = {'name': {'type': 'Text', 'value': dep['vehicle']['name']}, 'towards': {'type': 'Text', 'value': dep['vehicle']['towards']}, 'direction': {'type': 'Text', 'value': dep['vehicle']['direction']}, 'richtungsId': {'type': 'Text', 'value': dep['vehicle']['richtungsId']}, 'barrierFree': {'type': 'Boolean', 'value': dep['vehicle']['barrierFree']}, 'realtimeSupported': {'type': 'Boolean', 'value': dep['vehicle']['realtimeSupported']}, 'trafficjam': {'type': 'Boolean', 'value': dep['vehicle']['trafficjam']}, 'type': {'type': 'Text', 'value': dep['vehicle']['type']}, 'attributes':{'type': 'StructuredValue', 'value':dep['vehicle']['attributes']}, 'linienId': {'type': 'Number', 'value': dep['vehicle']['linienId']}}
										dep_dict['vehicle'] = {'type': 'StructuredValue', 'value': vehicle}
										departures.append(dep_dict)
					data['line_name'] = {'type': 'Text', 'value': line_name}
					data['line_towards'] = {'type': 'Text', 'value': line_towards}
					data['line_direction'] = {'type': 'Text', 'value': line_direction}
					data['line_platform'] = {'type': 'Text', 'value': line_platform}
					data['line_richtungsId'] = {'type': 'Text', 'value': line_richtungsId}
					data['line_barrierFree'] = {'type': 'Boolean', 'value': line_barrierFree}
					data['line_type'] = {'type': 'Text', 'value': line_type}
					data['line_lineId'] = {'type': 'Number', 'value': line_lineId}
					data['line_realtimeSupported'] = {'type': 'Boolean', 'value': line_realtimeSupported}
					data['line_trafficjam'] = {'type': 'Boolean', 'value': line_trafficjam}
					data['departures'] = {'type': 'Array', 'value': departures}
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
	break