import React from "react";

const FinanceStatCell = ({ label, value, valueColor }) => (
  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", flex: 1, minWidth: 120 }}>
    <div
      style={{
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: 700,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, color: valueColor || "#0f172a" }}>{value}</div>
  </div>
);

export default FinanceStatCell;
