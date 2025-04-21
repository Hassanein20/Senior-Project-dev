import { Card } from "react-bootstrap";
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

const NutritionCard = ({ title, dataKey, color, data, unit }) => (
  <Card
    className='shadow-sm mb-4'
    style={{ backgroundColor: "var(--color-graph)" }}
  >
    <Card.Header
      className=' d-flex flex-rows justify-content-between align-items-center'
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
    </Card.Header>
    <Card.Body>
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
                position: "left", // Changed from 'insideLeft'
                fill: "#000000",
                dx: -25, // Adjust horizontal position
                style: {
                  textAnchor: "middle",
                  fontSize: "14px",
                },
              }}
              padding={{ top: 20, bottom: 20 }} // Add padding
              domain={[0, "auto"]} // Force start at 0
              width={80} // Increase axis width
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
                dy: 20, // Adjust vertical position
                dx: 25, // Adjust horizontal position
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
              stroke='#ffd700'
              strokeWidth={1.5}
              dot={{ fill: "#ffd700" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card.Body>
  </Card>
);
export default NutritionCard;
