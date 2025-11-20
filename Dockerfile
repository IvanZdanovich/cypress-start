FROM cypress/browsers:latest

WORKDIR /e2e

# Accept build arguments for test configuration
ARG LANGUAGE=en
ARG TARGET_ENV=dev
ARG COLOUR_THEME=default

# Set environment variables from build args
ENV CYPRESS_INSTALL_BINARY=0
ENV CYPRESS_CACHE_FOLDER=/root/.cache/Cypress
ENV LANGUAGE=${LANGUAGE}
ENV TARGET_ENV=${TARGET_ENV}
ENV COLOUR_THEME=${COLOUR_THEME}
ENV CI=true

# Copy package files
COPY package*.json ./
COPY .dockerignore ./

RUN npm ci --omit=dev --no-fund

# Copy project files
COPY . .

# Run pretest scripts and tests with environment variables
CMD ["npm", "run", "test"]
