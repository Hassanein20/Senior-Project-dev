import { React, useState, useEffect, useRef, useLayoutEffect } from "react";
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
import { foodEntryAPI, fetchCSRFToken, authAPI } from "../../API/api";
import { CSRF } from "../../utils/csrf";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";

// Import icons individually
import { FaFire } from "react-icons/fa";
import { FaWeight } from "react-icons/fa";
import { FaAppleAlt } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaBreadSlice } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import { FaBacon } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { FaUtensils } from "react-icons/fa";
import { FaList } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { FaBolt } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";

// Remove problematic imports
// import { BiTargetLock, BiDumbbell, BiTrendingUp } from "react-icons/bi";
// import { GiMuscleUp, GiWeightLiftingUp, GiWaterBottle } from "react-icons/gi";
// import { IoNutrition, IoFitness } from "react-icons/io5";

// Import Three.js related libraries - these would need to be installed via npm
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, useGLTF } from '@react-three/drei';

// 3D Model Component - Uncomment when ready to implement
// const NutritionModel = ({ position = [0, 0, 0], scale = 0.5 }) => {
//   // Path to your 3D model - you would need to add this to your assets
//   const { scene } = useGLTF('/models/nutrition_icon.glb');
//
//   return (
//     <primitive
//       object={scene}
//       position={position}
//       scale={[scale, scale, scale]}
//       rotation={[0, Math.PI / 4, 0]}
//     />
//   );
// };

