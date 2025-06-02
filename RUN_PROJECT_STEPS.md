# Steps to Run This Project

This document provides the necessary steps to set up and run this project locally.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 18.0.0 or higher.
*   **npm**: Version 9.0.0 or higher (usually comes with Node.js).

You can check your Node.js and npm versions by running:
```bash
node -v
npm -v
```

## Setup and Installation

1.  **Clone the Repository**
    If you haven't already, clone the project repository to your local machine.

2.  **Install Dependencies**
    Navigate to the project's root directory in your terminal and run the following command to install all the necessary dependencies:
    ```bash
    npm install
    ```

## Running the Project

1.  **Start the Development Server**
    Once the dependencies are installed, you can start the project using Expo:
    ```bash
    npx expo start
    ```
    This command will start the Metro Bundler, which allows you to run the app on an emulator/simulator or on a physical device using the Expo Go app.

2.  **Troubleshooting: Port in Use**
    The Metro Bundler typically tries to run on port 8081. If this port is already in use by another application, the `npx expo start` command might fail or ask you to choose a different port.

    To find and stop the process using port 8081 (on macOS/Linux):
    ```bash
    # Find the process ID (PID) using the port
    lsof -i :8081

    # Replace <PID> with the actual process ID from the previous command
    kill -9 <PID>
    ```
    After freeing the port, try running `npx expo start` again.

3.  **Alternative: Using Expo CLI Globally (Optional)**
    While `npx expo start` is recommended (as it uses the version of Expo CLI appropriate for the project), you can also install Expo CLI globally:
    ```bash
    npm install -g expo-cli
    ```
    After global installation, you can use `expo start` directly. However, be mindful that the globally installed Expo CLI version might differ from the project's specific version, which could sometimes lead to compatibility issues. `npx expo start` avoids this by using the Expo CLI version defined in the project's dependencies.

## Development Workflow

*   The `README.md` file contains further information on available scripts for linting, testing, and building the application.
```
