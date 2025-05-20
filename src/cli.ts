#!/usr/bin/env node

import { Command } from 'commander'
import moment from 'moment'
import chalk from 'chalk'
import { GitHubService } from './github'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const program = new Command()

program
  .name('gh-issues')
  .description('CLI tool to fetch and filter GitHub issues from multiple repositories')
  .version('1.0.0')

program
  .command('issues')
  .description('Fetch issues from GitHub repositories')
  .option('-o, --orgs <orgs...>', 'List of GitHub organizations to fetch issues from')
  .option('-r, --repos <repos...>', 'List of GitHub repositories to fetch issues from (format: owner/repo)')
  .option('-l, --labels <labels...>', 'Filter issues by labels')
  .option('-s, --since <date>', 'Fetch issues since date (YYYY-MM-DD)', moment().subtract(1, 'year').format('YYYY-MM-DD'))
  .option('-t, --token <token>', 'GitHub API token (defaults to GITHUB_TOKEN env variable)')
  .option('-j, --json <path>', 'Export results to JSON file')
  .action(async (options) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN
      if (!token) {
        console.error(chalk.red('Error: GitHub token is required. Set GITHUB_TOKEN environment variable or use --token option'))
        process.exit(1)
      }

      if (!options.orgs?.length && !options.repos?.length) {
        console.error(chalk.red('Error: At least one organization (-o) or repository (-r) must be specified'))
        process.exit(1)
      }

      const github = new GitHubService(token)
      const since = moment(options.since)
      const issues = await github.getIssues(options.orgs, options.repos, options.labels, since)

      // Export to JSON if path is provided
      if (options.json) {
        const jsonPath = path.resolve(options.json)
        const jsonData = {
          metadata: {
            timestamp: new Date().toISOString(),
            query: {
              orgs: options.orgs,
              repos: options.repos,
              labels: options.labels,
              since: options.since
            }
          },
          issues
        }
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2))
        console.log(chalk.green(`\nExported ${issues.length} issues to ${jsonPath}`))
      }

      console.log(chalk.green(`\nFound ${issues.length} issues:\n`))
      
      issues.forEach((issue) => {
        console.log(chalk.blue(`[${issue.repository.nameWithOwner}]`))
        console.log(chalk.yellow(`Title: ${issue.title}`))
        console.log(chalk.cyan(`URL: ${issue.url}`))
        console.log(chalk.gray(`Created: ${moment(issue.createdAt).format('YYYY-MM-DD')}`))
        console.log(chalk.gray(`Labels: ${issue.labels.map(l => l.name).join(', ')}`))
        console.log(chalk.gray(`Comments: ${issue.commentsCount}`))
        console.log('---')
      })
    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

program
  .command('repos')
  .description('Fetch repositories from GitHub organizations')
  .option('-o, --orgs <orgs...>', 'List of GitHub organizations to fetch repositories from')
  .option('-r, --repos <repos...>', 'List of specific GitHub repositories to fetch (format: owner/repo)')
  .option('-s, --since <date>', 'Fetch repositories since date (YYYY-MM-DD)', moment().subtract(1, 'year').format('YYYY-MM-DD'))
  .option('-t, --token <token>', 'GitHub API token (defaults to GITHUB_TOKEN env variable)')
  .option('-j, --json <path>', 'Export results to JSON file')
  .action(async (options) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN
      if (!token) {
        console.error(chalk.red('Error: GitHub token is required. Set GITHUB_TOKEN environment variable or use --token option'))
        process.exit(1)
      }

      if (!options.orgs?.length && !options.repos?.length) {
        console.error(chalk.red('Error: At least one organization (-o) or repository (-r) must be specified'))
        process.exit(1)
      }

      const github = new GitHubService(token)
      const since = moment(options.since)
      const repos = await github.getRepos(options.orgs, options.repos, since)

      // Export to JSON if path is provided
      if (options.json) {
        const jsonPath = path.resolve(options.json)
        const jsonData = {
          metadata: {
            timestamp: new Date().toISOString(),
            query: {
              orgs: options.orgs,
              repos: options.repos,
              since: options.since
            }
          },
          repositories: repos
        }
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2))
        console.log(chalk.green(`\nExported ${repos.length} repositories to ${jsonPath}`))
      }

      console.log(chalk.green(`\nFound ${repos.length} repositories:\n`))
      
      repos.forEach((repo) => {
        console.log(chalk.blue(`[${repo.nameWithOwner}]`))
        console.log(chalk.yellow(`Description: ${repo.description || 'No description'}`))
        console.log(chalk.cyan(`URL: ${repo.url}`))
        console.log(chalk.gray(`Stars: ${repo.stargazerCount}`))
        console.log(chalk.gray(`Forks: ${repo.forkCount}`))
        console.log(chalk.gray(`Language: ${repo.primaryLanguage?.name || 'Unknown'}`))
        console.log('---')
      })
    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

program.parse() 