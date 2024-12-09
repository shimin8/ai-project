# Gemini Service API

A service built to analyze third-party API logs, categorize errors, and provide actionable insights using Google's Gemini API. The service fetches data from MongoDB, processes it, and integrates with external APIs for error analysis and logging.

---

## **Features**

- **MongoDB Integration**: Queries collections like `LifeThirdPartyApiLog` and stores results in `GeminiQuotesResponseModel`.
- **Error Analysis**: Leverages the Gemini API to analyze log data for error categorization and actionable insights.
- **Retry Mechanism**: Automatically retries API calls up to a configurable limit in case of failures.
- **Future Integration**: Contains provisions for integrations like Datadog for centralized logging and monitoring.

---

## **Installation**

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the project root:
   ```plaintext
   GEMINI_API_KEY=<your-gemini-api-key>
   DATADOG_API_KEY=<your-datadog-api-key>
   MONGO_URI=<your-mongodb-connection-string>
   ```

4. Start the server:
   ```bash
   npm start
      or
   npm run dev (for dev)
   ```

---

## **Usage**

### **Endpoints**

#### **POST /hit-service-api**
Analyzes third-party logs and provides actionable insights.

- **Request Body**:
  ```json
  {
    "insurer_id": 123,
    "apiName": ["api1", "api2"],
    "limit": 10
  }
  ```

- **Response**:
  ```json
  [
    {
      "url": "url",
      "leadId": "lead123",
      "apiName": "api1",
      "partner": "partner1",
      "errorCategory": "Validation Error",
      "errorMsg": "Invalid request payload",
      "actionableInsights": "Check the payload structure and mandatory fields.",
      "logId": "123456789",
      "logCreatedAt": "2023-01-01T12:00:00Z",
      "logUpdatedAt": "2023-01-01T13:00:00Z"
    }
  ]
  ```

---

## **Code Structure**

### **Main Components**

1. **Service (`GeminiService`)**:
   - Handles the core logic, including:
     - Querying logs from MongoDB.
     - Sending requests to the Gemini API.
     - Processing API responses for actionable insights.
   - Implements a retry mechanism for API calls.

2. **Models**:
   - `LifeThirdPartyApiLogModel`: MongoDB schema for storing API logs.
   - `GeminiQuotesResponseModel`: Schema for storing processed results.

3. **Utilities**:
   - **Constants**: Provides reusable mappings (e.g., `INSURER_ID_SLUG_MAPPING`).
   - **sendPostRequest**: Simplifies HTTP POST requests using Axios.

---

## **Configuration**

### **Constants**

- Defined in `constants.js`:
  - `INSURER_ID_SLUG_MAPPING`: Maps insurer IDs to human-readable names.

---

## **Retry Mechanism**

- Configurable `retryLimit` (default: 3).
- Ensures reliability for API calls by retrying in case of failures.
- Stops retrying when:
  - Maximum attempts are reached.
  - A successful response is received.

---

## **Future Enhancements**

- **Additional Error Handling**:
  - Expand error categorization for more nuanced actionable insights.

---

## **Dependencies**

- **Mongoose**: For MongoDB interactions.
- **Axios**: For HTTP requests.
- **dotenv**: For managing environment variables.
