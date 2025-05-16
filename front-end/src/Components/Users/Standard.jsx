import { React, useState, useEffect } from "react";
import Style from "./Standard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import NutritionCard from "../Graph/NutritionCard";
import ICard from "../IngredientCard/ICard";
import { searchFoods } from "../../API/FoodDataCentral";
import { foodEntryAPI, fetchCSRFToken } from "../../API/api";
import { CSRF } from "../../utils/csrf";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";

const Standard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const Goal = currentUser?.goalType || "Maintain Weight";
  const CurrentWeight = currentUser?.weight || 0;
  const [show, setShow] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [foodEntriesChanged, setFoodEntriesChanged] = useState(0);

  const caloriesGoal = currentUser?.calorieGoal || 2000; // Get from user profile, default to 2000 if not set
  const caloriesLeft = Number((caloriesGoal - dailyTotals.calories).toFixed(2));

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        await fetchCSRFToken();
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };

    fetchToken();
  }, []);

  // Format date for API
  const formatDateForAPI = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) return;
      try {
        setInitialLoading(true);
        setError("");

        // Get today's date formatted properly for database queries
        const today = new Date();
        const todayStr = formatDateForAPI(today);
        console.log("Fetching data for today's date:", todayStr);

        // Get weekly data first, so it's always shown regardless of other errors
        await refreshNutritionData();

        // Get entries for today
        try {
          console.log("Fetching daily entries for date:", todayStr);
          const entries = await foodEntryAPI.getDailyEntries(todayStr);
          console.log("Retrieved daily entries:", entries);
          setAddedIngredients(entries);
        } catch (err) {
          console.error("Error fetching daily entries:", err);
          setError("Could not fetch daily entries: " + err.message);
          setAddedIngredients([]);
        }

        // Calculate daily totals
        try {
          const nutrition = await foodEntryAPI.getDailyNutrition(todayStr);
          setDailyTotals({
            protein: nutrition.total_protein || 0,
            carbs: nutrition.total_carbs || 0,
            fats: nutrition.total_fats || 0,
            calories: nutrition.total_calories || 0,
          });
        } catch (err) {
          setError("Could not fetch daily nutrition: " + err.message);
          setDailyTotals({
            protein: 0,
            carbs: 0,
            fats: 0,
            calories: 0,
          });
        }
      } catch (err) {
        setError("Some features may not be available. Please try again later.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Function to refresh nutrition data
  const refreshNutritionData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      // Ensure dates are in correct format (YYYY-MM-DD) using our helper
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);

      console.log(
        `Refreshing nutrition history from ${formattedStartDate} to ${formattedEndDate}`
      );

      // Log the request URL to help debug
      console.log(
        "Request URL:",
        `/consumed-foods/history?startDate=${formattedStartDate}&endDate=${formattedEndDate}&combineData=true`
      );

      // First refresh the daily totals for today to ensure we have the latest data
      const todayStr = formatDateForAPI(new Date());
      console.log("Refreshing daily nutrition totals for today:", todayStr);

      try {
        const dailyNutrition = await foodEntryAPI.getDailyNutrition(todayStr);
        console.log("Updated daily nutrition:", dailyNutrition);

        if (dailyNutrition) {
          setDailyTotals({
            protein: dailyNutrition.total_protein || 0,
            carbs: dailyNutrition.total_carbs || 0,
            fats: dailyNutrition.total_fats || 0,
            calories: dailyNutrition.total_calories || 0,
          });
        }
      } catch (err) {
        console.error("Error refreshing daily nutrition:", err);
      }

      // Then get the nutrition history
      const history = await foodEntryAPI.getNutritionHistory(
        formattedStartDate,
        formattedEndDate
      );

      console.log("Received nutrition history data:", history);

      if (history && Array.isArray(history)) {
        // Format weekly data for the chart
        const formattedData = [];
        const dayOrder = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        // Create a map to track processed dates
        const processedDates = new Map();

        // Process the history data
        history.forEach((entry) => {
          try {
            // Parse the date string to a Date object
            let date;
            if (typeof entry.date === "string") {
              date = new Date(entry.date);
            } else if (entry.date instanceof Date) {
              date = entry.date;
            } else {
              console.warn("Unknown date format:", entry.date);
              return; // Skip this entry
            }

            // Format day of week consistently
            const dayOfWeek = date.toLocaleDateString("en-US", {
              weekday: "long",
            });

            const dateStr = date.toISOString().split("T")[0];
            console.log(
              `Processing entry for ${dayOfWeek} (${dateStr}):`,
              entry
            );

            // Check if this is today's data
            const isToday = dateStr === todayStr;

            // Check if we already have processed this day
            const existingData = processedDates.get(dayOfWeek);

            // Create the data object
            const newData = {
              day: dayOfWeek,
              calories: Number(entry.total_calories || 0),
              protein: Number(entry.total_protein || 0),
              carbs: Number(entry.total_carbs || 0),
              fats: Number(entry.total_fats || 0),
            };

            // Only replace existing data if this is today (to get latest) or if we don't have data yet
            if (!existingData || isToday) {
              // Store in processed dates map
              processedDates.set(dayOfWeek, newData);

              if (isToday) {
                console.log("Using latest data for today:", newData);
              }
            }
          } catch (err) {
            console.error("Error processing history entry:", err, entry);
          }
        });

        // Ensure all days of the week have an entry
        dayOrder.forEach((day) => {
          if (processedDates.has(day)) {
            formattedData.push(processedDates.get(day));
          } else {
            // Add empty data for missing days
            formattedData.push({
              day: day,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
            });
          }
        });

        // Sort by day of week
        formattedData.sort(
          (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );

        console.log("Formatted weekly data for graph:", formattedData);
        setWeeklyData(formattedData);
        return true;
      } else {
        console.warn("History response is not an array or is empty:", history);
        // Initialize empty data structure for all days of the week
        const emptyWeekData = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((day) => ({
          day,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        }));
        setWeeklyData(emptyWeekData);
        return false;
      }
    } catch (err) {
      console.error("Could not fetch weekly data:", err);
      setError("Could not fetch weekly data: " + err.message);
      // Initialize empty data structure for all days of the week
      const emptyWeekData = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ].map((day) => ({
        day,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }));
      setWeeklyData(emptyWeekData);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          const apiFoods = await searchFoods(searchTerm);
          const formattedIngredients = apiFoods.map((food) => ({
            id: food.fdcId,
            name: food.description,
            chartData: formatNutrients(food),
          }));
          setIngredients(formattedIngredients);
          setError("");
        } catch (err) {
          setError("Failed to fetch data");
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  const formatNutrients = (food) => {
    const nutrients = {
      Protein:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find((n) => n.nutrientName === "Protein")
              ?.value || 0
          ) * 100
        ) / 100,
      Carbs:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find(
              (n) => n.nutrientName === "Carbohydrate, by difference"
            )?.value || 0
          ) * 100
        ) / 100,
      Fat:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find(
              (n) => n.nutrientName === "Total lipid (fat)"
            )?.value || 0
          ) * 100
        ) / 100,
    };

    return [
      { value: nutrients.Protein, color: "#ff6384", label: "Protein" },
      { value: nutrients.Carbs, color: "#36a2eb", label: "Carbs" },
      { value: nutrients.Fat, color: "#ffce56", label: "Fat" },
    ];
  };

  // Function to refresh nutrition data with retry mechanism
  const refreshNutritionDataWithRetry = async () => {
    try {
      // Try to refresh the data up to 3 times
      let success = false;
      for (let i = 0; i < 3 && !success; i++) {
        if (i > 0) {
          console.log(`Retry #${i} refreshing nutrition data...`);
          // Small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        success = await refreshNutritionData();
      }
      console.log("Nutrition data refresh completed, success:", success);
      return success;
    } catch (refreshError) {
      console.error("Error refreshing nutrition data:", refreshError);
      return false;
    }
  };

  // Refresh all data for the current day
  const refreshTodayData = async () => {
    try {
      const todayStr = formatDateForAPI(new Date());
      console.log("Refreshing all data for today:", todayStr);

      // Fetch today's entries
      const entries = await foodEntryAPI.getDailyEntries(todayStr);
      console.log("Refreshed today's entries:", entries);
      setAddedIngredients(entries);

      // Fetch today's nutrition
      const nutrition = await foodEntryAPI.getDailyNutrition(todayStr);
      console.log("Refreshed today's nutrition:", nutrition);
      setDailyTotals({
        protein: nutrition.total_protein || 0,
        carbs: nutrition.total_carbs || 0,
        fats: nutrition.total_fats || 0,
        calories: nutrition.total_calories || 0,
      });

      // Refresh weekly data
      await refreshNutritionDataWithRetry();

      // Trigger a single graph refresh
      setFoodEntriesChanged(Date.now());

      return true;
    } catch (err) {
      console.error("Error refreshing today's data:", err);
      return false;
    }
  };

  const handleAddIngredient = async (ingredient, grams) => {
    try {
      // Ensure we have a valid CSRF token before proceeding
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        console.log("No CSRF token found, fetching a new one...");
        await fetchCSRFToken();
      }

      const proteinPer100g = ingredient.chartData.find(
        (d) => d.label === "Protein"
      ).value;
      const carbsPer100g = ingredient.chartData.find(
        (d) => d.label === "Carbs"
      ).value;
      const fatsPer100g = ingredient.chartData.find(
        (d) => d.label === "Fat"
      ).value;

      // Calculate and round to 2 decimal places
      const protein = Number(((proteinPer100g * grams) / 100).toFixed(2));
      const carbs = Number(((carbsPer100g * grams) / 100).toFixed(2));
      const fats = Number(((fatsPer100g * grams) / 100).toFixed(2));
      const calories = Number((protein * 4 + carbs * 4 + fats * 9).toFixed(2));

      // Create food entry matching the expected format in the backend
      // Ensure all values are at least 0.01 to pass backend validation
      const today = new Date();
      // Add a small random millisecond value to ensure each entry has a unique timestamp
      today.setMilliseconds(
        today.getMilliseconds() + Math.floor(Math.random() * 1000)
      );
      const fullISODate = today.toISOString();
      console.log("Using unique timestamp for food entry:", fullISODate);

      const foodEntry = {
        foodId: ingredient.id.toString(),
        name: ingredient.name,
        amount: Number(grams.toFixed(2)),
        date: fullISODate, // Use full ISO string with current time
        calories: Math.max(0.01, Number(calories.toFixed(2))),
        protein: Math.max(0.01, Number(protein.toFixed(2))),
        carbs: Math.max(0.01, Number(carbs.toFixed(2))),
        fat: Math.max(0.01, Number(fats.toFixed(2))),
      };

      console.log("Adding food entry with CSRF token:", CSRF.getToken());

      // Save to backend
      const response = await foodEntryAPI.addFoodEntry(foodEntry);

      if (response) {
        console.log("Server response after adding food entry:", response);

        // Extract timestamp from server response if available
        const entryTime = response.entry_date || response.date || fullISODate;
        const timestamp = new Date(entryTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Update local state with the new ingredient
        setAddedIngredients((prev) => [
          ...prev,
          {
            id: response.id,
            name: ingredient.name,
            grams: Math.round(grams),
            protein: Number(protein.toFixed(2)),
            carbs: Number(carbs.toFixed(2)),
            fat: Number(fats.toFixed(2)),
            calories: Number(calories.toFixed(2)),
            timestamp: timestamp,
          },
        ]);

        // Refresh all data once after a slight delay to ensure backend processing is complete
        setTimeout(async () => {
          const success = await refreshTodayData();
          if (!success) {
            // If refresh failed, at least update the totals locally for UI feedback
            setDailyTotals((prev) => ({
              protein: Number((prev.protein + protein).toFixed(2)),
              carbs: Number((prev.carbs + carbs).toFixed(2)),
              fats: Number((prev.fats + fats).toFixed(2)),
              calories: Number((prev.calories + calories).toFixed(2)),
            }));
          }
        }, 500);

        // Close the modal after successful addition
        setShow(false);
      }
    } catch (err) {
      console.error("Error adding food entry:", err);
      setError("Failed to add food entry. Please try again.");
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      // Find the item to be deleted for local state updates
      const itemToDelete = addedIngredients.find((item) => item.id === id);

      // Delete from backend
      await foodEntryAPI.deleteFoodEntry(id);

      // Update UI by removing the item
      setAddedIngredients((prev) => prev.filter((item) => item.id !== id));

      // Refresh all data once after a slight delay to ensure backend processing is complete
      setTimeout(async () => {
        const success = await refreshTodayData();
        if (!success && itemToDelete) {
          // If refresh failed, at least update the totals locally for UI feedback
          setDailyTotals((prevTotals) => ({
            protein: Math.max(0, prevTotals.protein - itemToDelete.protein),
            carbs: Math.max(0, prevTotals.carbs - itemToDelete.carbs),
            fats: Math.max(0, prevTotals.fats - itemToDelete.fat),
            calories: Math.max(0, prevTotals.calories - itemToDelete.calories),
          }));
        }
      }, 500);
    } catch (err) {
      console.error("Error deleting food entry:", err);
      setError("Failed to delete food entry. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/SignIn");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  // Helper to render a user-friendly error message
  const renderError = (msg) => {
    if (!msg) return null;
    if (msg.includes("Rate limit exceeded")) {
      return (
        <Alert variant='danger' className='mb-3'>
          Too many requests. Please wait a few seconds and try again.
          <br />
          If this happens repeatedly, please contact support or try again later.
        </Alert>
      );
    }
    return (
      <Alert variant='warning' className='mb-3'>
        {msg}
      </Alert>
    );
  };

  if (initialLoading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal size='xl' show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Search Items</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Control
            type='text'
            placeholder='Search items...'
            className='mb-3'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading && <Spinner animation='border' />}
            {renderError(error)}
          </div>

          <Row style={{ maxHeight: "400px", overflowY: "auto" }}>
            {ingredients.map((ingredient) => (
              <Col xs={12} sm={6} md={6} lg={6} key={ingredient.id}>
                <ICard
                  title={ingredient.name}
                  chartData={ingredient.chartData}
                  onAdd={(grams) => handleAddIngredient(ingredient, grams)}
                  style={{ width: "100%" }}
                />
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>

      <Container
        fluid
        className={`${Style.Screen}`}
        style={{ padding: "5vh", overflow: "auto", zIndex: "1" }}
      >
        {renderError(error)}
        <Row>
          <Col>
            <h2 style={{ color: "var(--color-primary)" }}>
              Welcome, {currentUser?.username || "User"}
            </h2>
          </Col>
          <Col className='d-flex justify-content-end align-items-center gap-3'>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              {new Date().toString().slice(0, 15)}
            </p>
            <Button variant='outline-danger' onClick={handleLogout}>
              Logout
            </Button>
          </Col>
        </Row>
        <Row className='g-3'>
          <Col
            md={12}
            lg={4}
            className='d-flex flex-column align-items-center justify-content-center'
          >
            <Card
              className='p-3 d-flex flex-column align-items-center justify-content-center'
              style={{
                backgroundColor: "var(--color-card)",
                width: "auto",
                height: "auto",
              }}
            >
              <p>
                Your Goal: <span style={{ fontWeight: "bolder" }}>{Goal}</span>
              </p>
              <p>
                Daily Calories Needed:{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {caloriesGoal}
                </span>
              </p>
              <p>
                Calories Left:{" "}
                <span style={{ color: "var(--color-secondary)" }}>
                  {caloriesLeft}
                </span>
              </p>
              <p>
                Current Weight:{" "}
                <span style={{ color: "var(--color-gray)" }}>
                  {CurrentWeight}
                </span>
              </p>
            </Card>
            <Button
              className={`button`}
              style={{ margin: "2vw", width: "auto", marginLeft: "0px" }}
              onClick={() => setShow(true)}
            >
              Add Ingredients
            </Button>
          </Col>
          <Col md={12} lg={8}>
            <NutritionCard
              title='Calories'
              dataKey='calories'
              color='#8884d8'
              unit='kcal'
              foodEntriesChanged={foodEntriesChanged}
            />
          </Col>
        </Row>

        <Row className='mt-4'>
          <Card
            style={{ backgroundColor: "var(--color-card)", padding: "1rem" }}
          >
            <h5 style={{ color: "var(--color-primary)" }}>Added Ingredients</h5>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {addedIngredients.length > 0 ? (
                addedIngredients.map((item) => (
                  <div
                    key={item.id}
                    className='d-flex justify-content-between align-items-center mb-2 px-2'
                  >
                    <div style={{ width: "60%" }}>
                      <span className='fw-bold'>{item.name}</span>
                      <div className='text-muted small'>
                        {item.grams}g · {item.timestamp}
                      </div>
                    </div>
                    <div className='text-end'>
                      <div className='small mb-1'>
                        {item.calories.toFixed(1)} kcal ·{" "}
                        {item.protein.toFixed(1)}g Protein ·{" "}
                        {item.carbs.toFixed(1)}g Carbs · {item.fat.toFixed(1)}g
                        Fats
                      </div>
                      <Button
                        variant='danger'
                        size='sm'
                        onClick={() => handleDeleteIngredient(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-muted text-center py-3'>
                  No ingredients added yet.
                </div>
              )}
            </div>
          </Card>
        </Row>
      </Container>
    </>
  );
};

export default Standard;
