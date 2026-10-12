
    const mapToken = MapToken;
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) {
        console.error("Cannot display map: listing coordinates are missing or invalid.");
    } else if (!mapToken) {
        console.error("Cannot display map: Mapbox access token is missing.");
    } else {
        mapboxgl.accessToken = mapToken;
        const map = new mapboxgl.Map({
            accessToken: mapToken,
            container: 'map',
            center: coordinates,
            zoom: 9
        });

        new mapboxgl.Marker({color: 'red'})
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<strong>${listingTitle}</strong><p>Exact location will be provided after booking.</p>`))
            .addTo(map);
    }
