import { findNearestDemoCity } from "@/lib/maps";

export async function getApproximateDemoCity(): Promise<string> {
  if (!("geolocation" in navigator)) {
    throw new Error("Location services are not available in this browser.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 10_000,
    });
  });
  const city = findNearestDemoCity(position.coords.latitude, position.coords.longitude);
  if (!city) {
    throw new Error("Choose London, Liverpool or Bristol, or enter your city manually.");
  }
  return city;
}
