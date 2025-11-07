FROM cypress/base:latest

WORKDIR /e2e

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

# Install dependencies (skip prepare script as husky is not needed in CI)
RUN npm ci --omit=dev --ignore-scripts

# Install Cypress binary explicitly (required because --ignore-scripts skips postinstall)
RUN npx cypress install

# Copy project files
COPY . .

# Run pretest scripts and tests with environment variables
CMD ["npm", "run", "test"]