const Standard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const Goal = currentUser?.goalType || "Maintain Weight";
  const CurrentWeight = currentUser?.weight || 0;
  const [show, setShow] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editGoals, setEditGoals] = useState({
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFats: 0,
    targetWeight: 0,
  });
  const [goalUpdateLoading, setGoalUpdateLoading] = useState(false);
  const [goalUpdateError, setGoalUpdateError] = useState("");
  const [goalUpdateSuccess, setGoalUpdateSuccess] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });
  // eslint-disable-next-line no-unused-vars
  const [weeklyData, setWeeklyData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [foodEntriesChanged, setFoodEntriesChanged] = useState(0);
  const [userGoals, setUserGoals] = useState({
    targetCalories: 2000,
    targetProtein: 0,
    targetCarbs: 0,
    targetFats: 0,
    targetWeight: 0,
  });
  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const modalIngredientsRef = useRef(null);

  // Refs for 3D card effect
  const cardRef = useRef(null);
  const addedIngredientsCardRef = useRef(null);

  // Add refs for animated elements
  const goalRowRefs = useRef([]);
  const headerRef = useRef(null);
  const progressBarRefs = useRef([]);

  // Add pagination for added ingredients
  const [displayedAddedIngredients, setDisplayedAddedIngredients] = useState(
    []
  );
  const [addedIngredientsPage, setAddedIngredientsPage] = useState(1);
  const [hasMoreAddedIngredients, setHasMoreAddedIngredients] = useState(true);
  const addedIngredientsContainerRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  // Set CSS variables for nutrition card colors
  useLayoutEffect(() => {
    if (cardRef.current) {
      const root = document.documentElement;

      // Set RGB values for primary color for use in gradients and effects
      root.style.setProperty("--color-primary-rgb", "75, 192, 192");
      root.style.setProperty("--color-protein-rgb", "255, 99, 132");
      root.style.setProperty("--color-carbs-rgb", "54, 162, 235");
      root.style.setProperty("--color-fats-rgb", "255, 206, 86");

      // Apply theme colors to card
      const card = cardRef.current;
      card.style.setProperty("--protein-color", "#ff6384");
      card.style.setProperty("--carbs-color", "#36a2eb");
      card.style.setProperty("--fats-color", "#ffce56");
      card.style.setProperty("--calories-color", "#4bc0c0");
    }
  }, []);

  // Enhanced mouse tracking for the ingredients card
  const handleIngredientsCardMouseMove = (e) => {
    if (!addedIngredientsCardRef.current) return;

    const card = addedIngredientsCardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate position as percentage
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    // Update CSS variables for the light effect
    card.style.setProperty("--x", `${xPercent}%`);
    card.style.setProperty("--y", `${yPercent}%`);

    // Apply to the light effect element
    const light = card.querySelector(`.${Style.cursorLight}`);
    if (light) {
      light.style.setProperty("--x", `${xPercent}%`);
      light.style.setProperty("--y", `${yPercent}%`);
      light.style.opacity = "1";
    }
  };

  // Handle mouse tracking for the ingredients container
  const handleAddedIngredientsMouseMove = (e) => {
    if (!addedIngredientsContainerRef.current) return;

    const container = addedIngredientsContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate position as percentage
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    // Update CSS variables for the background effect
    container.style.setProperty("--x", `${xPercent}%`);
    container.style.setProperty("--y", `${yPercent}%`);
  };

  // Handle mouse tracking for individual ingredient items
  const handleIngredientItemMouseMove = (e) => {
    const item = e.currentTarget;
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate position as percentage
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    // Update CSS variables for the item's background effect
    item.style.setProperty("--x", `${xPercent}%`);
    item.style.setProperty("--y", `${yPercent}%`);

    // Find and update the background element
    const bg = item.querySelector(`.${Style.ingredientItemBg}`);
    if (bg) {
      bg.style.setProperty("--x", `${xPercent}%`);
      bg.style.setProperty("--y", `${yPercent}%`);
      bg.style.opacity = "1";
    }
  };

  // Reset ingredient item on mouse leave
  const handleIngredientItemMouseLeave = (e) => {
    const item = e.currentTarget;
    if (!item) return;

    // Reset the background element
    const bg = item.querySelector(`.${Style.ingredientItemBg}`);
    if (bg) {
      bg.style.opacity = "0";
    }
  };

  // Reset card on mouse leave
  const handleIngredientsCardMouseLeave = (e) => {
    if (!addedIngredientsCardRef.current) return;

    const card = addedIngredientsCardRef.current;

    // Reset the light effect
    const light = card.querySelector(`.${Style.cursorLight}`);
    if (light) {
      light.style.opacity = "0";
    }
  };

  const caloriesGoal =
    userGoals.targetCalories || currentUser?.calorieGoal || 2000; // Get from user goals, fallback to user profile, default to 2000 if not set
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

  // Fetch user goals
  useEffect(() => {
    const fetchUserGoals = async () => {
      try {
        const goals = await authAPI.getUserGoals();
        setUserGoals(goals);
        console.log("Fetched user goals:", goals);
      } catch (err) {
        console.error("Failed to fetch user goals:", err);
        setError("Could not fetch user goals. Using default values.");
      }
    };

    if (currentUser) {
      fetchUserGoals();
    }
  }, [currentUser]);

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

  // Add scroll handler for loading more ingredients
  const handleScroll = () => {
    if (!modalIngredientsRef.current || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      modalIngredientsRef.current;

    // When user scrolls to bottom (with a 100px threshold), load more
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreIngredients();
    }
  };

  // Function to load more ingredients
  const loadMoreIngredients = async () => {
    if (loadingMore || !hasMore || searchTerm.length < 3) return;

    try {
      setLoadingMore(true);
      // Calculate next page
      const nextPage = currentPage + 1;

      // Fetch additional foods
      const result = await searchFoods(searchTerm, nextPage);

      // Update pagination info
      setCurrentPage(nextPage);
      setTotalPages(result.totalPages);
      setHasMore(nextPage < result.totalPages);

      // Format and add the new foods to existing list
      if (result.foods && result.foods.length > 0) {
        const formattedNewIngredients = result.foods.map((food) => ({
          id: food.fdcId,
          name: food.description,
          chartData: formatNutrients(food),
        }));

        // Append to existing ingredients
        setIngredients((prev) => [...prev, ...formattedNewIngredients]);
      } else {
        // No more items to load
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more ingredients:", err);
      setError("Failed to load more ingredients. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          // Reset pagination when search term changes
          setCurrentPage(1);
          setHasMore(true);

          const result = await searchFoods(searchTerm, 1);

          // Update pagination info
          setTotalPages(result.totalPages);
          setHasMore(result.currentPage < result.totalPages);

          const formattedIngredients = result.foods.map((food) => ({
            id: food.fdcId,
            name: food.description,
            chartData: formatNutrients(food),
          }));
          setIngredients(formattedIngredients);
          setError("");
        } catch (err) {
          setError("Failed to fetch data");
          setIngredients([]);
          setHasMore(false);
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

        // Create new ingredient object with isNew flag for animation
        const newIngredient = {
          id: response.id,
          name: ingredient.name,
          grams: Math.round(grams),
          protein: Number(protein.toFixed(2)),
          carbs: Number(carbs.toFixed(2)),
          fat: Number(fats.toFixed(2)),
          calories: Number(calories.toFixed(2)),
          timestamp: timestamp,
          isNew: true, // Add this flag for the animation
        };

        // Update local state with the new ingredient
        setAddedIngredients((prev) => [newIngredient, ...prev]);

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

          // After 3 seconds, remove the isNew flag to stop the animation
          setTimeout(() => {
            setAddedIngredients((prevIngredients) =>
              prevIngredients.map((item) =>
                item.id === newIngredient.id ? { ...item, isNew: false } : item
              )
            );
          }, 3000);
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

  // Add effect for intersection observer to animate elements when they come into view
  useEffect(() => {
    if (!goalRowRefs.current.length) return;

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateX(0)";
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Store refs in variables to avoid exhaustive deps warning
    const currentGoalRowRefs = [...goalRowRefs.current];
    const currentProgressBarRefs = [...progressBarRefs.current];

    // Observe goal rows for animation
    currentGoalRowRefs.forEach((row, index) => {
      if (row) {
        row.style.opacity = "0";
        row.style.transform = "translateX(-20px)";
        row.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(row);
      }
    });

    // Observe progress bars for animation
    currentProgressBarRefs.forEach((bar) => {
      if (bar) {
        const fill = bar.querySelector(`.${Style.progressFill}`);
        if (fill) {
          fill.style.width = "0%";
          observer.observe(bar);
        }
      }
    });

    return () => {
      currentGoalRowRefs.forEach((row) => {
        if (row) observer.unobserve(row);
      });
      currentProgressBarRefs.forEach((bar) => {
        if (bar) observer.unobserve(bar);
      });
    };
  }, [addedIngredients]); // Re-run when ingredients change to catch new elements

  // Handle scroll for added ingredients container
  const handleAddedIngredientsScroll = () => {
    if (!addedIngredientsContainerRef.current || !hasMoreAddedIngredients)
      return;

    const { scrollTop, scrollHeight, clientHeight } =
      addedIngredientsContainerRef.current;

    // When user scrolls to bottom (with a 50px threshold), load more
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreAddedIngredients();
    }
  };

  // Function to load more added ingredients
  const loadMoreAddedIngredients = () => {
    if (!hasMoreAddedIngredients) return;

    const nextPage = addedIngredientsPage + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Check if we have more items to load
    if (startIndex >= addedIngredients.length) {
      setHasMoreAddedIngredients(false);
      return;
    }

    // Get the next batch of items
    const nextBatch = addedIngredients.slice(startIndex, endIndex);

    // Update the displayed items and pagination state
    setDisplayedAddedIngredients((prev) => [...prev, ...nextBatch]);
    setAddedIngredientsPage(nextPage);

    // Check if we have more items for future loads
    setHasMoreAddedIngredients(endIndex < addedIngredients.length);
  };

  // Initialize displayed added ingredients when addedIngredients changes
  useEffect(() => {
    // Reset pagination
    setAddedIngredientsPage(1);

    // Load first page
    const initialItems = addedIngredients.slice(0, ITEMS_PER_PAGE);
    setDisplayedAddedIngredients(initialItems);

    // Check if we have more items
    setHasMoreAddedIngredients(addedIngredients.length > ITEMS_PER_PAGE);
  }, [addedIngredients]);

  // Handle showing goal edit modal
  const handleShowGoalsModal = () => {
    // Set initial values from current user goals
    setEditGoals({
      targetCalories: userGoals.targetCalories,
      targetProtein: userGoals.targetProtein,
      targetCarbs: userGoals.targetCarbs,
      targetFats: userGoals.targetFats,
      targetWeight: userGoals.targetWeight,
    });
    setGoalUpdateError("");
    setGoalUpdateSuccess(false);
    setShowGoalsModal(true);
  };

  // Handle saving updated goals
  const handleSaveGoals = async () => {
    try {
      setGoalUpdateLoading(true);
      setGoalUpdateError("");
      setGoalUpdateSuccess(false);

      // Validate inputs
      const goals = {
        targetCalories: Number(editGoals.targetCalories) || 0,
        targetProtein: Number(editGoals.targetProtein) || 0,
        targetCarbs: Number(editGoals.targetCarbs) || 0,
        targetFats: Number(editGoals.targetFats) || 0,
        targetWeight: Number(editGoals.targetWeight) || 0,
      };

      // Ensure we have valid numbers
      if (goals.targetCalories <= 0) {
        setGoalUpdateError("Calories must be greater than 0");
        setGoalUpdateLoading(false);
        return;
      }

      // Call API to update goals
      const updatedGoals = await authAPI.updateUserGoals(goals);
      console.log("Goals updated successfully:", updatedGoals);

      // Update local state
      setUserGoals(updatedGoals || goals);
      setGoalUpdateSuccess(true);

      // Close modal after a short delay
      setTimeout(() => {
        setShowGoalsModal(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to update goals:", err);
      setGoalUpdateError(err.message || "Failed to update goals");
    } finally {
      setGoalUpdateLoading(false);
    }
  };

  // Handle input change for goal edit form
  const handleGoalInputChange = (e) => {
    const { name, value } = e.target;
    setEditGoals((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      <Modal
        size='xl'
        show={show}
        onHide={() => setShow(false)}
        backdrop='static'
        keyboard={false}
        className={Style.fadeInModal}
      >
        <Modal.Header className={Style.modalHeader}>
          <Modal.Title className={Style.modalTitle}>
            <div className={Style.modalIconWrapper}>
              <FaAppleAlt className={Style.modalIcon} />
            </div>
            Search Items
          </Modal.Title>
          <Button
            variant='link'
            className={Style.modalCloseButton}
            onClick={() => setShow(false)}
            aria-label='Close'
          >
            <span aria-hidden='true'>&times;</span>
          </Button>
        </Modal.Header>

        <Modal.Body className={Style.modalBody}>
          <Form.Control
            type='text'
            placeholder='Search items...'
            className={`mb-3 ${Style.searchInput}`}
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
            {loading && (
              <Spinner animation='border' className={Style.spinner} />
            )}
            {renderError(error)}
          </div>

          <Row
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              position: "relative",
            }}
            className={`${Style.ingredientGrid} ${Style.smoothScroll}`}
            ref={modalIngredientsRef}
            onScroll={handleScroll}
          >
            <div className={Style.scrollFadeTop}></div>
            {ingredients.map((ingredient, index) => (
              <Col
                xs={12}
                sm={6}
                md={6}
                lg={6}
                key={`${ingredient.id}-${index}`}
                className={Style.ingredientCol}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ICard
                  title={ingredient.name}
                  chartData={ingredient.chartData}
                  onAdd={(grams) => handleAddIngredient(ingredient, grams)}
                  style={{ width: "100%" }}
                />
              </Col>
            ))}
            {loadingMore && (
              <Col xs={12} className={Style.loadingMoreContainer}>
                <Spinner
                  animation='border'
                  size='sm'
                  className={Style.spinner}
                />
                <span className='ms-2'>Loading more...</span>
              </Col>
            )}
            {!hasMore && ingredients.length > 0 && (
              <Col xs={12} className='text-center my-3'>
                <span className={Style.noMoreItemsText}>
                  No more items to load
                </span>
              </Col>
            )}
            <div className={Style.scrollFadeBottom}></div>
          </Row>
        </Modal.Body>
      </Modal>

      <Modal
        show={showGoalsModal}
        onHide={() => setShowGoalsModal(false)}
        backdrop='static'
        keyboard={false}
        className={Style.fadeInModal}
        centered
      >
        <Modal.Header className={Style.modalHeader}>
          <Modal.Title className={Style.modalTitle}>
            <div className={Style.modalIconWrapper}>
              <FaEdit className={Style.modalIcon} />
            </div>
            Edit Nutrition Goals
          </Modal.Title>
          <Button
            variant='link'
            className={Style.modalCloseButton}
            onClick={() => setShowGoalsModal(false)}
            aria-label='Close'
          >
            <span aria-hidden='true'>&times;</span>
          </Button>
        </Modal.Header>

        <Modal.Body className={Style.modalBody}>
          {goalUpdateError && (
            <Alert variant='danger' className='mb-3'>
              {goalUpdateError}
            </Alert>
          )}
          {goalUpdateSuccess && (
            <Alert variant='success' className='mb-3'>
              Goals updated successfully!
            </Alert>
          )}

          <Form>
            <Form.Group className='mb-3'>
              <Form.Label>
                <FaFire className={Style.formLabelIcon} /> Daily Calories (kcal)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetCalories'
                value={editGoals.targetCalories}
                onChange={handleGoalInputChange}
                min='0'
                placeholder='Daily calorie goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaDrumstickBite className={Style.formLabelIcon} /> Protein (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetProtein'
                value={editGoals.targetProtein}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily protein goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaBreadSlice className={Style.formLabelIcon} /> Carbohydrates
                (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetCarbs'
                value={editGoals.targetCarbs}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily carbohydrates goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaBacon className={Style.formLabelIcon} /> Fats (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetFats'
                value={editGoals.targetFats}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily fats goal'
              />
            </Form.Group>

            <Form.Group className='mb-4'>
              <Form.Label>
                <FaWeight className={Style.formLabelIcon} /> Target Weight (kg)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetWeight'
                value={editGoals.targetWeight}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Target weight'
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowGoalsModal(false)}
            disabled={goalUpdateLoading}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSaveGoals}
            disabled={goalUpdateLoading}
          >
            {goalUpdateLoading ? (
              <>
                <Spinner animation='border' size='sm' className='me-2' />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Container
        fluid
        className={`${Style.Screen}`}
        style={{ padding: "5vh", overflow: "auto", zIndex: "1" }}
      >
        {renderError(error)}
        <Row className='header-row align-items-center mb-4'>
          <Col xs={12} md={6} className='mb-3 mb-md-0'>
            <h2
              style={{ color: "var(--color-primary)" }}
              className={Style.welcomeText}
            >
              Welcome, {currentUser?.username || "User"}
            </h2>
          </Col>
          <Col
            xs={12}
            md={6}
            className='d-flex flex-wrap justify-content-md-end justify-content-center align-items-center'
          >
            <div className={`${Style.dateDisplayContainer} me-2 mb-2 mb-md-0`}>
              <p className={Style.dateDisplay}>
                {new Date().toString().slice(0, 15)}
              </p>
            </div>
            <Button
              variant='outline-danger'
              onClick={handleLogout}
              className={Style.logoutBtn}
              size='sm'
            >
              <FaSignOutAlt className={`${Style.btnIcon} me-1`} />
              <span className='d-none d-sm-inline'>Logout</span>
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
              className={Style.goalsCard}
              ref={cardRef}
              // Remove mouse event handlers
              // onMouseMove={handleMouseMove}
              // onMouseLeave={handleMouseLeave}
            >
              {/* Decorative background elements */}
              <div className={Style.cardDecoration}>
                <div className={Style.circle1}></div>
                <div className={Style.circle2}></div>
                <div className={Style.circle3}></div>
              </div>

              <div className={Style.goalsHeader} ref={headerRef}>
                <h4>
                  <div className={Style.headerIcon}>
                    <FaFire className={Style.fireIcon} />
                  </div>
                  Nutrition Goals
                </h4>
                <p className='mb-0'>
                  <span style={{ fontWeight: "bolder" }}>{Goal}</span>
                </p>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[0] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.caloriesIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaFire className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaFire className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Daily Calories</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.caloriesColor}`}>
                      {caloriesGoal}{" "}
                      <span className={Style.unitLabel}>kcal</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[0] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.calories / caloriesGoal) * 100
                      )}%`,
                      backgroundColor: "var(--calories-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round((dailyTotals.calories / caloriesGoal) * 100)
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.calories.toFixed(0)} / {caloriesGoal}
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p
                    className={`${Style.remainingValue} ${Style.caloriesColor}`}
                  >
                    {caloriesLeft > 0 ? caloriesLeft : 0}{" "}
                    <span className={Style.unitLabel}>kcal</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[1] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.proteinIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaDrumstickBite className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaDrumstickBite className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Protein</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.proteinColor}`}>
                      {userGoals.targetProtein}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[1] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.protein / (userGoals.targetProtein || 1)) *
                          100
                      )}%`,
                      backgroundColor: "var(--protein-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.protein / (userGoals.targetProtein || 1)) *
                          100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.protein.toFixed(1)} / {userGoals.targetProtein}
                    g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p
                    className={`${Style.remainingValue} ${Style.proteinColor}`}
                  >
                    {userGoals.targetProtein - dailyTotals.protein > 0
                      ? (userGoals.targetProtein - dailyTotals.protein).toFixed(
                          1
                        )
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[2] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.carbsIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaBreadSlice className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaBreadSlice className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Carbohydrates</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.carbsColor}`}>
                      {userGoals.targetCarbs}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[2] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.carbs / (userGoals.targetCarbs || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--carbs-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.carbs / (userGoals.targetCarbs || 1)) * 100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.carbs.toFixed(1)} / {userGoals.targetCarbs}g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p className={`${Style.remainingValue} ${Style.carbsColor}`}>
                    {userGoals.targetCarbs - dailyTotals.carbs > 0
                      ? (userGoals.targetCarbs - dailyTotals.carbs).toFixed(1)
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[3] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.fatsIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaBacon className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaBacon className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Fats</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.fatsColor}`}>
                      {userGoals.targetFats}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[3] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.fats / (userGoals.targetFats || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--fats-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.fats / (userGoals.targetFats || 1)) * 100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.fats.toFixed(1)} / {userGoals.targetFats}g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p className={`${Style.remainingValue} ${Style.fatsColor}`}>
                    {userGoals.targetFats - dailyTotals.fats > 0
                      ? (userGoals.targetFats - dailyTotals.fats).toFixed(1)
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div className={Style.targetGoal}>
                <div className={Style.targetGoalHeader}>
                  <div
                    className={`${Style.goalIconWrapper} ${Style.weightIconWrapper}`}
                  >
                    <div className={Style.goalIcon3D}>
                      <div
                        className={`${Style.iconFace} ${Style.iconFaceFront}`}
                      >
                        <FaWeight className={Style.goalIcon} />
                      </div>
                      <div
                        className={`${Style.iconFace} ${Style.iconFaceBack}`}
                      >
                        <FaWeight className={Style.goalIcon} />
                      </div>
                    </div>
                  </div>
                  <p className={Style.targetGoalTitle}>Weight Goal</p>
                </div>

                <div className={Style.targetGoalValue}>
                  {userGoals.targetWeight}kg
                </div>

                <div className={Style.progressBar3D}>
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (CurrentWeight / (userGoals.targetWeight || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--weight-color, #9966ff)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    Current: {CurrentWeight}kg
                  </span>
                  <span className={Style.progressCurrent}>
                    {userGoals.targetWeight > CurrentWeight ? "Gain" : "Lose"}:{" "}
                    {Math.abs(userGoals.targetWeight - CurrentWeight).toFixed(
                      1
                    )}
                    kg
                  </span>
                </div>

                <div
                  className={Style.decorativeSphere + " " + Style.sphere1}
                ></div>
                <div
                  className={Style.decorativeSphere + " " + Style.sphere2}
                ></div>
              </div>

              <div className={Style.editGoalsBtnContainer}>
                <Button
                  variant='outline-primary'
                  size='sm'
                  className={Style.editGoalsBtn}
                  onClick={handleShowGoalsModal}
                >
                  <FaEdit className={Style.btnIcon} /> Edit Nutrition Goals
                </Button>
              </div>

              <div className={Style.cardDecoration}>
                <div className={Style.circle1}></div>
                <div className={Style.circle2}></div>
                <div className={Style.circle3}></div>
              </div>
            </Card>
            <Button
              className={`${Style.addButton} mt-3`}
              style={{ width: "100%", marginBottom: "1rem" }}
              onClick={() => setShow(true)}
            >
              <FaPlus className={Style.btnIcon} /> Add Ingredients
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
            className={Style.addedIngredientsCard}
            style={{ padding: 0 }}
            onMouseMove={handleIngredientsCardMouseMove}
            onMouseLeave={handleIngredientsCardMouseLeave}
            ref={addedIngredientsCardRef}
          >
            <div className={Style.cursorLight}></div>
            <div className={Style.addedIngredientsHeader}>
              <div className={Style.addedIngredientsTitleWrapper}>
                <FaList className={Style.addedIngredientsIcon} />
                <h5 className={Style.addedIngredientsTitle}>
                  Added Ingredients
                </h5>
              </div>
            </div>
            <div
              className={`${Style.addedIngredientsContainer} ${Style.smoothScroll}`}
              onScroll={handleAddedIngredientsScroll}
              ref={addedIngredientsContainerRef}
              onMouseMove={handleAddedIngredientsMouseMove}
            >
              <div className={Style.scrollFadeTop}></div>
              {displayedAddedIngredients.length > 0 ? (
                displayedAddedIngredients.map((item) => (
                  <div
                    key={item.id}
                    className={`${Style.ingredientItem} ${
                      item.isNew ? Style.new : ""
                    }`}
                    onMouseMove={handleIngredientItemMouseMove}
                    onMouseLeave={handleIngredientItemMouseLeave}
                    data-item-id={item.id}
                  >
                    <div className={Style.ingredientItemBg}></div>
                    <div className={Style.ingredientDetails}>
                      <div className={Style.ingredientName}>{item.name}</div>
                      <div className={Style.ingredientMeta}>
                        <FaUtensils
                          style={{ marginRight: "5px", fontSize: "0.7rem" }}
                        />
                        {item.grams}g
                        <FaCalendarAlt
                          style={{
                            marginLeft: "10px",
                            marginRight: "5px",
                            fontSize: "0.7rem",
                          }}
                        />
                        {item.timestamp}
                      </div>
                      <div className={Style.ingredientNutrition}>
                        <span
                          className={`${Style.nutritionBadge} ${Style.caloriesBadge}`}
                        >
                          <FaBolt className={Style.nutritionIcon} />
                          {item.calories.toFixed(1)} kcal
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.proteinBadge}`}
                        >
                          <FaDrumstickBite className={Style.nutritionIcon} />
                          {item.protein.toFixed(1)}g
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.carbsBadge}`}
                        >
                          <FaBreadSlice className={Style.nutritionIcon} />
                          {item.carbs.toFixed(1)}g
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.fatsBadge}`}
                        >
                          <FaBacon className={Style.nutritionIcon} />
                          {item.fat.toFixed(1)}g
                        </span>
                      </div>
                    </div>
                    <div className={Style.ingredientActions}>
                      <button
                        className={Style.deleteButton}
                        onClick={() => handleDeleteIngredient(item.id)}
                      >
                        <FaTrashAlt className={Style.deleteIcon} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={Style.emptyMessage}>
                  <FaAppleAlt className={Style.emptyIcon} />
                  <p>No ingredients added yet.</p>
                </div>
              )}
              {hasMoreAddedIngredients && addedIngredients.length > 0 && (
                <div className={Style.loadingAnim}>
                  <div className={Style.loadingDots}>
                    <div className={Style.loadingDot}></div>
                    <div className={Style.loadingDot}></div>
                    <div className={Style.loadingDot}></div>
                  </div>
                  <span className={Style.noMoreItemsText}>
                    Scroll for more...
                  </span>
                </div>
              )}
              <div className={Style.scrollFadeBottom}></div>
            </div>
          </Card>
        </Row>
      </Container>
    </>
  );
};

export default Standard;
