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

s = time.perf_counter()
G = ox.graph_from_place("Manhattan, New York")
Gp = ox.project_graph(G)
points = ox.utils_geo.sample_points(ox.get_undirected(Gp), 1) # 
elapsed = time.perf_counter() - s
print(f"{__file__} executed in {elapsed:0.2f} seconds.")
print(type(points))
print(points)


envgdf = gpd.GeoDataFrame(points)
envgdf = envgdf.rename(columns={0:'geometry'}).set_geometry('geometry')
print("\nGeoDataFrame :\n", envgdf)

coord_list = [(x,y) for x,y in zip(envgdf['geometry'].x , envgdf['geometry'].y)]
print(type(coord_list))
print(coord_list)
print(coord_list[0])
print(type(coord_list[0]))
x = coord_list[0][0]
y = coord_list[0][1]

result = utmToLatLng(18, x, y)
print(result)