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
} from "react-bootstrap";
import NutritionCard from "../Graph/NutritionCard";
import ICard from "../IngredientCard/ICard";
import { searchFoods } from "../../API/FoodDataCentral";

const Standard = () => {
  const Goal = "Gain Weight";
  const CurrentWeight = 83.4;
  const [show, setShow] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });
  const [weeklyData, setWeeklyData] = useState([
    { day: "Monday", calories: 3500, protein: 120, carbs: 250, fats: 70 },
    { day: "Tuesday", calories: 3800, protein: 150, carbs: 200, fats: 80 },
    { day: "Wednesday", calories: 3200, protein: 130, carbs: 220, fats: 60 },
    { day: "Thursday", calories: 3000, protein: 140, carbs: 210, fats: 75 },
    { day: "Friday", calories: 4000, protein: 160, carbs: 260, fats: 90 },
    { day: "Saturday", calories: 4500, protein: 180, carbs: 300, fats: 100 },
    { day: "Sunday", calories: 3700, protein: 155, carbs: 240, fats: 85 },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const caloriesGoal = 4000;
  const caloriesLeft = caloriesGoal - dailyTotals.calories;

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
      Protein: Math.max(
        0,
        food.foodNutrients.find((n) => n.nutrientName === "Protein")?.value || 0
      ),
      Carbs: Math.max(
        0,
        food.foodNutrients.find(
          (n) => n.nutrientName === "Carbohydrate, by difference"
        )?.value || 0
      ),
      Fats: Math.max(
        0,
        food.foodNutrients.find((n) => n.nutrientName === "Total lipid (fat)")
          ?.value || 0
      ),
    };

    return [
      { value: nutrients.Protein, color: "#ff6384", label: "Protein" },
      { value: nutrients.Carbs, color: "#36a2eb", label: "Carbs" },
      { value: nutrients.Fats, color: "#ffce56", label: "Fats" },
    ];
  };

  const handleAddIngredient = (ingredient, grams) => {
    const proteinPer100g = ingredient.chartData.find(
      (d) => d.label === "Protein"
    ).value;
    const carbsPer100g = ingredient.chartData.find(
      (d) => d.label === "Carbs"
    ).value;
    const fatsPer100g = ingredient.chartData.find(
      (d) => d.label === "Fats"
    ).value;

    const protein = (proteinPer100g * grams) / 100;
    const carbs = (carbsPer100g * grams) / 100;
    const fats = (fatsPer100g * grams) / 100;
    const calories = protein * 4 + carbs * 4 + fats * 9;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setDailyTotals((prev) => ({
      protein: prev.protein + protein,
      carbs: prev.carbs + carbs,
      fats: prev.fats + fats,
      calories: prev.calories + calories,
    }));

    setAddedIngredients((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: ingredient.name,
        grams,
        protein,
        carbs,
        fats,
        calories,
        timestamp,
      },
    ]);

    const currentDayIndex =
      new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    setWeeklyData((prev) =>
      prev.map((day, idx) =>
        idx === currentDayIndex
          ? {
              ...day,
              calories: day.calories + calories,
              protein: day.protein + protein,
              carbs: day.carbs + carbs,
              fats: day.fats + fats,
            }
          : day
      )
    );
  };

  const handleDeleteIngredient = (id) => {
    setAddedIngredients((prev) => {
      const deleted = prev.find((item) => item.id === id);
      if (!deleted) return prev;

      setDailyTotals((prevTotals) => ({
        protein: prevTotals.protein - deleted.protein,
        carbs: prevTotals.carbs - deleted.carbs,
        fats: prevTotals.fats - deleted.fats,
        calories: prevTotals.calories - deleted.calories,
      }));

      const currentDayIndex =
        new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      setWeeklyData((prevWeekly) =>
        prevWeekly.map((day, idx) =>
          idx === currentDayIndex
            ? {
                ...day,
                calories: day.calories - deleted.calories,
                protein: day.protein - deleted.protein,
                carbs: day.carbs - deleted.carbs,
                fats: day.fats - deleted.fats,
              }
            : day
        )
      );

      return prev.filter((item) => item.id !== id);
    });
  };

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
            {error && <div className='alert alert-danger'>{error}</div>}
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
        <Row>
          <Col>
            <h2>Welcome,</h2>
          </Col>
          <Col className='d-flex justify-content-end align-items-center'>
            <p style={{ fontWeight: "bold" }}>
              {new Date().toString().slice(0, 15)}
            </p>
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
              data={weeklyData}
              unit='kcal'
            />
          </Col>
        </Row>

        <Row className='mt-4'>
          <Card
            style={{ backgroundColor: "var(--color-card)", padding: "1rem" }}
          >
            <h5>Added Ingredients</h5>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {addedIngredients.map((item) => (
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
                      {item.protein.toFixed(1)}Protein · {item.carbs.toFixed(1)}{" "}
                      Carbs · {item.fats.toFixed(1)} Fats
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
              ))}
              {addedIngredients.length === 0 && (
                <div className='text-muted text-center py-3'>
                  No ingredients added yet
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
