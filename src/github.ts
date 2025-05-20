import moment from 'moment'
import * as dotenv from 'dotenv'
import fetch from 'cross-fetch'
import { Issue, Repository } from './types'

dotenv.config()

if (!process.env.GITHUB_TOKEN) {
  throw new Error('Github API Token not set.')
}

const cache = new Map()
const defaultSince = moment().subtract(1, 'year')

export class GitHubService {
  private token: string
  private cache: Map<string, any>

  constructor(token: string) {
    this.token = token
    this.cache = new Map()
  }

  private buildSearchQuery(orgs: string[] = [], repos: string[] = []): string {
    const orgQuery = orgs.length > 0 ? `org:${orgs.join(' org:')}` : ''
    const repoQuery = repos.length > 0 ? `repo:${repos.join(' repo:')}` : ''
    return [orgQuery, repoQuery].filter(Boolean).join(' ')
  }

  async getRepos(orgs: string[] = [], repos: string[] = [], since: moment.Moment = defaultSince): Promise<Repository[]> {
    const cacheKey = `issues.GetRepos-since:${since.format('YYYY-MM-DD')}-orgs:${orgs.join(',')}-repos:${repos.join(',')}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const searchQuery = this.buildSearchQuery(orgs, repos)
    let reposList: Repository[] = []
    let cursor: string | undefined = ''

    while (cursor !== undefined) {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{
            search(
              first: 5, 
              ${cursor}
              query: "${searchQuery} is:public archived:false good-first-issues:>0 stars:>10 pushed:>${since.format('YYYY-MM-DD')} sort:created",
              type: REPOSITORY
            ) {
              repositoryCount
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              nodes {
                ... on Repository {
                  id
                  name
                  nameWithOwner
                  description
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                    color
                  }
                  url
                  createdAt
                  updatedAt
                  pushedAt
                  owner {
                    id
                    login
                    avatarUrl
                    url
                  }
                }
              }
            }
          }`,
        }),
      })

      const body: any = await response.json()
      reposList.push(
        ...body.data.search.nodes
          .filter((i: any) => !!i.id)
          .map((i: any) => ({
            ...i,
            createdAt: new Date(i.createdAt).getTime(),
            updatedAt: new Date(i.updatedAt).getTime(),
            pushedAt: new Date(i.pushedAt).getTime(),
          }))
      )

      if (body.data.search.pageInfo.hasNextPage) {
        cursor = `after: "${body.data.search.pageInfo.endCursor}"`
      } else {
        cursor = undefined
      }
    }

    this.cache.set(cacheKey, reposList)
    return reposList
  }

  async getIssues(orgs: string[] = [], repos: string[] = [], labels: string[] = [], since: moment.Moment = defaultSince): Promise<Issue[]> {
    const cacheKey = `issues.GetIssues-since:${since.toISOString()}-orgs:${orgs.join(',')}-repos:${repos.join(',')}-labels:${labels.join(',')}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const searchQuery = this.buildSearchQuery(orgs, repos)
    const labelString = labels.length > 0 ? `label:\\"${labels.join('\\",\\"')}\\"` : ''
    let issues: Issue[] = []
    let cursor: string | undefined = ''

    while (cursor !== undefined) {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{
            search(
              first: 100, 
              ${cursor}
              query: "${searchQuery} is:open is:issue ${labelString} created:>${since.toISOString()} sort:created",
              type: ISSUE
            ) {
              issueCount
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              nodes {
                ... on Issue {
                  id
                  number
                  title
                  body
                  url
                  createdAt
                  updatedAt
                  author {
                    ... on User {
                      id
                      login
                      avatarUrl
                      url
                    }
                  }
                  comments {
                    totalCount
                  }
                  labels(first: 20) {
                    totalCount
                    nodes {
                      name
                      color
                    }
                  }
                  repository {
                    ... on Repository {
                      id
                      name
                      nameWithOwner
                      description
                      stargazerCount
                      forkCount
                      primaryLanguage {
                        name
                        color
                      }
                      url
                      createdAt
                      updatedAt
                      pushedAt
                      owner {
                        id
                        login
                        avatarUrl
                        url
                      }
                    }
                  }
                }
              }
            }
          }`,
        }),
      })

      const body: any = await response.json()
      issues.push(
        ...body.data.search.nodes
          .filter((i: any) => !!i.id)
          .map((i: any) => ({
            ...i,
            commentsCount: i.comments.totalCount,
            labels: i.labels?.nodes
              ? i.labels.nodes.map((l: any) => ({
                  name: l.name,
                  color: l.color,
                }))
              : [],
            author: i.author
              ? i.author
              : {
                  id: 'ghost',
                  login: 'Deleted user',
                  avatarUrl: 'https://avatars.githubusercontent.com/u/10137?v=4',
                  url: 'https://github.com/ghost',
                },
            repository: {
              ...i.repository,
            },
            createdAt: new Date(i.createdAt).getTime(),
            updatedAt: new Date(i.updatedAt).getTime(),
          }))
      )

      if (body.data.search.pageInfo.hasNextPage) {
        cursor = `after: "${body.data.search.pageInfo.endCursor}"`
      } else {
        cursor = undefined
      }
    }

    this.cache.set(cacheKey, issues)
    return issues
  }
} 