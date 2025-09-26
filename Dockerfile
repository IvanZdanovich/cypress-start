FROM cypress/base:latest

WORKDIR /e2e

# Set environment variables to suppress D-Bus warnings
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/dev/null

# Accept build arguments for test configuration
ARG LANGUAGE=en
ARG TARGET_ENV=dev
ARG COLOUR_THEME=default

# Set environment variables from build args
ENV LANGUAGE=${LANGUAGE}
ENV TARGET_ENV=${TARGET_ENV}
ENV COLOUR_THEME=${COLOUR_THEME}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Run pretest scripts and tests with environment variables
CMD ["npm", "run", "test"]
