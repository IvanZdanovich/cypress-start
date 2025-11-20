FROM cypress/base:latest

WORKDIR /e2e

COPY package*.json ./
COPY .dockerignore ./

# Accept build arguments for test configuration
ARG LANGUAGE=en
ARG TARGET_ENV=dev
ARG COLOUR_THEME=default

# Set environment variables from build args
ENV LANGUAGE=${LANGUAGE}
ENV TARGET_ENV=${TARGET_ENV}
ENV COLOUR_THEME=${COLOUR_THEME}

RUN npm ci

# Copy project files
COPY . .

# Run pretest scripts and tests with environment variables
CMD ["npm", "run", "test"]
