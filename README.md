# **Optifi \- AI Financial Coach**

DEMO: https://www.youtube.com/watch?v=PjrtHv9MCA8

## Getting Started

These instructions will guide you through setting up and running the application on your local machine using Docker.

## Prerequisites
You must have the following software installed:
Docker and Docker Compose
An API Key for the Gemini LLM service (e.g., GEMINI_API_KEY)


Docker Deployment (Recommended)

### 1. Clone the Repository
   
```git clone https://github.com/jdoey/ai_financial_coach.git```

```cd ai_financial_coach```

### 2. Configure Environment Variables
   
Create a file named .env in the project root and add your secret keys. Docker Compose will automatically inject these into the backend container.

```OPENAI_API_KEY=YOUR_SECRET_API_KEY_HERE```

### 3. Build and Run the Containers
   
This command builds the images for both the frontend and backend and starts the services in the background.

```docker-compose up --build -d```

### 4. Access the Application
   
The frontend is mapped to port 3000 on your host machine.

Open your web browser and navigate to:

```http://localhost:3000```
