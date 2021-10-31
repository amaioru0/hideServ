# -*- coding: utf-8 -*-
# pylint: disable=C0111,C0103,R0205
import functools
import logging
import threading
import time
import pika
from pika.exchange_type import ExchangeType
import json
import multiprocessing as mp
import osmnx as ox
import time
import geopandas as gpd
from utm import utmToLatLng

ox.config(
    log_console=True,
    log_file=True,
    use_cache=True,
    data_folder=".temp/data",
    logs_folder=".temp/logs",
    imgs_folder=".temp/imgs",
    cache_folder=".temp/cache",
)

# LOG_FORMAT = ('%(levelname) -10s %(asctime)s %(name) -30s %(funcName) '
#               '-35s %(lineno) -5d: %(message)s')
# LOGGER = logging.getLogger(__name__)

# logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

def ack_message(ch, delivery_tag, result):
    """Note that `ch` must be the same pika channel instance via which
    the message being ACKed was retrieved (AMQP protocol constraint).
    """
    if ch.is_open:
        print("here")
        print(result)
        ch.basic_ack(delivery_tag)
        ch.basic_publish(exchange='', routing_key='resultsq', body=json.dumps(result, ensure_ascii=False))
    else:
        # Channel is already closed, so we can't ACK this message;
        # log and/or do something that makes sense for your app in this case.
        pass


def do_work(conn, ch, delivery_tag, body):
    thread_id = threading.get_ident()
    # LOGGER.info('Thread id: %s Delivery tag: %s Message body: %s', thread_id,
    #             delivery_tag, body)
    # Sleeping to simulate 10 seconds of work
    requestParams = json.loads(body.decode('utf-8'))
    nftContract = requestParams["nftContract"]
    tokenId = requestParams["tokenId"]
    contractStandard = requestParams["contractStandard"]
    location = requestParams["location"]
    print(f"Starting task for contract {nftContract} {contractStandard} {tokenId} in {location}")
    try:
        G = ox.graph_from_place(location)
        print("done long running task")
    except:
        print ('Caught error')
        result = {"error": "true", "coords": (0, 0), "nftContract": nftContract, "tokenId": tokenId, "contractStandard": contractStandard, "loocation": location}
        cb = functools.partial(ack_message, ch, delivery_tag, result)
        conn.add_callback_threadsafe(cb)
    else:
        try:
            print ('No exception occurred')
            s = time.perf_counter()
            Gp = ox.project_graph(G)
            points = ox.utils_geo.sample_points(ox.get_undirected(Gp), 1) # 
            elapsed = time.perf_counter() - s
            print(f"executed in {elapsed:0.2f} seconds.")

            envgdf = gpd.GeoDataFrame(points)
            envgdf = envgdf.rename(columns={0:'geometry'}).set_geometry('geometry')
            print("\nGeoDataFrame :\n", envgdf)
            coord_list = [(x,y) for x,y in zip(envgdf['geometry'].x , envgdf['geometry'].y)]
            x = coord_list[0][0]
            y = coord_list[0][1]
            print(envgdf.crs)
            zone = int(''.join(filter(str.isdigit, envgdf.crs.utm_zone)))
            coords = utmToLatLng(zone, x, y)
        except:
            print ('Caught error (2)')
            result = {"error": "true", "coords": (0, 0), "nftContract": nftContract, "tokenId": tokenId, "contractStandard": contractStandard, "loocation": location}
            cb = functools.partial(ack_message, ch, delivery_tag, result)
            conn.add_callback_threadsafe(cb)
        else:
            print(coords)
            result = {"error": "false", "coords": coords, "nftContract": nftContract, "tokenId": tokenId, "contractStandard": contractStandard, "loocation": location}
            print(f"Finished task for contract {nftContract} {contractStandard} {tokenId} in {location}")
            cb = functools.partial(ack_message, ch, delivery_tag, result)
            conn.add_callback_threadsafe(cb)

def on_message(ch, method_frame, _header_frame, body, args):
    (conn, thrds) = args
    delivery_tag = method_frame.delivery_tag
    t = threading.Thread(target=do_work, args=(conn, ch, delivery_tag, body))
    t.start()
    thrds.append(t)


credentials = pika.PlainCredentials('guest', 'guest')
# Note: sending a short heartbeat to prove that heartbeats are still
# sent even though the worker simulates long-running work
parameters = pika.ConnectionParameters(
    'localhost', credentials=credentials, heartbeat=0)
connection = pika.BlockingConnection(parameters)

channel = connection.channel()
channel.exchange_declare(
    exchange="test_exchange",
    exchange_type=ExchangeType.direct,
    passive=False,
    durable=True,
    auto_delete=False)
channel.queue_declare(queue="eventsq", durable=True)
channel.queue_bind(
    queue="eventsq", exchange="test_exchange", routing_key="standard_key")

channel.queue_declare(queue='resultsq', durable=True)
channel.queue_bind(
    queue="resultsq", exchange="test_exchange", routing_key="standard_key")
# Note: prefetch is set to 1 here as an example only and to keep the number of threads created
# to a reasonable amount. In production you will want to test with different prefetch values
# to find which one provides the best performance and usability for your solution
channel.basic_qos(prefetch_count=1)

threads = []
on_message_callback = functools.partial(on_message, args=(connection, threads))
channel.basic_consume('eventsq', on_message_callback)

try:
    channel.start_consuming()
    # print("GeoServ started...")
    # print("Number of processors: ", mp.cpu_count())
except KeyboardInterrupt:
    channel.stop_consuming()

# Wait for all to complete
for thread in threads:
    thread.join()

connection.close()