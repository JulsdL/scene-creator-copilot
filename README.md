# CopilotKit <> LangGraph Starter

This is a starter template for building AI agents using [LangGraph](https://www.langchain.com/langgraph) and [CopilotKit](https://copilotkit.ai). It provides a modern Next.js application with an integrated LangGraph agent to be built on top of.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Any of the following JavaScript package managers:
  - [pnpm](https://pnpm.io/installation) (recommended)
  - npm
  - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
  - [bun](https://bun.sh/)
- Python package manager (one of):
  - [uv](https://docs.astral.sh/uv/) (recommended for faster installs)
  - pip (included with Python)
- Google AI API Key (for Gemini 3 and Nano Banana)

> **Note:** This repository ignores lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb) to avoid conflicts between different package managers. Each developer should generate their own lock file using their preferred package manager. After that, make sure to delete it from the .gitignore.

## Getting Started

1. Install dependencies using your preferred package manager:
```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

> **Note:** Installing the package dependencies will also install the agent's Python dependencies via the `install:agent` script. The script will automatically use `uv` if available, otherwise it falls back to `pip`.

2. Set up your Google AI API key:
```bash
echo 'GOOGLE_API_KEY=your-google-ai-api-key-here' > agent/.env
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

3. Start the development server:
```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

This will start both the UI and agent servers concurrently.

## Available Scripts
The following scripts can also be run using your preferred package manager:
- `dev` - Starts both UI and agent servers in development mode
- `dev:debug` - Starts development servers with debug logging enabled
- `dev:ui` - Starts only the Next.js UI server
- `dev:agent` - Starts only the LangGraph agent server
- `build` - Builds the Next.js application for production
- `start` - Starts the production server
- `lint` - Runs ESLint for code linting
- `install:agent` - Installs Python dependencies (uses `uv` if available, otherwise `pip`)

## Documentation

The main UI component is in `src/app/page.tsx`. You can:
- Modify the theme colors and styling
- Add new frontend actions
- Customize the CopilotKit sidebar appearance

## 📚 Documentation

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) - Learn more about LangGraph and its features
- [CopilotKit Documentation](https://docs.copilotkit.ai) - Explore CopilotKit's capabilities
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [YFinance Documentation](https://pypi.org/project/yfinance/) - Financial data tools

## Contributing

Feel free to submit issues and enhancement requests! This starter is designed to be easily extensible.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Agent Connection Issues
If you see "I'm having trouble connecting to my tools", make sure:
1. The LangGraph agent is running on port 8123
2. Your Google AI API key is set correctly in `agent/.env`
3. Both servers started successfully

### Python Dependencies
If you encounter Python import errors, try reinstalling:
```bash
npm run install:agent
```

Or install manually using uv (recommended):
```bash
cd agent
uv pip install -r requirements.txt
```

Or using pip:
```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```