FROM cypress/base:20.9.0

WORKDIR /e2e

# Set environment variables to suppress D-Bus warnings
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/dev/null

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Run pretest scripts and tests
CMD ["npm", "run", "test"]
