#!/usr/bin/env python3

import pandas as pd
import numpy
import geopandas as gpd
import fiona
import os
import datetime

urls = {
#     "airnow": "https://www.airnowapi.org/aq/data/?startDate=" + utc_start_time + "&endDate=" + utc_end_time + "&parameters=PM25&BBOX=-127.011261,31.603973,-112.509308,44.172104&dataType=B&format=application/vnd.google-earth.kml&verbose=0&monitorType=2&includerawconcentrations=0&API_KEY=4D71388D-C738-4212-965B-7AD8817BCD5F",
    "calfire": "https://www.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=false",
    "nasa_modis": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/c6.1/FirespotArea_usa_contiguous_and_hawaii_c6.1_24h.kmz",
    "nasa_viirs_snpp": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz",
    "nasa_viirs_noaa20": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/noaa-20-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_noaa-20-viirs-c2_24h.kmz",
    "nifc": "https://data-nifc.opendata.arcgis.com/datasets/2191f997056547bd9dc530ab9866ab61_0.geojson?outSR=%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A4326%7D"
    }

gpd.io.file.fiona.drvsupport.supported_drivers['KML'] = 'rw'

for k,v in urls.items():
    if v.endswith(".kmz"):
        i = gpd.read_file(v, driver='KML')
        i.to_file("../" + k + ".geojson", driver="GeoJSON")
    else:
        i = gpd.read_file(v)
        i.to_file("../" + k + ".geojson", driver="GeoJSON")

gdf_noaa20 = gpd.read_file("../nasa_viirs_noaa20.geojson")
gdf_snpp = gpd.read_file("../nasa_viirs_snpp.geojson")
gdf_modis = gpd.read_file("../nasa_modis.geojson")

gdf_list = [gdf_modis, gdf_snpp, gdf_noaa20]

gdf_nasa_all = gpd.GeoDataFrame(pd.concat( gdf_list, ignore_index=True))

gdf_nasa_all.to_file("../nasa_all.geojson", driver="GeoJSON")

print('Done')