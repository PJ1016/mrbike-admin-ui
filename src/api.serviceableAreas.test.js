import axios from "axios";
import { API_V1_BASE_URL, getServiceableAreas } from "./api";

jest.mock("axios", () => {
  const mockAxios = jest.fn();
  mockAxios.defaults = {};
  return mockAxios;
});

describe("getServiceableAreas", () => {
  beforeEach(() => {
    axios.mockReset();
    axios.mockResolvedValue({
      data: {
        status: 200,
        message: "Success",
        data: [{ _id: "area-1", name: "Hyderabad", status: "live" }],
        meta: { total: 1, page: 1, limit: 100, pages: 1 },
      },
    });
    window.localStorage.setItem("adminToken", "admin-token");
  });

  test("caps the list request at the accepted page limit and sends the admin token", async () => {
    const response = await getServiceableAreas({ limit: 200 });

    expect(axios).toHaveBeenCalledWith({
      method: "GET",
      url: `${API_V1_BASE_URL}/admin/serviceable-areas?limit=100`,
      data: {},
      headers: { token: "admin-token" },
      withCredentials: true,
    });
    expect(response.data).toHaveLength(1);
    expect(response.meta.total).toBe(1);
  });
});
