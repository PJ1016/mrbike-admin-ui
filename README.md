# BikeDoctor Admin Portal

React-based administrative dashboard for managing the BikeDoctor platform.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16.x or higher
- **npm**: v7.x or higher

### Installation

1. Clone the repository.
2. Navigate to the `service-admin` directory:
   ```bash
   cd service-admin
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the `service-admin` directory:

```env
REACT_APP_API_BASE_URL="http://localhost:8001/bikedoctor"
REACT_APP_IMAGE_BASE_URL="http://localhost:8001/"
```

*Note: For production, point these to your hosted backend URLs.*

### Running the App

- **Start development server**:
  ```bash
  npm start
  ```
- **Build for production**:
  ```bash
  npm run build
  ```

## 📂 Project Structure

- `src/App.jsx`: Main application component and routing.
- `src/pages/`: Modular page components (Dealers, Bookings, Payments, etc.).
- `src/components/`: Reusable UI components.
- `src/redux/`: State management using Redux Toolkit.
- `src/api/`: API service layer using Axios.

## 🛠 Tech Stack

- **Framework**: React 19
- **UI Library**: Material UI (MUI), React Bootstrap
- **State Management**: Redux Toolkit
- **Charts**: Chart.js, Ag-Charts
- **Icons**: React Icons, FontAwesome
- **Validation/Utility**: Moment.js, SweetAlert2, Axios

## 🔗 Integration

The admin portal communicates with the [BikeDoctor Backend Service](../service/README.md) via REST API and Socket.io for real-time updates.
