project = QgsProject.instance()

# Replace with your actual layer name
src_layer = project.mapLayersByName("fs-roads-fcs-web")[0]

# Get selected features
selected = src_layer.selectedFeatures()

if not selected:
    raise Exception("No feature selected in fs-roads-fcs-web")

feat = selected[0]

# Create or clear the memory highlight layer
mem_name = "fs-roads-highlight"
existing = project.mapLayersByName(mem_name)

if existing:
    mem = existing[0]
    mem.dataProvider().truncate()
else:
    mem = QgsVectorLayer("LineString?crs=EPSG:4326", mem_name, "memory")
    project.addMapLayer(mem)

# Add the selected feature geometry
new_feat = QgsFeature()
new_feat.setGeometry(feat.geometry())
mem.dataProvider().addFeatures([new_feat])
mem.triggerRepaint()