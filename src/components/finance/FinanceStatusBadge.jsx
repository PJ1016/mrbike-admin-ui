import React from "react";
import { STATUS_CONFIG, DEFAULT_STATUS_STYLE } from "../../utils/financeHelpers";

const FinanceStatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || DEFAULT_STATUS_STYLE;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {status || "—"}
    </span>
  );
};

export default FinanceStatusBadge;
