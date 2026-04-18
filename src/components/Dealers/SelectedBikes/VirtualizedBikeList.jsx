import React from "react";
import { List } from "react-window";
import BikeChipItem from "./BikeChipItem";
import { Box, Typography } from "@mui/material";

/**
 * Virtualized list for rendering 400+ bike items smoothly.
 * Optimized for react-window v2 API.
 */
const VirtualizedBikeList = ({ bikes, onDelete }) => {
  if (bikes.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No bikes selected.
        </Typography>
      </Box>
    );
  }

  /**
   * Row renderer for react-window v2.
   * Receives index, style, and props from rowProps.
   */
  const Row = ({ index, style, onDelete }) => {
    const bike = bikes[index];
    if (!bike) return null;
    
    return (
      <BikeChipItem 
        bike={bike} 
        onDelete={onDelete} 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
          paddingRight: '8px'
        }} 
      />
    );
  };

  return (
    <List
      height={400}
      rowCount={bikes.length}
      rowHeight={50} // Height of each chip row
      width="100%"
      rowComponent={Row}
      rowProps={{ onDelete }}
    />
  );
};

export default VirtualizedBikeList;
