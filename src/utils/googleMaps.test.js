import { selectedPlaceDetails } from "./googleMaps";

describe("selectedPlaceDetails", () => {
  test("extracts Indore city and the selected coordinates", () => {
    const result = selectedPlaceDetails({
      name: "Indore",
      formatted_address: "Indore, Madhya Pradesh, India",
      address_components: [
        { long_name: "Indore", types: ["locality", "political"] },
        { long_name: "Madhya Pradesh", types: ["administrative_area_level_1"] },
      ],
      geometry: {
        location: {
          lat: () => 22.7195687,
          lng: () => 75.8577258,
        },
      },
    });

    expect(result).toEqual({
      latitude: 22.7195687,
      longitude: 75.8577258,
      label: "Indore, Madhya Pradesh, India",
      cityName: "Indore",
    });
  });

  test("rejects a text-only prediction without geometry", () => {
    expect(selectedPlaceDetails({ name: "Indore" })).toBeNull();
  });
});

