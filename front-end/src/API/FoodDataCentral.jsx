import axios from "axios";

const API_KEY = "DBYBNzojatRF13nWCSqSsleuN8SlAixH9YXX91sy";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export const searchFoods = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/foods/search`, {
      params: {
        api_key: API_KEY,
        query: query,
        pageSize: 10,
        dataType: ["Foundation", "Survey (FNDDS)", "Branded"],
      },
      paramsSerializer: (params) => {
        return new URLSearchParams(params)
          .toString()
          .replace(/%2C/g, ",")
          .replace(/\(/g, "%28")
          .replace(/\)/g, "%29");
      },
    });
    return response.data.foods;
  } catch (error) {
    console.error("API Error:", error.response?.data);
    return [];
  }
};
