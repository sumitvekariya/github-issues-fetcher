# GitHub Issues Fetcher

A CLI tool to fetch and filter GitHub issues from multiple repositories. This tool allows you to:
- Fetch issues from multiple GitHub organizations or specific repositories
- Filter issues by labels
- Sort issues by creation date
- View repository information
- Export results to JSON files

## Installation

```bash
npm install -g github-issues-fetcher
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and add your GitHub token:
```env
GITHUB_TOKEN=your_github_token_here
```

You can also provide the token via the `--token` option when running commands.

## Usage

### Fetch Issues

From organizations:
```bash
gh-issues issues -o ethereum privacy-scaling-explorations -l "good first issue" "help wanted" -s 2024-01-01
```

From specific repositories:
```bash
gh-issues issues -r ethereum/go-ethereum ethereum/solidity -l "good first issue" -s 2024-01-01
```

Or both:
```bash
gh-issues issues -o ethereum -r privacy-scaling-explorations/semaphore -l "good first issue" -s 2024-01-01
```

Export to JSON:
```bash
gh-issues issues -o ethereum -l "good first issue" -j issues.json
```

Options:
- `-o, --orgs`: List of GitHub organizations to fetch issues from
- `-r, --repos`: List of GitHub repositories to fetch issues from (format: owner/repo)
- `-l, --labels`: Filter issues by labels
- `-s, --since`: Fetch issues since date (YYYY-MM-DD)
- `-t, --token`: GitHub API token (defaults to GITHUB_TOKEN env variable)
- `-j, --json`: Export results to JSON file

### Fetch Repositories

From organizations:
```bash
gh-issues repos -o ethereum privacy-scaling-explorations -s 2024-01-01
```

From specific repositories:
```bash
gh-issues repos -r ethereum/go-ethereum ethereum/solidity -s 2024-01-01
```

Or both:
```bash
gh-issues repos -o ethereum -r privacy-scaling-explorations/semaphore -s 2024-01-01
```

Export to JSON:
```bash
gh-issues repos -o ethereum -j repos.json
```

Options:
- `-o, --orgs`: List of GitHub organizations to fetch repositories from
- `-r, --repos`: List of specific GitHub repositories to fetch (format: owner/repo)
- `-s, --since`: Fetch repositories since date (YYYY-MM-DD)
- `-t, --token`: GitHub API token (defaults to GITHUB_TOKEN env variable)
- `-j, --json`: Export results to JSON file

### JSON Output Format

The exported JSON file includes metadata about the query and the results:

```json
{
  "metadata": {
    "timestamp": "2024-03-14T12:00:00.000Z",
    "query": {
      "orgs": ["ethereum"],
      "repos": ["privacy-scaling-explorations/semaphore"],
      "labels": ["good first issue"],
      "since": "2024-01-01"
    }
  },
  "issues": [
    // Array of issue objects
  ]
}
```

## Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

## License

MIT 