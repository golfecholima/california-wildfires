#!/usr/bin/env python3

import pandas as pd
import geopandas as gpd
import fiona
import subprocess
import os
import datetime

urls = {
        "nasa_modis": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/c6.1/FirespotArea_usa_contiguous_and_hawaii_c6.1_24h.kmz",
    "nasa_viirs_snpp": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz",
    "nasa_viirs_noaa20": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/noaa-20-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_noaa-20-viirs-c2_24h.kmz",
    "nifc_polygons": "https://opendata.arcgis.com/datasets/2191f997056547bd9dc530ab9866ab61_0.geojson",
    "nifc_points": "https://opendata.arcgis.com/datasets/9838f79fb30941d2adde6710e9d6b0df_0.geojson"
    }

gpd.io.file.fiona.drvsupport.supported_drivers['KML'] = 'rw'

for k,v in urls.items():
    if v.endswith(".kmz"):
        i = gpd.read_file(v, driver='KML')
        i.to_file("./gis/" + k + ".geojson", driver="GeoJSON")
    else:
        i = gpd.read_file(v)
        i.to_file("./gis/" + k + ".geojson", driver="GeoJSON")

gdf_noaa20 = gpd.read_file("./gis/nasa_viirs_noaa20.geojson")
gdf_snpp = gpd.read_file("./gis/nasa_viirs_snpp.geojson")
gdf_modis = gpd.read_file("./gis/nasa_modis.geojson")

gdf_list = [gdf_modis, gdf_snpp, gdf_noaa20]

gdf_nasa_all = gpd.GeoDataFrame(pd.concat(gdf_list, ignore_index=True))

gdf_nasa_all.to_file("./gis/nasa_all.geojson", driver="GeoJSON")

token = open('./token.txt','r').readline()
upload = ['tilesets', 'upload-source', '--replace', '--token', token, 'calnewsroom', 'nifc-polygons', './gis/nifc_polygons.geojson']
publish = ['tilesets', 'publish', 'calnewsroom.nifc-polygons', '--token', token]

subprocess.Popen(upload, stdout=subprocess.PIPE).wait()
subprocess.Popen(publish, stdout=subprocess.PIPE)

lastUpdated = datetime.datetime.now().strftime('%A, %B %d, %Y at %I:%M %p')

print(lastUpdated)

with open('./last-updated.txt', 'w') as f:
    f.write(lastUpdated)

print('Done')