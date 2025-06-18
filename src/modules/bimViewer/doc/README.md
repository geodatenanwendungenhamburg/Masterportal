# BIM Viewer

This module is a BIM Viewer to display IFC, XKT or glTF files in the sidebar of the Masterportal.
It can be configured to add tools such as measure, inspect objects in the scene, search for objects in the scene, add ifc file, etc.
It is also possible to add annotations from a separate json file.

**Table of Contents**

- [Installation](#installation)
- [All configuration parameters of the BIM Viewer](#all-configuration-parameters-of-the-bimviewer)
- [Update Wasm files in the config repository](#update-wasm-files-in-the-config-repository)
- [Load Wasm files from a different URL](#load-wasm-files-from-a-different-url)
- [Mode to get the 3D position on click (pick) and send message via remoteInterface](#mode-to-get-the-3d-position-on-click-pick-and-send-message-via-remoteinterface)
- [Scenes.json configuration](#scenesjson-configuration)
- [Annotations in a GeoJson](#annotations-in-a-geojson)
- [URL Parameters](#url-parameters)


## Installation

- `npm install`.

## All configuration parameters of the BIM Viewer
The BIM Viewer can be configured using the parameters below.
There are also some URL parameters with which the BIM Viewer can be loaded.
These [URL parameters](#url-parameters) are described further down.

| Name               | Required | Type    | Default                      | Description                                                                                                                                                                                               |
| ------------------ | -------- | ------- |------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name               | no       | String  | BIM Viewer                   | Name of the tool in the menu.                                                                                                                                                                             |
| description        | no       | String  | 3D viewer for BIM models ... | Description of the tool in the menu.                                                                                                                                                                      |
| icon               | no       | String  | bi-houses                    | Bootstrap icon used in the header                                                                                                                                                                         |
| deactivateGFI      | no       | Boolean | false                        | If set to `true`, the filter tool will disable GFI requests while open.                                                                                                                                   |
| sceneConfigsUrl    | no       | String  | ""                           | The configuration json file containing IFC files and annotations to be loaded, cameraSettings etc. See [Scene.json](#scenesjson-configuration)                                                            |
| useTools           | no       | Boolean | true                         | If set to `true`, the tools such as measure, etc. are available in the viewer.                                                                                                                            |
| annotationRefreshInterval | no      | Number | null                         | Interval in milliseconds in which the annotations are refreshed.                                                                                                                                          |
| wasmUrl            | no       | String  | ./wasm/                      | The path to the wasm files. See [WASM files](#load-wasm-files-from-a-different-url)                                                                                                                       |

**Example**

```json
"bimViewer": {
    "name": "BIM Viewer",
    "description": "3D viewer for BIM models ...",
    "icon": "bi-houses",
    "useTools": true,
    "sceneConfigsUrl": "./demo-data/scenes.json",
    "wasmUrl": "./wasm/",
    "annotationRefreshInterval": 60000,
    "resizableWindow": true
},
```

##  Update Wasm files in the config repository

The BIM Viewer requires as set of [WebAssembly](https://webassembly.org/) (wasm) files in order to load IFC files.

To update these files in your portal, run:

```bash
npm run bimviewer-update-wasm
```

This will automatically copy the required files to the specified portal.

**Commit updated files**

The updated .wasm files must be committed to the BIM Viewer repository where the BIM Viewer is set up.

## Load Wasm files from a different URL

Wasm files are loaded via HTTP from the URL `./wasm/` by default.

To change the URL, you can update the `wasmUrl` parameter in `config.json`. It's possible to use absolute or relative URLs.

```
"bimViewer": {
    (...),
    "wasmUrl": "./subfolder/wasm-updated/"
    (...),
},
```

The folder in this new location must contain all required `web-ifc*.wasm` files.

## Scenes.json configuration

The scenes.json defines the scenes to be displayed in the BIM Viewer with the IFC, XKT of glTF files to be loaded into the scene and the corresponding camera and SAO settings.

The json contains an array of scene objects which are defined by the parameters below.

If the array consists of multiple scene objects, the different scenes are selectable from a drop down list in the BIM Viewer tools.

Each scene can be made up of several IFC, XKT of glTF files defined by the `modelList` parameter.

It is also possible to configure an empty scene into which IFC, XKT or glTF files can be loaded using the upload tool from the BIM Viewers tools.

| Name               | Required | Type    | Description |
| ------------------ | -------- | ------- |-------------|
| id                 | yes       | String  | Id of the scene. |
| name               | yes       | String  | Name of the scene. |
| modelList          | no       | Array   | Array containing a list of URLs to ifc,xkt, gltf files to load into the scene |
| annotationsJSON    | no       | String  | URL to the GeojJson containing annotations. See an example of an [annotations.json](#annotations-in-a-geojson) |
| cameraSettings     | no       | Object  | Xeokit camera settings: eye, look, up. see [Xeokit camera settings](https://xeokit.github.io/xeokit-sdk/docs/class/src/viewer/scene/camera/Camera.js~Camera.html) |
| saoSettings        | no       | Object  | Xeokit SAO settings: enabled, intensity, bias, scale, minResolution, numSamples, kernelRadius, blendCutoff, blendFactor blur. see [Xeokit SAO settings](https://xeokit.github.io/xeokit-sdk/docs/class/src/viewer/scene/postfx/SAO.js~SAO.html) |


**Example**

```json
[
  {
    "id": "sceneDomHamburgSimple",
    "name": "DOM Hamburg - Simple",
    "modelList": [
      "https://server/BIM/BIMPitch/Examples/ifc/example.ifc"
    ],
    "annotationsJSON": "http://server/pathToAnnotations",
    "cameraSettings": {
      "eye": [-2.37, 18.97, -26.12],
      "look": [10.97, 5.82, -11.22],
      "up": [0.36, 0.83, 0.40]
    },
    "saoSettings": null
  },
  {
    "id": "sceneDomHamburgFull",
    "name": "DOM Hamburg - Full",
    "modelList": [
      "https://server/BIM/BIMPitch/Examples/ifc/example.ifc",
      "https://server/BIM/BIMPitch/Examples/ifc/example2.ifc.ifc",
      "https://server/BIM/BIMPitch/Examples/ifc/example3.ifc",
    ],
    "annotationsJSON": "http://server/pathToAnnotations",
    "cameraSettings": {
      "eye": [-2.37, 18.97, -26.12],
      "look": [10.97, 5.82, -11.22],
      "up": [0.36, 0.83, 0.40]
    },
    "saoSettings": {
      "enabled": true,
      "intensity": 0.15,
      "bias": 0.5,
      "scale": 1.0,
      "minResolution": 0.0,
      "numSamples": 10,
      "kernelRadius": 100,
      "blendCutoff": 0.4,
      "blendFactor": 1,
      "blur": true
    }
  },
  {
    "id": "emptyScene",
    "name": "Empty Scene",
    "modelList": [],
    "annotationsJSON": null,
    "cameraSettings": {
      "eye": [-2.37, 18.97, -26.12],
      "look": [10.97, 5.82, -11.22],
      "up": [0.36, 0.83, 0.40]
    },
    "saoSettings": null
  }
]
```


## Annotations in a GeoJson
The annotation json must conform to the [GeoJson standard](https://geojson.org/).

Each annotation must be a feature within the GeoJson.

The coordinates of the annotations' positions can be in WGS84 (EPSG 4326) or in the projection used by the Masterportal.
If the coordinates are **not in WGS84 (EPSG 4326)** the projection used must be specified in the crs parameter within the annotation GeoJson:

```json
"crs": {
    "type": "name",
    "properties": {
    "name": "EPSG:25832"
    }
}
```

The BIM Viewer automatically reprojects the coordinates from WGS84 (EPSG 4326) to the projection used by the Masterportal.

The coordinates can have a height value (third parameter). If the height value is missing, the BIM Viewer automatically sets the height to 0.

The following properties must be included for the annotation to be displayed in the BIM Viewer.

| Name               | Required | Type    | Description |
| ------------------ | -------- | ------- |-------------|
| name               | yes       | String  | Title of the annotation. |
| description        | yes       | String  | Description of the annotation. |

Each feature (annotation) in the GeoJson must also have an id (not within the properties as shown in the example below)



**Example using coordinates in WGS84 (4326)**

```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    9.971951782982059,
                    53.55636234766796,
                    70.99663138704238
                ]

            },
            "properties": {
                "name": "Kostenlose Parkmöglichkeiten für Arbeitnehmende/oder Firmen",
                "description": "Durch die gebührenpflichtigen Parkzonen ist es Arbeitnehmenden, die mit Autos anreisen, nicht mehr möglich kostenlos zu parken."
            },
            "id": "11572"
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    9.96836278550852,
                    53.552754408668875,
                    7.998801608148028
                ]
            },
            "properties": {
                "name": "Spiel- und Sportangebot",
                "description": "Schön wäre eine Art \"Treffpunkt\" für gemeinsamen Austausch, Spiel und Sport."
            },
            "id": "11282"
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    9.9719471608088,
                    53.55461025904476,
                    17
                ]
            },
            "properties": {
                "name": "Fahrradreparaturservice",
                "description": "Ein Ort, an dem kleinere Reparaturen durchgeführt werden bzw. Hilfe dabei angeboten wird."
            },
            "id": "11243"
        }
    ]
  }
```


**Example using coordinates in EPSG 25832**

```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    564153.2742920341,
                    5934198.878474764,
                    7.998801608148028
                ]
            },
            "properties": {
                "name": "Spiel- und Sportangebot",
                "description": "Schön wäre eine Art \"Treffpunkt\" für gemeinsamen Austausch, Spiel und Sport."
            },
            "id": "11282"
        }
    ],
    "crs": {
        "type": "name",
        "properties": {
            "name": "EPSG:25832"
        }
    }
}
```


## URL Parameters
The BIM Viewer can be loaded using the following parameters in the URL:


| Parameter | Value | Description | Example |
| --------- | ----- | ----------- | ------- |
| cube | false | **Do not show** the navigation cube in the scene | cube=false |
| dipas | true | Adds a "MORE" button to the annotation's label, which takes the user to the contribution's detail page in the DIPAS frontend | dipas=true |
| annoCoords |  coordinates x, -y, z | Zoom to the position of an annotation  | annoCoords=564154.36,-5934198.0,8.0 |
| cameraEye | x,z,-y | Set the camera eye settings along with annoCoords | cameraEye=564114.09,40.97,-5934193.03 |
| cameraLook | x,z,-y | Set the camera look settings along with annoCoords | cameraLook=564151.82,10.77,-5934202.00 |
| cameraUp | x,z,-y | Set the camera up settings along with annoCoords | cameraUp=0.5976,0.7890,-0.1421 |
| annoProj | EPSG:4326 | Triggers a reprojection of the coordinates from WGS84 (EPSG:4326) into the Masterportal's projection if the coordinates used in annoCoords are in WGS84 (EPSG:4326) |  annoProj=EPSG:4326 |
| showPointer | true | Not only zooms to the position of the annotation coordinates set with annoCoords but also adds a point to that position | showPointer=true |


