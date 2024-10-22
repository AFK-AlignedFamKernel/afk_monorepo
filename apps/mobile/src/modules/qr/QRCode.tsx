import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CELL_SIZE = 10; // Size of each block in the QR code grid

// Basic QR Code generation based on input string
const generateQRCodeMatrix = (data: string): number[][] => {
  const size = 21;  // Fixed QR code size (for simplicity)
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Use data to populate the matrix (this is a very simplified version)
  for (let i = 0; i < data.length && i < size * size; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    const charCode = data.charCodeAt(i);  // Convert character to ASCII code
    matrix[row][col] = charCode % 2;  // Use modulo to alternate between 0 and 1
  }

  return matrix;
};


// Component to render QR code
const QRCode = ({ data }: { data: string }) => {
  const qrMatrix = generateQRCodeMatrix(data);

  return (
    <View style={styles.qrContainer}>
      {qrMatrix.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.qrRow}>
          {row.map((cell, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.qrCell,
                { backgroundColor: cell === 1 ? 'black' : 'white' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Styling for the QR code cells and container
const styles = StyleSheet.create({
  qrContainer: {
    flexDirection: 'column',
    padding: 10,
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
});

export default QRCode;
