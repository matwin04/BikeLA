import maplibregl from "maplibre-gl";

export function initMap() {
    const map = new maplibregl.Map({
        container: "map",
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: [-118.25854, 34.0485],
        zoom: 14
    });
    map.addControl(new maplibregl.NavigationControl());

    map.on("load", async () => {
        try {
            const res = await fetch("https://bts-status.bicycletransit.workers.dev/lax");
            const data = await res.json();

            // Use the features array directly
            const stationsGeoJSON = {
                type: "FeatureCollection",
                features: data.features
            };

            // Add the source
            map.addSource("bikestations", { type: "geojson", data: stationsGeoJSON });

            // Circle layer
            map.addLayer({
                id: "bikestations-layer",
                type: "circle",
                source: "bikestations",
                paint: {
                    "circle-radius": 6,
                    "circle-color": "#007cbf",
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff"
                }
            });

            // Labels
            map.addLayer({
                id: "bikestations-labels",
                type: "symbol",
                source: "bikestations",
                layout: {
                    "text-field": ["get", "name"],
                    "text-offset": [0, 1],
                    "text-anchor": "top"
                },
                paint: {
                    "text-color": "#333",
                    "text-halo-color": "#fff",
                    "text-halo-width": 1
                }
            });

            // Click popup
            map.on("click", "bikestations-layer", e => {
                if (!e.features || e.features.length === 0) return;

                const f = e.features[0];
                const p = f.properties;

                new maplibregl.Popup()
                    .setLngLat(f.geometry.coordinates)
                    .setHTML(`
                        <strong>${p.name}</strong><br/>
                        Docks: ${p.docksAvailable}/${p.totalDocks}<br/>
                        Bikes: ${p.bikesAvailable} (Electric: ${p.electricBikesAvailable})<br/>
                        Status: ${p.kioskStatus}<br/>
                        Address: ${p.addressStreet}, ${p.addressCity}, ${p.addressState} ${p.addressZipCode}
                    `)
                    .addTo(map);
            });

        } catch (err) {
            console.error("Failed to fetch BTS data:", err);
        }
    });

    return map;
}