# LinkedIn Post Scraper — Apify Actor Documentation

**Actor ID:** `Wpp1BZ6yGWjySadk3`
**Actor Name:** `supreme_coder/linkedin-post`
**Crafted by:** Supreme Coder
**Latest Build:** 1.1.25
**Pricing:** Pay per event — $0.001 per post scraped + $0.002 startup per run
**Permissions:** Limited permissions
**Categories:** Social Media, Lead Generation, Automation
**Source:** https://apify.com/supreme_coder/linkedin-post

---

## Overview

Scrapes LinkedIn posts in real time to extract post content and structured metadata from user profiles, company pages, search results, and individual post URLs. Operates **without requiring authentication cookies** — no risk to your LinkedIn account.

### What It Scrapes
- LinkedIn **user profile** posts
- LinkedIn **company page** posts
- LinkedIn **post search results**
- **Individual post URLs**

### What It Returns
- Post text/content
- Author and company metadata
- Timestamps
- Engagement metrics (likes, comments, shares)
- Comment information
- Linked media and attachments

### Use Cases
- Generate hyper-personalized cold emails based on a user's posts
- Find posts related to your niche and generate leads
- Monitor competitor or industry content
- Track engagement on specific topics/hashtags

---

## Actor Metrics

| Metric | Value |
|--------|-------|
| Total users | 8,800+ |
| Monthly active users | 2,100+ |
| Total runs (all time) | 4,100,000+ |
| 30-day success rate | 99.9% |
| Rating | 4.9 / 5 (35 reviews) |
| Bookmarks | 406 |
| Issue response | 1.3 days |
| Created | February 2025 |
| Last modified | March 18, 2026 |

---

## Pricing

**Pay-per-event model:**

| Component | Cost |
|-----------|------|
| Startup fee (per run) | $0.002 per GB |
| Per post scraped | $0.001 |
| Effective rate | ~$1 per 1,000 posts |
| Minimum charge per run | $0.002 |

---

## Complete Input Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `urls` | string[] | **Yes** (min 1) | — | Source URLs to scrape. Supports: LinkedIn post search URLs, user/company profile URLs, individual post URLs |
| `limitPerSource` | integer | No | unlimited | Limit number of posts scraped per source URL. Set to `0` to scrape all available posts |
| `scrapeUntil` | string | No | — | Only scrape posts newer than this date (date string) |
| `deepScrape` | boolean | No | `true` | Get additional information such as likes, comments, etc. |
| `rawData` | boolean | No | `false` | Push raw scraped data directly to dataset without processing/filtering. Useful for finding missing data |

### Example Input

```json
{
  "urls": [
    "https://www.linkedin.com/in/some-user-profile/",
    "https://www.linkedin.com/company/some-company/",
    "https://www.linkedin.com/search/results/content/?keywords=CPA%20accounting",
    "https://www.linkedin.com/posts/some-post-id"
  ],
  "limitPerSource": 50,
  "deepScrape": true,
  "rawData": false
}
```

### Supported URL Types

| URL Type | Example | Description |
|----------|---------|-------------|
| User profile | `https://www.linkedin.com/in/username/` | Scrapes posts from a specific user's profile |
| Company page | `https://www.linkedin.com/company/company-name/` | Scrapes posts from a company page |
| Post search | `https://www.linkedin.com/search/results/content/?keywords=...` | Scrapes posts from LinkedIn search results |
| Individual post | `https://www.linkedin.com/posts/...` or `https://www.linkedin.com/feed/update/urn:li:activity:...` | Scrapes a single specific post |

---

## Output Schema

> **Note:** This actor does not have a formally published dataset schema. The fields below are based on the actor's documentation and typical output structure.

