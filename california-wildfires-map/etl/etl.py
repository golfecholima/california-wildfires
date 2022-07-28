#!/usr/bin/env python3

import pandas as pd
import geopandas as gpd
import json
import fiona
import subprocess
import os
import datetime
import pytz


utcNow = pytz.utc.localize(datetime.datetime.utcnow())
pdtNow = utcNow.astimezone(pytz.timezone("America/Los_Angeles"))
lastUpdated = pdtNow.strftime('%A, %B %d, %Y at %I:%M %p') + ' PST'

urls = {
    "nasa_modis": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/c6.1/FirespotArea_usa_contiguous_and_hawaii_c6.1_24h.kmz",
    "nasa_viirs_snpp": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz",
    "nasa_viirs_noaa20": "https://firms.modaps.eosdis.nasa.gov/usfs/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/noaa-20-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_noaa-20-viirs-c2_24h.kmz",
    "nifc_polygons": "https://opendata.arcgis.com/datasets/2191f997056547bd9dc530ab9866ab61_0.geojson",
    "nifc_points": "https://opendata.arcgis.com/datasets/9838f79fb30941d2adde6710e9d6b0df_0.geojson"
}

gpd.io.file.fiona.drvsupport.supported_drivers['KML'] = 'rw'

#Go throught the dictionary and export each source as geojson
for k,v in urls.items():
    if v.endswith(".kmz"):
        i = gpd.read_file(v, driver='KML')
        try:
            i.to_file("./gis/" + k + ".geojson", driver="GeoJSON")
        except:
            nasa_error = lastUpdated + '\nError: There was an error trying to write a NASA .kmz file to .geojson in the gis folder, etl.py Line 32\n'
            with open('log.txt', 'a') as f:
                f.write(nasa_error)
    else:
        i = gpd.read_file(v)
        try:
            i.to_file("./gis/" + k + ".geojson", driver="GeoJSON")
        except:
            nifc_error = lastUpdated + '\nError: There was an error trying to write a NIFC .geojson file to .geojson in the gis folder, etl.py Line 40\n'
            with open('log.txt', 'a') as f:
                f.write(nifc_error)

gdf_noaa20 = gpd.read_file("./gis/nasa_viirs_noaa20.geojson")
gdf_snpp = gpd.read_file("./gis/nasa_viirs_snpp.geojson")
gdf_modis = gpd.read_file("./gis/nasa_modis.geojson")
gdf_nifc_poly = gpd.read_file("./gis/nifc_polygons.geojson")
gdf_nifc_point = gpd.read_file("./gis/nifc_points.geojson")

# Merge the NASA sources
gdf_list = [gdf_modis, gdf_snpp, gdf_noaa20]
gdf_nasa_all = gpd.GeoDataFrame(pd.concat(gdf_list, ignore_index=True))
gdf_nasa_all.to_file("./gis/nasa_all.geojson", driver="GeoJSON")

# Remove NIFC polys that are <10 acres
gdf_nifc_poly_10_plus = gdf_nifc_poly[gdf_nifc_poly.irwin_DailyAcres >= 10]
gdf_nifc_poly_10_plus.to_file("./gis/nifc_polygons.geojson", driver="GeoJSON")

# Remove NIFC origins that don't have a corresponding polygon
gdf_nifc_point_no_poly = gdf_nifc_point[gdf_nifc_point.IrwinID.isin(gdf_nifc_poly_10_plus.irwin_IrwinID)]
try:
    gdf_nifc_point_no_poly.to_file("./gis/nifc_points.geojson", driver="GeoJSON")
except:
    rm_origins_error = lastUpdated + '\nError: There was an error when trying to remove the NIFC origins that don\'t have a corresponding polygon. etl.py Line 64\n'
    with open('log.txt', 'a') as f:
                f.write(rm_origins_error)
    
# Upload polygon data to Mapbox
token = os.environ.get('TOKEN')
os.environ['MAPBOX_ACCESS_TOKEN'] = token
tp = ['tippecanoe', '--force', '-z10', '-o', './gis/nifc_polygons.mbtiles', '--drop-densest-as-needed', './gis/nifc_polygons.geojson']
mb = ['mapbox', 'upload', 'calnewsroom.nifc-polygons-tp', './gis/nifc_polygons.mbtiles']

subprocess.Popen(tp, stdout=subprocess.PIPE).wait()
subprocess.Popen(mb, stdout=subprocess.PIPE)

with open('log.txt', 'a') as f:
    f.write('\nUpdated: ' + lastUpdated + '\n')
    
with open('./last-updated.txt', 'w') as f:
    f.write(lastUpdated)

print('Done')
