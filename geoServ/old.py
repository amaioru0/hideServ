import pika
import json
import osmnx as ox
import multiprocessing as mp
import asyncio
import time
from utm import utmToLatLng

print("GeoServ started...")
print("Number of processors: ", mp.cpu_count())

connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))
channel = connection.channel()
channel.queue_declare(queue="eventsq", durable=True)
channel.queue_declare(queue='resultsq', durable=True)

async def processTreasure(G):
    s = time.perf_counter()
    # print("One")
    # await asyncio.sleep(1)
    # print("Two")
    Gp = ox.project_graph(G)
    points = ox.utils_geo.sample_points(ox.get_undirected(Gp), 1) # 
    elapsed = time.perf_counter() - s
    print(f"{__file__} executed in {elapsed:0.2f} seconds.")
    print(type(points))
    return points

async def callbackx(requestParams):
  nftContract = requestParams["nftContract"]
  tokenId = requestParams["tokenId"]
  contractStandard = requestParams["contractStandard"]
  location = requestParams["location"]
  print(f"Starting task for contract {nftContract} {contractStandard} {tokenId} in {location}")
  # text = requestParams[0]

  try:
    G = ox.graph_from_place(location)
  except:
      print ('Caught error')
  else:
      print ('No exception occurred')
      result = await processTreasure(G)
      print(result)

def callback(ch, method, properties, body):
  #params passed fron Node
  requestParams = json.loads(body.decode('utf-8'))
  asyncio.run(callbackx(requestParams))
  # OSMX random point on a road
  # G = ox.graph_from_place(location)
  # Gp = ox.project_graph(G)
  # points = ox.utils_geo.sample_points(ox.get_undirected(Gp), 1) # generate 20 random points
  # print(points)

  # send a message back
  channel.basic_publish(exchange='', routing_key='resultsq', body=json.dumps("test", ensure_ascii=False))

# receive message and complete simulation
channel.basic_consume("eventsq", callback, auto_ack=True)
channel.start_consuming()