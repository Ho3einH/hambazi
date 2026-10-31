const cityCenters: Record<string, readonly [longitude: number, latitude: number]> = {
  london: [-0.1276, 51.5072],
  liverpool: [-2.9916, 53.4084],
  bristol: [-2.5879, 51.4545],
};

export function findNearestDemoCity(latitude: number, longitude: number): string | null {
  const cities = Object.entries(cityCenters).map(([name, [centerLongitude, centerLatitude]]) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLatitude = toRadians(centerLatitude - latitude);
    const deltaLongitude = toRadians(centerLongitude - longitude);
    const distance =
      6371 *
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin(deltaLatitude / 2) ** 2 +
            Math.cos(toRadians(latitude)) *
              Math.cos(toRadians(centerLatitude)) *
              Math.sin(deltaLongitude / 2) ** 2,
        ),
      );
    return { name, distance };
  });
  const closest = cities.reduce((nearest, city) =>
    city.distance < nearest.distance ? city : nearest,
  );
  if (closest.distance > 40) return null;
  return closest.name[0].toUpperCase() + closest.name.slice(1);
}

export function getCityMapEmbedUrl(city: string) {
  const [longitude, latitude] = cityCenters[city.trim().toLowerCase()] ?? cityCenters.london;
  const radius = 0.025;
  const params = new URLSearchParams({
    bbox: `${longitude - radius},${latitude - radius},${longitude + radius},${latitude + radius}`,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function getOpenMapSearchUrl(venue: string, address: string) {
  const params = new URLSearchParams({ query: `${venue}, ${address}` });
  return `https://www.openstreetmap.org/search?${params.toString()}`;
}
