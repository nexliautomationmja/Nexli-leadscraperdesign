# Leads Scraper — Complete Replication Reference for Nexli

**Source Actor:** `pipelinelabs/lead-scraper-apollo-zoominfo-lusha`
**Actor ID:** `VYRyEF4ygTTkaIghe`
**Crafted by:** Pipeline Labs
**Latest Build:** 1.4.48 (Feb 17, 2026)
**Pricing Model:** Flat $29.99/month (Apify margin: 20%)
**Runtime Default:** Timeout 86,400s, Memory 512 MB
**Source Code:** Hidden (proprietary)
**Lead Viewer URL:** https://pipelinelabs-dos.pages.dev/
**Support Email:** contactpipelinelabs@gmail.com

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Data Source & Coverage](#data-source--coverage)
3. [Performance Benchmarks](#performance-benchmarks)
4. [Complete Input Schema](#complete-input-schema)
5. [All Enum Values (Dropdowns)](#all-enum-values-dropdowns)
6. [Output Schema](#output-schema)
7. [Auto-Resume & Deduplication Logic](#auto-resume--deduplication-logic)
8. [API Integration](#api-integration)
9. [Pricing Model](#pricing-model)
10. [Replication Notes for Nexli](#replication-notes-for-nexli)

---

## Overview & Architecture

A B2B contact extraction system that queries a large, regularly enriched professional database (~90M+ records) to produce targeted lead lists. It performs filtered searches across person and company attributes and returns contact-level data with company metadata.

### Core Capabilities
- **Max extraction:** 50,000 contacts per run
- **Automatic resume:** Stops/resumes without duplicates across runs
- **Deduplication:** Progress tracked per search definition — zero duplicates across sequential runs
- **Quality filters:** Verified email toggle, required-contact toggles
- **Weekly enrichment:** Database refreshed/enriched weekly
- **Batch processing:** Supports breaking large result sets (e.g., 190k) into multiple 50k runs

### How It Works
1. User defines filters (person attributes + company attributes + quality filters)
2. Actor queries the professional database with those filters
3. Results paginated and extracted up to `totalResults` limit
4. Progress saved per search definition hash — subsequent runs resume from last position
5. Results stored in Apify dataset, exportable as CSV/JSON/Excel

---

## Data Source & Coverage

| Metric | Value |
|--------|-------|
| Total records | 90M+ professional records (global) |
| Refresh frequency | Weekly enrichment |
| LinkedIn URL coverage | ~95%+ |
| Email coverage (US) | ~76% verified |
| Email coverage (global) | ~65% |
| Phone coverage | ~10% (improving weekly) |
| Email verification | Each record includes `emailStatus` field |

---

## Performance Benchmarks

| Leads | Approximate Time |
|-------|-----------------|
| 1,000 | ~2 minutes |
| 10,000 | ~20 minutes |
| 50,000 | ~100 minutes |

- For max runs (50k), set timeout >= 120,000s (33h)
- Memory: 512 MB default
- Success rate: >99% (30,849 succeeded out of 31,018 in 30 days)

---

## Complete Input Schema

### General Settings

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `totalResults` | integer | `10000` | max: 50000 | Maximum number of leads to extract per run |

### Email & Phone Filters (Section: "Email status")

| Field | Type | Default | Options | Description |
|-------|------|---------|---------|-------------|
| `emailStatus` | string | — | `verified`, `unverified` | `verified` = verified only. `unverified` = guessed/extrapolated/bounced/unknown |
| `hasEmail` | boolean | — | true/false | Require records with an email address |
| `hasPhone` | boolean | — | true/false | Require records with a phone number |

### Person Role Filters (Section: "Job titles")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `personTitleIncludes` | string[] | — | 500 curated options | Pick from curated titles list (see enum below) |
| `includeSimilarTitles` | boolean | `false` | — | Expand to known variants/aliases of selected titles |
| `personTitleExcludes` | string[] | — | 500 curated options | Titles to exclude. Excludes override Includes |
| `personTitleExtraIncludes` | string[] | — | max 200 items, free text | Add niche/rare titles not in the dropdown |
| `seniorityIncludes` | string[] | — | 11 options | Seniority levels to include |
| `seniorityExcludes` | string[] | — | 11 options | Seniority levels to exclude |
| `personFunctionIncludes` | string[] | — | 20 options | Departments/functions to include |
| `personFunctionExcludes` | string[] | — | 20 options | Departments/functions to exclude |
| `personFirstNameIncludes` | string[] | — | max 50 items, free text | Words/phrases to include in first name |
| `personFirstNameExcludes` | string[] | — | max 50 items, free text | Words/phrases to exclude from first name |
| `personLastNameIncludes` | string[] | — | max 50 items, free text | Words/phrases to include in last name |
| `personLastNameExcludes` | string[] | — | max 50 items, free text | Words/phrases to exclude from last name |

### Person Location Filters (Section: "Location — Person")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `personLocationCountryIncludes` | string[] | — | 237 countries | Countries to include (person location) |
| `personLocationCountryExcludes` | string[] | — | 247 countries | Countries to exclude (person location) |
| `personLocationStateIncludes` | string[] | — | 494 states/regions | States/regions to include (person location) |
| `personLocationStateExcludes` | string[] | — | 494 states/regions | States/regions to exclude (person location) |
| `personLocationCityIncludes` | string[] | — | max 200 items, free text | Cities to include |
| `personLocationCityExcludes` | string[] | — | max 200 items, free text | Cities to exclude |

### Company Name Filters (Section: "Company")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `companyNameIncludes` | string[] | — | max 10,000 items, free text | Company names to include (normalized) |
| `companyNameExcludes` | string[] | — | max 10,000 items, free text | Company names to exclude (normalized) |
| `companyNameMatchMode` | string | `phrase` | `exact`, `phrase` | `exact` = exact name; `phrase` = near-exact phrase match |

### Company Location Filters (Section: "Location — Company")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `companyLocationCountryIncludes` | string[] | — | 237 countries | Countries to include (company HQ) |
| `companyLocationCountryExcludes` | string[] | — | 237 countries | Countries to exclude (company HQ) |
| `companyLocationStateIncludes` | string[] | — | 491 states/regions | States/regions to include (company HQ) |
| `companyLocationStateExcludes` | string[] | — | 491 states/regions | States/regions to exclude (company HQ) |
| `companyLocationCityIncludes` | string[] | — | max 200 items, free text | Cities to include |
| `companyLocationCityExcludes` | string[] | — | max 200 items, free text | Cities to exclude |

### Company Domain Filters (Section: "Company — Domains")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `companyDomainMatchMode` | string | `contains` | `strict`, `contains` | `strict` = exact domain; `contains` = substring match |
| `companyDomainIncludes` | string[] | — | max 10,000 items, free text | Domains to include (auto-normalized) |
| `companyDomainExcludes` | string[] | — | max 10,000 items, free text | Domains to exclude |

### Company Size Filters (Section: "Number of Employees")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `companyEmployeeSizeIncludes` | string[] | — | 12 buckets | Employee size ranges to include |

### Company Industry & Keyword Filters (Section: "Industry & Keywords")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `companyIndustryIncludes` | string[] | — | 148 industries | Industries to include |
| `companyIndustryExcludes` | string[] | — | 148 industries | Industries to exclude |
| `companyKeywordIncludes` | string[] | — | max 50 items, free text | Keywords to include (searches company name/description/specialties) |
| `companyKeywordExcludes` | string[] | — | max 50 items, free text | Keywords to exclude |

### Progress & Advanced (Section: "Saved Progress")

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `resetSavedProgress` | boolean | — | — | Delete saved progress. Start fresh for this search definition |
| `customOffset` | integer | — | min: 0 | Manual starting offset. Leave empty to use saved progress |

### Additional UI Sections (Placeholder — No Fields Currently)

- `techSection` — Technology filters (reserved/empty)
- `revenueSection` — Revenue filters (reserved/empty)
- `fundingSection` — Funding filters (reserved/empty)

---

## All Enum Values (Dropdowns)

### Email Status (2 options)
```
verified
unverified
```

### Seniority Levels (11 options)
```
Entry
Senior
Manager
Director
VP
C-Suite
Owner
Head
Founder
Partner
Intern
```

### Departments / Job Functions (20 options)
```
Accounting
Administrative
Arts & Design
Business Development
Consulting
Data Science
Education
Engineering
Entrepreneurship
Finance
Human Resources
Information Technology
Legal
Marketing
Media & Communications
Operations
Product Management
Research
Sales
Support
```

### Company Employee Size Buckets (12 options)
```
Unknown
1-10
11-20
21-50
51-100
101-200
201-500
501-1000
1001-2000
2001-5000
5001-10000
10001+
```

### Company Name Match Mode (2 options)
```
exact
phrase
```

### Company Domain Match Mode (2 options)
```
strict
contains
```

### Industries (148 options)
```
Accounting
Agriculture
Airlines/Aviation
Alternative Dispute Resolution
Animation
Apparel & Fashion
Architecture & Planning
Arts & Crafts
Automotive
Aviation & Aerospace
Banking
Biotechnology
Broadcast Media
Building Materials
Business Supplies & Equipment
Capital Markets
Chemicals
Civic & Social Organization
Civil Engineering
Commercial Real Estate
Computer & Network Security
Computer Games
Computer Hardware
Computer Networking
Computer Software
Construction
Consumer Electronics
Consumer Goods
Consumer Services
Cosmetics
Dairy
Defense & Space
Design
E-Learning
Education Management
Electrical/Electronic Manufacturing
Entertainment
Environmental Services
Events Services
Executive Office
Facilities Services
Farming
Financial Services
Fine Art
Food & Beverages
Food Production
Fundraising
Furniture
Gambling & Casinos
Glass, Ceramics & Concrete
Government Administration
Government Relations
Graphic Design
Health, Wellness & Fitness
Higher Education
Hospital & Health Care
Hospitality
Human Resources
Import & Export
Individual & Family Services
Industrial Automation
Information Services
Information Technology & Services
Insurance
International Affairs
International Trade & Development
Internet
Investment Banking
Investment Management
Judiciary
Law Enforcement
Law Practice
Legal Services
Legislative Office
Leisure, Travel & Tourism
Libraries
Logistics & Supply Chain
Luxury Goods & Jewelry
Machinery
Management Consulting
Maritime
Market Research
Marketing & Advertising
Mechanical or Industrial Engineering
Media Production
Medical Devices
Medical Practice
Mental Health Care
Military
Mining & Metals
Motion Pictures & Film
Museums & Institutions
Music
Nanotechnology
Newspapers
Non-Profit Organization Management
Non-Profits & Non-Profit Services
Oil & Energy
Online Media
Outsourcing/Offshoring
Package/Freight Delivery
Packaging & Containers
Paper & Forest Products
Performing Arts
Pharmaceuticals
Philanthropy
Photography
Plastics
Political Organization
Primary/Secondary Education
Printing
Professional Training & Coaching
Program Development
Public Policy
Public Relations & Communications
Public Safety
Publishing
Railroad Manufacture
Ranching
Real Estate
Recreation & Sports
Recreational Facilities & Services
Religious Institutions
Renewables & Environment
Research
Restaurants
Retail
Security & Investigations
Semiconductors
Shipbuilding
Sporting Goods
Sports
Staffing & Recruiting
Supermarkets
Telecommunications
Textiles
Think Tanks
Tobacco
Translation & Localization
Transportation/Trucking/Railroad
Utilities
Venture Capital & Private Equity
Veterinary
Warehousing
Wholesale
Wine & Spirits
Wireless
Writing & Editing
```

### Job Titles — Curated List (500 options)
```
Director
Manager
Founder
General Manager
Consultant
Chief Executive Officer
Co-Founder
Account Manager
Chief Financial Officer
Human Resources Manager
Director Of Marketing
Executive Director
Executive Assistant
Administrative Assistant
Director Of Human Resources
Associate
Chief Operating Officer
HR Manager
Account Executive
Business Development Manager
Director Of Operations
Controller
Chief Technology Officer
Chief Information Officer
Founder & CEO
Attorney
IT Manager
Assistant Manager
Engineer
Business Analyst
Accountant
Chief Marketing Officer
Creative Director
Director Of Sales
Graphic Designer
Analyst
Human Resources Director
Founder And CEO
Director, Information Technology
Digital Marketing Manager
Business Owner
Assistant Professor
Branch Manager
HR Director
Administrator
Customer Service Representative
HR Business Partner
Co Founder
Designer
Intern
Lecturer
Architect
Director Of Information Technology
Information Technology Manager
Co-Founder & CEO
Co-Owner
Director, Human Resources
Business Development
IT Director
Associate Professor
Finance Manager
Director Of Business Development
Developer
Business Manager
Director Of Engineering
Human Resources
Manager, Information Technology
Customer Service
Key Account Manager
Executive Vice President
Financial Analyst
HR Generalist
Financial Advisor
Instructor
Engineering Manager
Art Director
Director Of Sales And Marketing
Area Manager
CEO & Founder
Director Of Finance
Data Analyst
Associate Director
Accounting Manager
Docente
Customer Service Manager
IT Specialist
Account Director
Data Scientist
District Manager
Human Resources Business Partner
Co-Founder And CEO
Assistant Principal
Information Technology Director
Facilities Manager
Director Human Resources
Exec/Management (Other)
Area Sales Manager
Director, Sales
Head Of Sales
Director, Operations
Commissioner
Registrar
Marketing Coordinator
Full Stack Engineer
Professor
District Director
Financial Controller
Broker
Human Resource Manager
Adjunct Professor
Founder, CEO
Customer Success Manager
Artist
Chairman
Graduate Student
CEO And Founder
Director Of IT
Educator
Founder/CEO
IT Consultant
HR Coordinator
Co Owner
Lawyer
Chief Human Resources Officer
Dentist
Editor
Legal Assistant
Director Of Technology
Interior Designer
Chief Operations Officer
Business Development Executive
HR Specialist
Devops
Community Manager
Civil Engineer
Attorney At Law
Associate Consultant
CEO And Co-Founder
Electrician
General Counsel
District Sales Manager
Director Of Product Management
Assistant
Driver
Auditor
Director, Marketing
Business Consultant
Assistant Vice President
Digital Marketing Specialist
Deputy Manager
Human Resources Coordinator
English Teacher
Board Member
IT Analyst
Insurance Agent
Founding Partner
Event Manager
Director Of Development
Co-Founder & CTO
Auxiliar Administrativo
Chief Engineer
Communications Manager
Construction Manager
Coordinator
Director Of Communications
Estimator
Corporate Recruiter
Business Development Director
Enterprise Architect
Case Manager
Bookkeeper
Chief Revenue Officer
Analista
Assistente Administrativo
Bartender
Advisor
Development Manager
Co-Founder, CEO
Human Resources Specialist
Broker Associate
Doctor
Assistant Director
Consultor
CTO/Cio
Event Coordinator
Chef
Chief Product Officer
Director Of Digital Marketing
Application Developer
HR Assistant
HR Executive
Directeur
Executive Administrative Assistant
Captain
Licensed Realtor
Business Development Representative
Associate Broker
Director Of Sales & Marketing
Commercial Manager
HR Consultant
Management Trainee
Finance
Flight Attendant
Lead Engineer
Director Of Marketing And Communications
Manager, Human Resources
Assistant Project Manager
Application Engineer
Logistics Manager
Head Of Marketing
IT Manager/Director
CEO/Founder
Director, Information Technology (IT)
Customer Support
Director Of Quality
Credit Analyst
Director - Sales
Managing Broker
Academic Advisor
Estagiario
Entrepreneur
Chief Information Security Officer
Deputy General Manager
CTO & Co-Founder
Attorney/Owner
IT Project Manager
Deputy Head
Assistant Controller
Customer Service Agent
Assistant Operations Manager
CTO And Co-Founder
Managing Attorney
Finance Director
Director Of Strategy
Development Engineer
Quality Manager
Quality Assurance Manager
Contador
Head Of Engineering
Head Of Design
Assistant General Manager
Vice President, Sales
IT Engineer
Co-Founder And CTO
Broker/Owner
Advogado
Field Engineer
Maintenance Manager
Clerk
Field Service Engineer
Cofounder
Human Resources Assistant
Executive Chef
IT Administrator
General Sales Manager
Director, Business Development
Franchise Owner
Customer Service Supervisor
Adjunct Faculty
Benefits Manager
Inside Sales
Abogado
Java Developer
Head Of Product
Management Consultant
Contracts Manager
Freelance Writer
CEO/President/Owner
Journalist
Associate Software Engineer
Head Of HR
Internal Auditor
Head Of Information Technology
Founder & President
Accounting
Freelancer
Front Office Manager
Entrepreneur
HR Administrator
Graduate Teaching Assistant
Director Of Sales Operations
Diretor
Data Engineer
Librarian
Facility Manager
Administration
IT Architect
Legal Counsel
Maintenance Supervisor
Head Of Operations
Founder / CEO
Chief Strategy Officer
Communications Director
Development Director
Chef De Cuisine
Director, Human Resources (HR)
Inside Sales Representative
Assistant Superintendent
Executive Manager
Head Of Finance
Head of Digital
Detective
Automation Engineer
Investigator
Directeur General
Full Stack Web Developer
Lecturer In Law
Marketing Executive
Head Of Human Resources
Brand Ambassador
Copywriter
Chairman & CEO
Email Marketing Manager
Frontend Developer
Human Resource Director
Client Services Manager
IT Support Specialist
Contract Manager
Impiegato
CEO, Founder
Chief Medical Officer
Banker
Director Information Technology
Director Of Product
Director, Product Management
Country Manager
Financial Consultant
Administrador
Executive Assistant To CEO
Advogada
Field Marketing Manager
Business Intelligence Analyst
Director Marketing
Loan Officer
Freelance Photographer
Actor
Chef De Projet
Foreman
Information Technology Project Manager
Graduate Assistant
Inside Sales Manager
Department Manager
HR Officer
Account Coordinator
Deputy Director
Director Of Facilities
Executive Recruiter
IT Technician
CEO, Co-Founder
Full Stack Developer
CEO / Founder
Counsel
Logistics Coordinator
Founder And Chief Executive Officer
Chairman And CEO
Administrative Coordinator
Associate Dentist
Co-Founder/CEO
Head Of Marketing And Communications
Investment Analyst
Communications Specialist
Director, Product Marketing
Client Manager
Compliance Officer
Executive Producer
Customer Service Specialist
Certified Personal Trainer
Human Resources Executive
Chief Executive
HR Advisor
Compliance Manager
Head Of IT
IT Business Analyst
Homemaker
Events Manager
Fleet Manager
CEO & President
Carpenter
HR Recruiter
Director, Digital Marketing
Laboratory Technician
Associate Product Manager
Director Product Management
Independent Contractor
Accounts Payable
Digital Marketing Director
Instructional Designer
Digital Project Manager
Audit Manager
Estudante
Credit Manager
Eigenaar
Business Developer
Head Of Business Development
Avvocato
Chief Administrative Officer
Asset Manager
Accounts Payable Specialist
Chief Compliance Officer
Empleado
Digital Marketing Executive
Account Representative
Campaign Manager
Director, Engineering
Engagement Manager
Management
Delivery Manager
```

### Countries (237 options)
```
United States
United Kingdom
India
France
Canada
Netherlands
Brazil
Australia
Germany
Spain
Italy
Switzerland
Sweden
South Africa
Denmark
Belgium
Mexico
Turkey
United Arab Emirates
Ireland
Chile
Argentina
China
Norway
Finland
Indonesia
Singapore
Peru
Japan
Colombia
New Zealand
Poland
Saudi Arabia
Portugal
Philippines
Malaysia
Pakistan
Israel
Austria
Russia
Hong Kong
Egypt
Czech Republic
Romania
Nigeria
Greece
Taiwan
Luxembourg
Thailand
South Korea
Kenya
Ukraine
Hungary
Bangladesh
Venezuela
Iran
Qatar
Republic of Indonesia
Croatia
Lebanon
Vietnam
Sri Lanka
Ecuador
Uruguay
Bulgaria
Serbia
Morocco
Lithuania
Jordan
Slovakia
Kuwait
Czechia
Slovenia
Costa Rica
Algeria
Latvia
Syria
Puerto Rico
Dominican Republic
Oman
Estonia
Ghana
Panama
Bahrain
Cyprus
Tunisia
Guatemala
Uganda
Iceland
Kazakhstan
Zimbabwe
Jamaica
Malta
Macedonia (FYROM)
Trinidad and Tobago
Mauritius
Tanzania
Nepal
Azerbaijan
Georgia
Bolivia
Paraguay
Cambodia
El Salvador
Liechtenstein
Angola
Ethiopia
Albania
Bosnia and Herzegovina
Guernsey
Botswana
Iraq
Cote d'Ivoire
Armenia
Zambia
Papua New Guinea
Belarus
Senegal
Afghanistan
Bermuda
Monaco
Honduras
Jersey
Nicaragua
Mozambique
Namibia
Cameroon
Isle of Man
Fiji
Malawi
Moldova
The Bahamas
Rwanda
Macau
Barbados
Sudan
Mongolia
Libya
Gibraltar
Cayman Islands
Democratic Republic of the Congo
Maldives
Curacao
Yemen
Myanmar (Burma)
Togo
Suriname
Andorra
Republic of the Union of Myanmar
Greenland
Uzbekistan
Cuba
Madagascar
Reunion
Faroe Islands
New Caledonia
Montenegro
French Polynesia
Brunei
Cape Verde
Belize
Trinidad & Tobago
Aruba
Vanuatu
U.S. Virgin Islands
Guam
Haiti
Aland Islands
Vatican City
Lesotho
Swaziland
San Marino
Bhutan
Cook Islands
Kyrgyzstan
Laos
Gabon
Seychelles
Guyana
Congo
Sierra Leone
Antigua and Barbuda
Saint Kitts and Nevis
Guadeloupe
Republic of the Congo
Liberia
The Gambia
Burkina Faso
Saint Lucia
Martinique
Grenada
Federated States of Micronesia
Saint Martin
Mali
Guinea
American Samoa
Benin
Turks and Caicos Islands
Niger
Burundi
Mauritania
Northern Mariana Islands
Cocos (Keeling) Islands
Somalia
British Virgin Islands
Samoa
Saint Vincent and the Grenadines
Dominica
Anguilla
Timor-Leste
South Sudan
Equatorial Guinea
Eritrea
Djibouti
Chad
Tajikistan
Micronesia
Solomon Islands
French Guiana
Sint Maarten
Marshall Islands
Svalbard and Jan Mayen
Central African Republic
Caribbean Netherlands
Kosovo
Saint Barthelemy
Turkmenistan
Palau
Tonga
Comoros
Tuvalu
Nauru
Kiribati
Western Sahara
Montserrat
Pitcairn Islands
Tokelau
```

### States/Regions (494 options — US states listed first, then global)

**US States:**
```
California, New York, Texas, Florida, Illinois, Pennsylvania, Massachusetts, Ohio, Georgia, North Carolina, Michigan, Washington, District of Columbia, Colorado, Minnesota, Missouri, Virginia, Arizona, Wisconsin, Tennessee, Indiana, Maryland, Oregon, New Jersey, South Carolina, Utah, Alabama, Louisiana, Connecticut, Kentucky, Iowa, Oklahoma, Nevada, Kansas, Nebraska, Arkansas, Mississippi, Idaho, Rhode Island, New Mexico, New Hampshire, West Virginia, Montana, North Dakota, Hawaii, South Dakota, Delaware, Vermont, Wyoming, Maine
```

**Major Global States/Regions (selection):**
```
England, Ontario, Maharashtra, Ile-de-France, Sao Paulo, Karnataka, Victoria, Tamil Nadu, Delhi, Federal Capital Territory, British Columbia, Queensland, Scotland, Alberta, Flanders, Noord-Holland, Stockholm County, Quebec, Beijing, North Rhine-Westphalia, Bavaria, Lombardia, Lisboa, Berlin, Shanghai Shi, New South Wales, South Australia, Western Australia, Auckland, Wellington, Tokyo, Moscow, Brussels, Vienna, Zurich, Geneva, Bucharest, Budapest, Istanbul, ...
```

*(Full list contains 494 states/regions/provinces from 100+ countries)*

---

## Output Schema

### Output JSON Structure

```json
{
  "fullName": "Michael Torres",
  "email": "mtorres@brightsummitgroup.com",
  "position": "Operations Manager",
  "phone": "+1-305-555-0193",
  "city": "Miami",
  "state": "Florida",
  "country": "United States",
  "linkedinUrl": "http://www.linkedin.com/in/michael-torres-8392b61a4",
  "seniority": "manager",
  "functional": "['operations']",
  "emailStatus": "Verified",
  "orgName": "Bright Summit Group",
  "orgWebsite": "http://www.brightsummitgroup.com",
  "orgSize": "120",
  "orgIndustry": "['logistics & supply chain']",
  "orgCity": "Orlando",
  "orgState": "Florida",
  "orgCountry": "United States"
}
```

### Output Fields — Complete Reference

| Field | Type | Coverage | Description |
|-------|------|----------|-------------|
| `fullName` | string | ~100% | Full name of the contact |
| `email` | string | ~76% US, ~65% global | Email address |
| `position` | string | ~100% | Job title / position |
| `phone` | string | ~10% | Phone number (E.164 format when available) |
| `city` | string | ~100% | Contact's city |
| `state` | string | ~100% | Contact's state/region |
| `country` | string | ~100% | Contact's country |
| `linkedinUrl` | string | ~95%+ | LinkedIn profile URL |
| `seniority` | string | ~100% | Seniority level (lowercase: entry, senior, manager, director, vp, c-suite, owner, head, founder, partner, intern) |
| `functional` | string | ~100% | Department/function as string-encoded array |
| `emailStatus` | string | ~100% | `Verified` or `Unverified` |
| `orgName` | string | ~100% | Company/organization name |
| `orgWebsite` | string | ~90%+ | Company website URL |
| `orgSize` | string | ~90%+ | Number of employees (as string) |
| `orgIndustry` | string | ~100% | Industry classification as string-encoded array |
| `orgCity` | string | ~100% | Company HQ city |
| `orgState` | string | ~100% | Company HQ state/region |
| `orgCountry` | string | ~100% | Company HQ country |

### Export Formats Supported
- JSON
- CSV
- Excel (XLSX)
- XML
- RSS

---

## Auto-Resume & Deduplication Logic

### How It Works
1. **Search definition hashing:** Each unique combination of filters creates a "search definition" fingerprint
2. **Progress tracking:** After each run, the actor saves the current offset (position in results)
3. **Resume on next run:** When the same filters are used again, the actor picks up from the saved offset
4. **Zero duplicates:** Because progress is tracked per search definition, no record is returned twice

### Controls
- `resetSavedProgress: true` — Clears saved progress, starts from the beginning
- `customOffset: <number>` — Override the saved progress with a manual starting offset

### Batch Strategy for Large Extractions
- Each run can extract up to 50,000 leads
- For 150k leads: run 3 sequential extractions with the same filters
- For 500k leads/month: run 10 extractions across the month
- Actor automatically handles pagination and position tracking

---

## API Integration

### Start a Run
```
POST https://api.apify.com/v2/acts/pipelinelabs~lead-scraper-apollo-zoominfo-lusha/runs?token={API_TOKEN}
Content-Type: application/json

{
  "totalResults": 10000,
  "emailStatus": "verified",
  "hasEmail": true,
  "seniorityIncludes": ["C-Suite", "VP", "Director"],
  "personFunctionIncludes": ["Finance", "Accounting"],
  "companyIndustryIncludes": ["Financial Services", "Accounting"],
  "companyLocationCountryIncludes": ["United States"],
  "companyEmployeeSizeIncludes": ["11-20", "21-50", "51-100"]
}
```

### Get Results
```
GET https://api.apify.com/v2/datasets/{datasetId}/items?format=json&token={API_TOKEN}
```

### Check Run Status
```
GET https://api.apify.com/v2/actor-runs/{runId}?token={API_TOKEN}
```

### Default Run Options
```json
{
  "build": "latest",
  "timeoutSecs": 86400,
  "memoryMbytes": 512,
  "maxItems": null,
  "maxTotalChargeUsd": null
}
```

---

## Pricing Model

### Free Trial
- 1,000 leads
- 2-hour runtime limit (120 minutes)

### Subscription — $29.99/month
- 500,000 leads per month
- 50,000 leads per run
- Unlimited runs (within monthly quota)
- Cancel anytime
- Apify takes 20% margin

### Actor Metrics (as of March 2026)
| Metric | Value |
|--------|-------|
| Total users | 7,220 |
| Monthly active users | 383 |
| Total runs (all time) | 77,881 |
| 30-day success rate | 99.5% |
| Rating | 3.27/5 (81 reviews) |
| Bookmarks | 211 |
| Average issue response | 15 hours |
| Created | October 2025 |

---

## Replication Notes for Nexli

### What You Need to Build

1. **Data Source / Database**
   - The actor queries a professional database of 90M+ contacts
   - Likely sources: Apollo.io API, ZoomInfo, or aggregated/scraped professional data
   - Data includes: person info, company info, LinkedIn URLs, emails, phones
   - Database is enriched/refreshed weekly
   - Email verification is run on records (Verified/Unverified status)

2. **Search/Filter Engine**
   - Must support all filter combinations (person attributes + company attributes)
   - Include/Exclude logic for every filter dimension
   - Keyword search across company name, description, specialties
   - Match modes: exact vs phrase for company names, strict vs contains for domains
   - "Similar titles" expansion (variant/alias mapping for job titles)

3. **Pagination & Progress Tracking**
   - Hash search definition to create unique identifier
   - Store offset per search hash (key-value store or database)
   - Resume from saved offset on subsequent runs
   - Deduplication is implicit via offset tracking

4. **Output Pipeline**
   - Stream results to dataset/storage
   - Support CSV, JSON, Excel export
   - Handle up to 50k records per run

5. **Rate Limiting & Quotas**
   - Track leads per user per month (500k limit at $29.99 tier)
   - Track leads per run (50k limit)
   - Runtime timeout handling

### Key Architecture Decisions
- **Memory:** Only needs 512 MB — this is a query-based actor, not a scraper
- **Timeout:** 86,400s (24h) default, but recommends 120,000s (33h) for large runs
- **Source code is hidden** — the actor is proprietary, so exact implementation is not visible
- **The "Lead Viewer" (https://pipelinelabs-dos.pages.dev/)** is a separate web app for previewing filter results before running the actor

### Input Schema JSON (for programmatic use)

```json
{
  "title": "Leads Scraper (Like Apollo) - Up to 50k Leads With EMAILS",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "totalResults": {
      "type": "integer",
      "description": "Maximum number of leads to extract (max 50000)",
      "default": 10000,
      "maximum": 50000
    },
    "emailStatus": {
      "type": "string",
      "description": "Verified = verified only. Unverified = guessed/extrapolated/bounced/unknown.",
      "enum": ["verified", "unverified"]
    },
    "hasEmail": {
      "type": "boolean",
      "description": "Require records with an email address."
    },
    "hasPhone": {
      "type": "boolean",
      "description": "Require records with a phone number."
    },
    "personTitleIncludes": {
      "type": "array",
      "description": "Pick from curated titles.",
      "items": { "type": "string", "enum": ["...500 titles..."] }
    },
    "includeSimilarTitles": {
      "type": "boolean",
      "description": "Expand to known variants/aliases of the selected titles.",
      "default": false
    },
    "personTitleExcludes": {
      "type": "array",
      "description": "Titles to exclude. Excludes override Includes.",
      "items": { "type": "string", "enum": ["...500 titles..."] }
    },
    "personTitleExtraIncludes": {
      "type": "array",
      "description": "Add niche/rare titles not in the dropdown.",
      "items": { "type": "string" },
      "maxItems": 200
    },
    "seniorityIncludes": {
      "type": "array",
      "items": { "type": "string", "enum": ["Entry","Senior","Manager","Director","VP","C-Suite","Owner","Head","Founder","Partner","Intern"] }
    },
    "seniorityExcludes": {
      "type": "array",
      "items": { "type": "string", "enum": ["Entry","Senior","Manager","Director","VP","C-Suite","Owner","Head","Founder","Partner","Intern"] }
    },
    "personFunctionIncludes": {
      "type": "array",
      "items": { "type": "string", "enum": ["Accounting","Administrative","Arts & Design","Business Development","Consulting","Data Science","Education","Engineering","Entrepreneurship","Finance","Human Resources","Information Technology","Legal","Marketing","Media & Communications","Operations","Product Management","Research","Sales","Support"] }
    },
    "personFunctionExcludes": {
      "type": "array",
      "items": { "type": "string", "enum": ["Accounting","Administrative","Arts & Design","Business Development","Consulting","Data Science","Education","Engineering","Entrepreneurship","Finance","Human Resources","Information Technology","Legal","Marketing","Media & Communications","Operations","Product Management","Research","Sales","Support"] }
    },
    "personFirstNameIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "personFirstNameExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "personLastNameIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "personLastNameExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "personLocationCountryIncludes": { "type": "array", "items": { "type": "string", "enum": ["...237 countries..."] } },
    "personLocationCountryExcludes": { "type": "array", "items": { "type": "string", "enum": ["...247 countries..."] } },
    "personLocationStateIncludes": { "type": "array", "items": { "type": "string", "enum": ["...494 states..."] } },
    "personLocationStateExcludes": { "type": "array", "items": { "type": "string", "enum": ["...494 states..."] } },
    "personLocationCityIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 200 },
    "personLocationCityExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 200 },
    "companyNameIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 10000 },
    "companyNameExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 10000 },
    "companyNameMatchMode": { "type": "string", "enum": ["exact", "phrase"], "default": "phrase" },
    "companyLocationCountryIncludes": { "type": "array", "items": { "type": "string", "enum": ["...237 countries..."] } },
    "companyLocationCountryExcludes": { "type": "array", "items": { "type": "string", "enum": ["...237 countries..."] } },
    "companyLocationStateIncludes": { "type": "array", "items": { "type": "string", "enum": ["...491 states..."] } },
    "companyLocationStateExcludes": { "type": "array", "items": { "type": "string", "enum": ["...491 states..."] } },
    "companyLocationCityIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 200 },
    "companyLocationCityExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 200 },
    "companyDomainMatchMode": { "type": "string", "enum": ["strict", "contains"], "default": "contains" },
    "companyDomainIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 10000 },
    "companyDomainExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 10000 },
    "companyEmployeeSizeIncludes": {
      "type": "array",
      "items": { "type": "string", "enum": ["Unknown","1-10","11-20","21-50","51-100","101-200","201-500","501-1000","1001-2000","2001-5000","5001-10000","10001+"] }
    },
    "companyIndustryIncludes": { "type": "array", "items": { "type": "string", "enum": ["...148 industries..."] } },
    "companyIndustryExcludes": { "type": "array", "items": { "type": "string", "enum": ["...148 industries..."] } },
    "companyKeywordIncludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "companyKeywordExcludes": { "type": "array", "items": { "type": "string" }, "maxItems": 50 },
    "resetSavedProgress": { "type": "boolean", "description": "Start fresh for this search definition." },
    "customOffset": { "type": "integer", "description": "Manual starting offset.", "minimum": 0 }
  }
}
```

### Nexli Target Market: CPA Firms (US Only, 5-25 Employees)

**Target Profile:**
- **Firm Type:** CPA firms only
- **Geography:** United States only
- **Employee Size:** 5-25 employees (maps to buckets: `1-10`, `11-20`, `21-50`)
- **Goal:** Find decision-makers at small-to-mid CPA firms for Nexli outreach

```json
{
  "totalResults": 50000,
  "emailStatus": "verified",
  "hasEmail": true,
  "hasPhone": false,
  "personTitleIncludes": [
    "Accountant",
    "Accounting Manager",
    "Auditor",
    "Bookkeeper",
    "Chief Financial Officer",
    "Controller",
    "Financial Controller",
    "Founder",
    "Founder & CEO",
    "Founder And CEO",
    "General Manager",
    "Managing Partner",
    "Co-Founder",
    "Co-Owner",
    "Director",
    "Director Of Finance",
    "Founding Partner",
    "Internal Auditor",
    "Audit Manager",
    "Business Owner"
  ],
  "personTitleExtraIncludes": [
    "CPA",
    "Certified Public Accountant",
    "Tax Manager",
    "Tax Director",
    "Tax Partner",
    "Audit Partner",
    "Managing Director",
    "Practice Leader",
    "Office Managing Partner",
    "Staff Accountant",
    "Senior Accountant",
    "Tax Accountant",
    "Assurance Partner",
    "Advisory Partner"
  ],
  "includeSimilarTitles": true,
  "seniorityIncludes": ["C-Suite", "VP", "Director", "Manager", "Owner", "Founder", "Partner"],
  "personFunctionIncludes": ["Accounting", "Finance"],
  "companyKeywordIncludes": ["CPA", "accounting", "tax", "audit", "bookkeeping", "certified public accountant"],
  "companyIndustryIncludes": ["Accounting"],
  "companyLocationCountryIncludes": ["United States"],
  "companyEmployeeSizeIncludes": ["1-10", "11-20", "21-50"],
  "companyDomainMatchMode": "contains"
}
```

**Why these filters work for CPA firms:**
- `companyKeywordIncludes` with "CPA", "accounting", "tax", "audit" catches firms whose name or description contains these terms (e.g., "Smith & Associates CPA", "Johnson Tax Advisory")
- `companyIndustryIncludes: ["Accounting"]` limits to the Accounting industry classification
- `companyEmployeeSizeIncludes: ["1-10", "11-20", "21-50"]` covers the 5-25 employee range (closest available buckets — the `1-10` bucket may include some firms under 5, and `21-50` may include some over 25, but this is the tightest match possible with the available size buckets)
- `personTitleExtraIncludes` adds CPA-specific titles not in the curated dropdown (e.g., "Tax Partner", "Audit Partner", "CPA")
- US-only via `companyLocationCountryIncludes: ["United States"]`

**Estimated Reach:** Based on ~90M records in the database, filtering to US-only Accounting industry with 1-50 employees should yield tens of thousands of targetable CPA firm contacts.
