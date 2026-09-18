const CALLBACK_NAME = "__mrbikeGoogleMapsReady";
const SCRIPT_SELECTOR = 'script[data-mrbike-google-maps="1"]';

let googleMapsPromise;

export const getGoogleMapsApiKey = () =>
  (process.env.REACT_APP_GOOGLE_MAPS_KEY || "").trim();

export const loadGoogleMapsPlaces = () => {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      reject(new Error("Google Maps is not configured for this Admin build."));
      return;
    }

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      document.querySelector(SCRIPT_SELECTOR)?.remove();
      delete window[CALLBACK_NAME];
      googleMapsPromise = undefined;
      window.dispatchEvent(new CustomEvent("mrbike-google-maps-auth-failure"));
      reject(
        new Error(
          "Google Maps rejected the configured key. Check billing, Maps JavaScript API, Places API, and the production referrer allowlist.",
        ),
      );
    };

    window[CALLBACK_NAME] = () => {
      delete window[CALLBACK_NAME];
      if (window.google?.maps?.places) {
        resolve(window.google);
      } else {
        googleMapsPromise = undefined;
        reject(new Error("Google Places did not load."));
      }
    };

    const existingScript = document.querySelector(SCRIPT_SELECTOR);
    if (existingScript) return;

    const script = document.createElement("script");
    script.dataset.mrbikeGoogleMaps = "1";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&v=weekly&loading=async&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      script.remove();
      delete window[CALLBACK_NAME];
      googleMapsPromise = undefined;
      reject(new Error("Google Maps could not be downloaded."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const componentName = (place, type) =>
  place?.address_components?.find((component) => component.types?.includes(type))
    ?.long_name;

export const selectedPlaceDetails = (place) => {
  const latitude = place?.geometry?.location?.lat?.();
  const longitude = place?.geometry?.location?.lng?.();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    label: place.formatted_address || place.name || "",
    cityName:
      componentName(place, "locality") ||
      componentName(place, "administrative_area_level_2") ||
      place.name ||
      "",
  };
};
