FROM cypress/browsers:latest

WORKDIR /e2e

# Install Xvfb for headless browser execution
RUN apt-get update && \
    apt-get install -y xvfb && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./
COPY .dockerignore ./

# Copy scripts directory (needed for postinstall script)
COPY scripts/ ./scripts/

# Build arguments for test configuration
ARG LANGUAGE=en
ARG TARGET_ENV=dev
ARG COLOUR_THEME=default
ARG PARALLEL_STREAMS=3
ARG BROWSER=chrome
ARG SPEC_PATTERN="cypress/**/*.spec.js"

# Set CI environment variable first (required for postinstall script)
ENV CI=true

# Set environment variables from build args
ENV LANGUAGE=${LANGUAGE} \
    TARGET_ENV=${TARGET_ENV} \
    COLOUR_THEME=${COLOUR_THEME} \
    PARALLEL_STREAMS=${PARALLEL_STREAMS} \
    BROWSER=${BROWSER} \
    SPEC_PATTERN=${SPEC_PATTERN}

# Install dependencies
RUN npm ci

# Copy remaining project files
COPY . .


# Default command: run tests in parallel
CMD ["npm", "run", "test:parallel"]