### Output Fields (with `deepScrape: true`)

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Full text content of the post |
| `postUrl` | string | Direct URL to the LinkedIn post |
| `authorName` | string | Name of the post author |
| `authorProfileUrl` | string | LinkedIn profile URL of the author |
| `authorHeadline` | string | Author's LinkedIn headline/title |
| `authorProfilePicture` | string | URL to author's profile picture |
| `companyName` | string | Company name (if company post or author's company) |
| `companyUrl` | string | Company LinkedIn page URL |
| `postedAt` | string | Timestamp when the post was published |
| `numLikes` | integer | Number of likes/reactions |
| `numComments` | integer | Number of comments |
| `numShares` | integer | Number of shares/reposts |
| `comments` | array | Comment data (when deepScrape enabled) |
| `images` | array | Image URLs attached to the post (highest resolution) |
| `videoUrl` | string | Video URL if post contains video |
| `articleUrl` | string | URL of linked article if post shares an article |
| `hashtags` | array | Hashtags used in the post |
| `type` | string | Post type (text, image, video, article, etc.) |

### Example Output

```json
{
  "text": "Excited to announce our firm just completed another successful tax season! Our team of 12 CPAs processed over 2,000 returns...",
  "postUrl": "https://www.linkedin.com/posts/john-smith-cpa_taxseason-accounting-activity-1234567890",
  "authorName": "John Smith, CPA",
  "authorProfileUrl": "https://www.linkedin.com/in/john-smith-cpa/",
  "authorHeadline": "Managing Partner at Smith & Associates CPAs",
  "companyName": "Smith & Associates CPAs",
  "companyUrl": "https://www.linkedin.com/company/smith-associates-cpas/",
  "postedAt": "2026-03-15T14:30:00.000Z",
  "numLikes": 47,
  "numComments": 12,
  "numShares": 3,
  "images": ["https://media.licdn.com/..."],
  "hashtags": ["#taxseason", "#accounting", "#CPA"]
}
```

---

## Performance & Technical Specs

| Spec | Value |
|------|-------|
| Default timeout | 3,600 seconds (1 hour) |
| Memory | 512 MB |
| Scraping speed | Fast (real-time data) |
| Authentication | None required (no cookies) |
| Account risk | None |
| Duplicate handling | Built-in dedup (fixed Feb 2025) |
| Image quality | Highest resolution available (added March 2026) |

---

## Changelog

### March 18, 2026
- Fix: Not scraping all company posts
- New: Get highest resolution images from posts
- Ability to set 0 as limit per source to scrape all available posts
- Fix small bugs

### December 12, 2025
- Increase scraping speed
- Fix issues

### February 21, 2025
- Fix duplicate records

---

## API Integration

### Start a Run

```
POST https://api.apify.com/v2/acts/supreme_coder~linkedin-post/runs?token={API_TOKEN}
Content-Type: application/json

{
  "urls": ["https://www.linkedin.com/in/target-user/"],
  "limitPerSource": 50,
  "deepScrape": true
}
```

### Get Results

```
GET https://api.apify.com/v2/datasets/{datasetId}/items?format=json&token={API_TOKEN}
```

### Default Run Options

```json
{
  "build": "latest",
  "timeoutSecs": 3600,
  "memoryMbytes": 512
}
```

### Export Formats
- JSON
- CSV
- Excel (XLSX)
- XML
- RSS

---

## Nexli Use Case: Scraping CPA Firm Decision-Maker Posts

### Strategy
Use the LinkedIn Post Scraper to find and analyze posts from CPA firm owners/partners to:
1. **Identify active prospects** — CPA firm owners who post regularly are more digitally engaged
2. **Personalize outreach** — Reference their recent posts in cold emails for higher response rates
3. **Find pain points** — Posts about staffing, technology, growth reveal buying signals
4. **Monitor industry trends** — Track what CPA firms are talking about

### Example: Scrape Posts from CPA Industry Searches

```json
{
  "urls": [
    "https://www.linkedin.com/search/results/content/?keywords=CPA%20firm%20owner",
    "https://www.linkedin.com/search/results/content/?keywords=accounting%20firm%20growth",
    "https://www.linkedin.com/search/results/content/?keywords=CPA%20technology%20automation",
    "https://www.linkedin.com/search/results/content/?keywords=tax%20season%20staffing%20CPA"
  ],
  "limitPerSource": 100,
  "deepScrape": true,
  "rawData": false
}
```

### Example: Scrape Specific CPA Firm Leader Profiles

```json
{
  "urls": [
    "https://www.linkedin.com/in/cpa-firm-owner-1/",
    "https://www.linkedin.com/in/cpa-firm-owner-2/",
    "https://www.linkedin.com/in/cpa-firm-owner-3/"
  ],
  "limitPerSource": 20,
  "deepScrape": true,
  "scrapeUntil": "2026-01-01"
}
```

### Workflow: Leads Scraper + LinkedIn Post Scraper

1. **Step 1:** Use the [Leads Scraper](./leads-scraper-apify-actor.md) to extract CPA firm contacts (names, emails, LinkedIn URLs)
2. **Step 2:** Take the `linkedinUrl` field from leads scraper output
3. **Step 3:** Feed those LinkedIn profile URLs into this LinkedIn Post Scraper
4. **Step 4:** Analyze recent posts for personalization hooks
5. **Step 5:** Generate hyper-personalized outreach emails referencing their recent posts

This creates a powerful pipeline: **find CPA firms → get their LinkedIn profiles → scrape their posts → personalize outreach at scale.**
