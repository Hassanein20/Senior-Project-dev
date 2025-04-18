import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CircleChart = ({ data, thickness = 12, gapSize = 4 }) => {
  const nonZeroData = data.filter((item) => item.value > 0);
  const total = nonZeroData.reduce((acc, item) => acc + item.value, 0);
  const radius = 90 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  return (
    <div className='text-center'>
      <div
        className='position-relative mx-auto mb-3'
        style={{ width: "200px", height: "200px" }}
      >
        <svg width='200' height='200' viewBox='0 0 200 200'>
          {nonZeroData.map((item, index) => {
            const segmentLength = (item.value / total) * circumference;
            const dashArray = `${segmentLength - gapSize} ${
              circumference - segmentLength + gapSize
            }`;
            const rotation = (accumulatedLength / circumference) * 360 - 90;

            accumulatedLength += segmentLength;

            return (
              <circle
                key={index}
                cx='100'
                cy='100'
                r={radius}
                fill='none'
                stroke={item.color}
                strokeWidth={thickness}
                strokeLinecap='round'
                strokeDasharray={dashArray}
                transform={`rotate(${rotation} 100 100)`}
              />
            );
          })}
        </svg>

        <div className='position-absolute top-50 start-50 translate-middle text-center'>
          <div className='fs-5 fw-bold'>Total</div>
        </div>
      </div>

      {/* Legend with percentages */}
      <div className='row justify-content-center'>
        {data.map((item, index) => {
          const percentage = ((item.value / (total || 1)) * 100).toFixed(1);
          return (
            <div key={index} className='col-auto mb-2'>
              <div className='d-flex align-items-center'>
                <div
                  className='color-box me-2'
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: item.color,
                    borderRadius: "4px",
                    opacity: item.value > 0 ? 1 : 0.5,
                  }}
                ></div>
                <span>
                  {item.label} ({item.value}g)
                  <span className='text-muted ms-1'>{percentage}%</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CircleChart;
