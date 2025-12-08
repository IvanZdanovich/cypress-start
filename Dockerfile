FROM cypress/base:latest

WORKDIR /e2e

# Install Xvfb if not already present (cypress/base should have it, but ensuring)
RUN apt-get update && apt-get install -y xvfb && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY .dockerignore ./
COPY scripts/ ./scripts/

# Accept build arguments for test configuration
ARG LANGUAGE=en
ARG TARGET_ENV=dev
ARG COLOUR_THEME=default
ARG PARALLEL_STREAMS=3
ARG BROWSER=chrome
ARG SPEC_PATTERN="**/*.spec.js"

# Set CI environment variable first so postinstall script can detect it
ENV CI=true

# Set other environment variables from build args
ENV LANGUAGE=${LANGUAGE}
ENV TARGET_ENV=${TARGET_ENV}
ENV COLOUR_THEME=${COLOUR_THEME}
ENV PARALLEL_STREAMS=${PARALLEL_STREAMS}
ENV BROWSER=${BROWSER}
ENV SPEC_PATTERN=${SPEC_PATTERN}

RUN npm ci

# Copy project files
COPY . .

# Create entrypoint script to start multiple Xvfb servers for parallel execution
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start multiple Xvfb servers for parallel Cypress execution\n\
# Each parallel stream will use a unique display to avoid conflicts\n\
echo "Starting Xvfb servers for parallel execution..."\n\
\n\
# Start Xvfb servers for displays 99-108 (supports up to 10 parallel streams)\n\
for i in {99..108}; do\n\
  Xvfb :$i -screen 0 1280x1024x24 -ac -nolisten tcp -nolisten unix &\n\
  sleep 0.1\n\
done\n\
\n\
echo "Xvfb servers started on displays :99 to :108"\n\
\n\
# Execute the passed command\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Run pretest scripts and tests with environment variables
# Use parallel execution by default
CMD ["npm", "run", "test:parallel"]
