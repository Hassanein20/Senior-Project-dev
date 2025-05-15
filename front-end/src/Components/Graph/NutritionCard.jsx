import React, { useState, useEffect, useCallback } from "react";
import { Card, Spinner, Alert } from "react-bootstrap";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";
import { foodEntryAPI } from "../../API/api";
import { useAuth } from "../../Context/AuthContext";

const NutritionCard = ({ title, dataKey, color, unit, foodEntriesChanged }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to fetch nutrition history data
  const fetchNutritionHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Set up date range for the past 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      // Format dates for API request
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      const todayStr = endDate.toISOString().split("T")[0];

      console.log(
        `Fetching nutrition history from ${formattedStartDate} to ${formattedEndDate} at ${new Date().toISOString()}`
      );

      // CRITICAL FIX: Always fetch today's nutrition data explicitly first and make sure we use it
      console.log("Explicitly fetching today's nutrition...");
      let todayData = null;

      try {
        const todayNutrition = await foodEntryAPI.getDailyNutrition(todayStr);
        console.log("Today's nutrition data:", todayNutrition);

        // Create a data point for today regardless of values to ensure today is always represented
        todayData = {
          date: new Date(todayStr),
          total_calories: todayNutrition.total_calories || 0,
          total_protein: todayNutrition.total_protein || 0,
          total_carbs: todayNutrition.total_carbs || 0,
          total_fats: todayNutrition.total_fats || 0,
        };
        console.log("Created today's data point:", todayData);
      } catch (todayErr) {
        console.error("Error fetching today's nutrition:", todayErr);
        // Create an empty data point for today even if the fetch fails
        todayData = {
          date: new Date(todayStr),
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fats: 0,
        };
      }

      // Fetch history data from API
      const history = await foodEntryAPI.getNutritionHistory(
        formattedStartDate,
        formattedEndDate
      );

      console.log("Received nutrition history data:", history);

      // DEBUGGING: Check if today's data is present in the history
      const todayHistoryItem = history?.find(
        (item) =>
          item.date &&
          new Date(item.date).toISOString().split("T")[0] === todayStr
      );
      console.log("Today's data in history:", todayHistoryItem);

      // Ensure history is an array
      let processedHistory =
        history && Array.isArray(history) ? [...history] : [];

      // IMPORTANT: Make sure today's data is always used
      if (todayData) {
        // Find if we already have an entry for today in the history
        const todayIndex = processedHistory.findIndex(
          (entry) =>
            entry.date &&
            new Date(entry.date).toISOString().split("T")[0] === todayStr
        );

        if (todayIndex >= 0) {
          console.log("Replacing today's data in history with fresh data");
          processedHistory[todayIndex] = todayData;
        } else {
          console.log("Adding today's data to history");
          processedHistory.push(todayData);
        }
      }

      console.log("Final history with today's data:", processedHistory);

      if (processedHistory.length > 0) {
        // Process and format the data
        const processedData = processHistoryData(processedHistory);
        setData(processedData);
      } else {
        console.warn("No history data available, using empty data");
        // Initialize with empty data
        setData(getEmptyWeekData());
      }
    } catch (err) {
      console.error("Error fetching nutrition history:", err);
      setError("Could not load nutrition data");
      setData(getEmptyWeekData());
    } finally {
      setLoading(false);
    }
  }, []);

  // Process history data into the format needed for the chart
  const processHistoryData = (history) => {
    const dayOrder = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    console.log("Processing history data for chart:", history);

    // Get today's day of week to ensure we can identify today's data
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayDayOfWeek = today.toLocaleDateString("en-US", {
      weekday: "long",
    });
    console.log("Today is:", todayDayOfWeek, "(", todayStr, ")");

    // Create a map to track processed dates
    const processedDates = new Map();

    // Pre-populate with empty data
    dayOrder.forEach((day) => {
      processedDates.set(day, {
        day: day,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      });
    });

    // Keep track of whether we found today's data
    let foundTodayData = false;

    // Process the history data
    history.forEach((entry) => {
      try {
        // Parse the date string to a Date object
        let date;
        if (typeof entry.date === "string") {
          date = new Date(entry.date);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.error("Invalid date string:", entry.date);
            return; // Skip this entry
          }
        } else if (entry.date instanceof Date) {
          date = entry.date;
        } else {
          console.error("Unknown date format:", entry.date);
          return; // Skip this entry
        }

        // Format day of week consistently
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

        // ROBUST FIX: Ensure we properly identify today's entries by only comparing date parts
        // This handles entries with any time component within today
        const dateStr = date.toISOString().split("T")[0];
        const todayDateStr = today.toISOString().split("T")[0];

        // Simple string comparison of just the date parts (ignoring time completely)
        const isToday = dateStr === todayDateStr;

        // Debug every date comparison to ensure we're correctly identifying today's entries
        if (isToday) {
          console.log(
            `Found today's entry: ${date.toISOString()} matches ${today.toISOString()}`
          );
        }

        console.log(
          `Processing entry for ${dayOfWeek} (${dateStr}): isToday=${isToday}`,
          entry
        );

        // Get existing data
        const existingData = processedDates.get(dayOfWeek);

        // Create the new data point
        const newData = {
          day: dayOfWeek,
          calories: Number(entry.total_calories || 0),
          protein: Number(entry.total_protein || 0),
          carbs: Number(entry.total_carbs || 0),
          fats: Number(entry.total_fats || 0),
        };

        // If this is today's data, always use it (prioritize it)
        if (isToday) {
          console.log("Using today's data for graph:", newData);
          processedDates.set(dayOfWeek, newData);
          foundTodayData = true;
        }
        // For other days, only use if we don't have data yet or values are higher
        else if (existingData) {
          // Only overwrite if the new data has higher values (use the max)
          const updatedData = {
            day: dayOfWeek,
            calories: Math.max(existingData.calories, newData.calories),
            protein: Math.max(existingData.protein, newData.protein),
            carbs: Math.max(existingData.carbs, newData.carbs),
            fats: Math.max(existingData.fats, newData.fats),
          };
          processedDates.set(dayOfWeek, updatedData);
        } else {
          processedDates.set(dayOfWeek, newData);
        }
      } catch (err) {
        console.error("Error processing history entry:", err, entry);
      }
    });

    // If we didn't find today's data, check if there's anything in the daily nutritional information
    if (!foundTodayData && todayDayOfWeek) {
      console.log(
        "Warning: No data found for today in history. Checking daily totals..."
      );

      // Force a refresh of today's data on the next render cycle
      setTimeout(() => {
        fetchTodaysNutritionOnly();
      }, 500);
    }

    // Create final data array with all days of the week
    const formattedData = [];

    // Get data for each day from the map
    dayOrder.forEach((day) => {
      if (processedDates.has(day)) {
        formattedData.push(processedDates.get(day));
      } else {
        // Fallback - should never happen because we pre-populated
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

    console.log("Final formatted data for graph:", formattedData);
    return formattedData;
  };

  // Helper function to fetch just today's nutrition data
  const fetchTodaysNutritionOnly = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const todayDayOfWeek = today.toLocaleDateString("en-US", {
        weekday: "long",
      });

      console.log("Fetching only today's nutrition data...");
      const todayNutrition = await foodEntryAPI.getDailyNutrition(todayStr);

      if (todayNutrition) {
        console.log("Got today's nutrition:", todayNutrition);

        // Update just today's data in our current dataset
        setData((prevData) => {
          const newData = [...prevData];
          const todayIndex = newData.findIndex(
            (item) => item.day === todayDayOfWeek
          );

          if (todayIndex >= 0) {
            newData[todayIndex] = {
              day: todayDayOfWeek,
              calories: Number(todayNutrition.total_calories || 0),
              protein: Number(todayNutrition.total_protein || 0),
              carbs: Number(todayNutrition.total_carbs || 0),
              fats: Number(todayNutrition.total_fats || 0),
            };
            console.log("Updated today's data in chart:", newData[todayIndex]);
          }

          return newData;
        });
      }
    } catch (err) {
      console.error("Error fetching today's nutrition only:", err);
    }
  }, []);

  // Return empty data for all days of the week
  const getEmptyWeekData = () => {
    return [
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
  };

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      console.log("Initial data fetch due to user change or mount");
      fetchNutritionHistory();
    }
  }, [currentUser, fetchNutritionHistory]);

  // Add dedicated handler for when foodEntriesChanged changes
  useEffect(() => {
    if (foodEntriesChanged > 0) {
      console.log(
        `Food entries changed (${foodEntriesChanged}), refreshing graph data once`
      );

      // SIMPLIFIED REFRESH STRATEGY:
      // Do a single complete refresh after a short delay to ensure data is ready
      setTimeout(() => {
        console.log("Performing single full data refresh");
        fetchNutritionHistory();
      }, 1000);
    }
  }, [foodEntriesChanged, fetchNutritionHistory]);

  // Remove periodic refresh to prevent unwanted refreshes
  // We now only refresh on initial load and when food entries change

  return (
    <Card
      className='shadow-sm mb-4'
      style={{ backgroundColor: "var(--color-graph)" }}
    >
      <Card.Header
        className='d-flex flex-rows justify-content-between align-items-center'
        style={{ backgroundColor: "var(--color-card)" }}
      >
        <h5
          className='mb-0'
          style={{
            fontSize: "16px",
            marginTop: "5px",
            color: "var(--color-text2)",
          }}
        >
          Calories
        </h5>
        <h5 className='mb-0' style={{ color: "var(--color-text2)" }}>
          Weekly Nutrition Overview
        </h5>
        <div className='d-flex align-items-center'>
          <h5
            className='mb-0'
            style={{
              fontSize: "16px",
              marginTop: "5px",
              color: "var(--color-text2)",
            }}
          >
            Micros
          </h5>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant='warning'>{error}</Alert>}
        {loading ? (
          <div
            className='d-flex justify-content-center align-items-center'
            style={{ height: "400px" }}
          >
            <Spinner animation='border' />
          </div>
        ) : (
          <div style={{ height: "400px" }}>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />

                {/* X-Axis */}
                <XAxis dataKey='day' tick={{ fill: "var(--color-text)" }} />

                {/* Left Y-Axis for Calories */}
                <YAxis
                  yAxisId='left'
                  orientation='left'
                  tickFormatter={(value) => `${value}kcal`}
                  tick={{ fill: "var(--color-text)" }}
                  label={{
                    value: "Calories",
                    angle: -90,
                    position: "left",
                    fill: "#000000",
                    dx: -25,
                    style: {
                      textAnchor: "middle",
                      fontSize: "14px",
                    },
                  }}
                  padding={{ top: 20, bottom: 20 }}
                  domain={[0, "auto"]}
                  width={80}
                />

                {/* Right Y-Axis for Protein/Carbs/Fats */}
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  tickFormatter={(value) => `${value}g`}
                  tick={{ fill: "var(--color-text)" }}
                  label={{
                    value: "Nutrients (g)",
                    angle: -90,
                    position: "right",
                    fill: "#666",
                    dy: 20,
                    dx: 25,
                    style: {
                      textAnchor: "middle",
                      fontSize: "14px",
                    },
                  }}
                  padding={{ top: 20, bottom: 20 }}
                  domain={[0, "auto"]}
                  width={80}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value, name) => {
                    const unit = name === "calories" ? "kcal" : "g";
                    return [`${value} ${unit}`, name];
                  }}
                />

                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => {
                    if (value === "calories") return "Calories (kcal)";
                    if (value === "protein") return "Protein (g)";
                    if (value === "carbs") return "Carbs (g)";
                    return "Fats (g)";
                  }}
                  style={{ color: "var(--color-text)" }}
                />

                {/* Calories Line (Left Axis) */}
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='calories'
                  stroke='#000000'
                  strokeWidth={2}
                  dot={{ fill: "#000000" }}
                  activeDot={{ r: 6 }}
                />

                {/* Protein Line (Right Axis) */}
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='protein'
                  stroke='#ff0000'
                  strokeWidth={1.5}
                  dot={{ fill: "#ff0000" }}
                />

                {/* Carbs Line (Right Axis) */}
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='carbs'
                  stroke='#00aa00'
                  strokeWidth={1.5}
                  dot={{ fill: "#00aa00" }}
                />

                {/* Fats Line (Right Axis) */}
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='fats'
                  name='fats'
                  stroke='#ffd700'
                  strokeWidth={1.5}
                  dot={{ fill: "#ffd700" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default NutritionCard;
