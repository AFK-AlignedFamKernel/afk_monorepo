Fork from original repo: https://github.com/bitvora/algo-relay

# AlgoRelay

AlgoRelay is nostr's first algorithmic relay. It allows any relay operator to build their own relay using a preset weighting algorithm. It is nostr native and is compatible with the current nostr protocol.

## How the Feed Algorithm Works

Our feed algorithm is designed to deliver a personalized and engaging experience by balancing posts from authors you interact with and viral content from across the network. It considers several key factors to surface posts that are both relevant and timely, while also highlighting popular content. Below is a breakdown of how each component contributes to the overall ranking of posts in your feed.

### Key Components of the Algorithm

1. **Interactions with Authors**

   - **Weight:** `WEIGHT_INTERACTIONS_WITH_AUTHOR`
   - Posts from authors you frequently engage with (through comments, reactions, or zaps) are given priority. The higher this weight, the more often you'll see posts from authors you regularly interact with.
   - **Why it matters:** This ensures that content from your favorite authors (people you've frequently interacted with) appears more prominently in your feed.

2. **Global Comments on Posts**

   - **Weight:** `WEIGHT_COMMENTS_GLOBAL`
   - The algorithm considers the total number of comments on each post across the platform. A higher weight here gives priority to posts with more comments, as they indicate meaningful engagement and discussions.
   - **Why it matters:** Posts with many comments often spark conversations and debates, making them potentially more interesting to include in your feed.

3. **Global Reactions on Posts**

   - **Weight:** `WEIGHT_REACTIONS_GLOBAL`
   - Reactions (such as likes or emojis) are another form of engagement. This weight determines how much reactions influence the ranking of a post.
   - **Why it matters:** Reactions are a quick way for users to show approval or interest, and posts with high reactions tend to resonate with the broader community.

4. **Global Zaps on Posts**

   - **Weight:** `WEIGHT_ZAPS_GLOBAL`
   - Zaps represent a more significant form of interaction, as they involve a financial transaction (usually a small amount of Bitcoin). The algorithm boosts posts with a higher number of zaps, as they indicate strong support.
   - **Why it matters:** Zaps signal high value and endorsement from other users, making these posts stand out in your feed.

5. **Recency**

   - **Weight:** `WEIGHT_RECENCY`
   - Newer posts are generally more relevant, and this weight controls how much the algorithm favors recent content.
   - **Why it matters:** Fresh content is given a boost to ensure that your feed stays up-to-date with the latest posts. The recency factor ensures that older posts gradually decay in importance over time.

6. **Viral Posts**

   - **Threshold:** `VIRAL_THRESHOLD`
   - Posts that exceed a certain number of combined comments, reactions, and zaps are considered viral. Viral posts are ranked higher in the feed based on their total engagement, but a dampening factor is applied to ensure they don't overwhelm your feed.
   - **Dampening Factor:** `VIRAL_POST_DAMPENING`
   - Viral posts are exciting, but they shouldn't dominate your feed. This dampening factor reduces the influence of viral posts, ensuring a balance between personal relevance and global popularity.
   - **Why it matters:** Viral posts add variety and surface popular content, but they are balanced with content from authors you personally interact with to maintain a well-rounded feed.

7. **Decay Rate for Recency**
   - **Rate:** `DECAY_RATE`
   - This controls how quickly older posts lose relevance. A higher decay rate means that older posts will decay in importance faster, while a lower decay rate keeps older posts in the feed for longer.
   - **Why it matters:** This ensures that the feed doesn't become too stale by over-prioritizing older posts. It keeps the feed dynamic and responsive to new content.

### How it All Comes Together

The feed combines two main components: posts from authors you frequently interact with and viral posts from across the network. Each post is scored based on the factors outlined above, with more weight given to interactions with familiar authors, balanced by global engagement metrics (comments, reactions, zaps), and adjusted for recency. The result is a feed that feels personalized while keeping you informed of the most popular content on the platform.

Viral posts are dampened by the `VIRAL_POST_DAMPENING` factor to ensure they don’t overshadow posts from authors you frequently interact with. Additionally, posts from the user’s own account are filtered out to avoid cluttering the feed with self-posts.

With this algorithm, users get a curated mix of familiar and trending content, ensuring that their feed is always engaging and relevant.

## Prerequisites

- **Go**: Ensure you have Go installed on your system. You can download it from [here](https://golang.org/dl/).
- **Build Essentials**: If you're using Linux, you may need to install build essentials. You can do this by running `sudo apt install build-essential`.
- **PostgreSQL**: You'll need a PostgreSQL database to store the relay data. You can use the included docker-compose file to set up a PostgreSQL database if you don't have one already.

## Setup Instructions

Follow these steps to get the Algo Relay running on your local machine:

### 1. Clone the repository

```bash
git clone https://github.com/bitvora/algo-relay.git
cd algo-relay
```

### 2. Copy `.env.example` to `.env`

You'll need to create an `.env` file based on the example provided in the repository.

```bash
cp .env.example .env
```

### 3. Set your environment variables

Open the `.env` file and set the necessary environment variables.

**Important:** For frontend integration, you must configure CORS settings. See [CORS_SETUP.md](./CORS_SETUP.md) for detailed instructions.

**Required CORS Configuration:**
```env
# Add your frontend URLs to allow CORS requests
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### 4. Build the project

Run the following command to build the relay:

```bash
go build
```

If you do not have a postgres database set up, you can use the included docker-compose file to set up a PostgreSQL database:

```bash
docker-compose up -d
```

### 5. Create a Systemd Service

To have the relay run as a service, create a systemd unit file. Make sure to limit the memory usage to less than your system's total memory to prevent the relay from crashing the system.

1. Create the file:

```bash
sudo nano /etc/systemd/system/algo.service
```

2. Add the following contents:

```ini
[Unit]
Description=Algo Relay
After=network.target

[Service]
ExecStart=/home/ubuntu/algo-relay/algo-relay
WorkingDirectory=/home/ubuntu/algo-relay
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Reload systemd to recognize the new service:

```bash
sudo systemctl daemon-reload
```

4. Start the service:

```bash
sudo systemctl start algo
```

5. (Optional) Enable the service to start on boot:

```bash
sudo systemctl enable algo
```

### 6. Serving over nginx (optional)

You can serve the relay over nginx by adding the following configuration to your nginx configuration file:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3334;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Replace `yourdomain.com` with your actual domain name.

After adding the configuration, restart nginx:

```bash
sudo systemctl restart nginx
```

### 7. Install Certbot (optional)

If you want to serve the relay over HTTPS, you can use Certbot to generate an SSL certificate.

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

After installing Certbot, run the following command to generate an SSL certificate:

```bash
sudo certbot --nginx
```

Follow the instructions to generate the certificate.

### 8. Run The Import (optional)

If you want to import your old notes and notes you're tagged in from other relays, run the following command:

```bash
./algo-relay --import
```

### 9. Access the relay

Once everything is set up, the relay will be running on `localhost:3334` with the following endpoints:

- `localhost:3334` - Home page
- `localhost:3334/dashboard.html` - User dashboard
- `localhost:3334/scraper-dashboard.html` - Note scraper dashboard

## Note Scraping Feature

The relay now includes an automated note scraping system that runs every 15 minutes to identify viral and trending notes across the Nostr network.

### How It Works

1. **Automated Scraping**: The system automatically scrapes notes from the last 2 hours every 15 minutes
2. **Dual Storage**: All scraped notes are saved in both the main `notes` table and the `scraped_notes` table
3. **Viral Detection**: Notes with high interaction scores (comments + reactions + zaps) are marked as viral
4. **Trending Detection**: Notes with rapid engagement growth are identified as trending
5. **Score Calculation**: Uses actual interaction data from the database for accurate scoring

### Comprehensive Data Setup

The system also includes a comprehensive data setup cron job that runs every 6 hours to:

1. **Import Notes by Kind**: Automatically imports text notes, articles, images, reactions, and zaps from the last 24 hours
2. **Build User Networks**: Imports follow lists to understand user relationships
3. **Collect Interactions**: Gathers reactions and zaps for interaction scoring
4. **Update Scores**: Recalculates viral and trending scores based on new interaction data
5. **Cleanup**: Removes old data to keep the database manageable

### Manual Triggers

- **API Endpoint**: `POST /api/trigger-data-setup` - Manually trigger the comprehensive data setup
- **API Endpoint**: `POST /api/sync-notes` - Manually sync existing notes to scraped_notes table
- **Dashboard Buttons**: Use the "Trigger Data Setup" and "Sync Notes" buttons on the scraper dashboard

### API Endpoints

- `GET /api/viral-notes?limit=20` - Get current viral notes
- `GET /api/trending-notes?limit=20` - Get current trending notes  
- `GET /api/scraped-notes?limit=50&kind=1&since=2024-01-01T00:00:00Z` - Get scraped notes with filters
- `POST /api/trigger-data-setup` - Manually trigger comprehensive data setup
- `POST /api/sync-notes` - Manually sync existing notes to scraped_notes table

### WebSocket API

The relay provides a real-time WebSocket API at `/ws` for external Nostr clients to receive live data updates.

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:3334/ws');
```

#### Authentication
```javascript
ws.send(JSON.stringify({
    type: 'auth',
    user_id: 'your_nostr_pubkey'
}));
```

#### Available Commands

**Get User Feed:**
```javascript
ws.send(JSON.stringify({
    type: 'get_feed',
    user_id: 'your_pubkey',
    kind: 1,  // Optional: note kind
    limit: 20 // Optional: number of notes
}));
```

**Get Viral Notes:**
```javascript
ws.send(JSON.stringify({
    type: 'get_viral_notes',
    limit: 20 // Optional
}));
```

**Get Trending Notes:**
```javascript
ws.send(JSON.stringify({
    type: 'get_trending_notes',
    limit: 20 // Optional
}));
```

**Subscribe to Real-time Updates:**
```javascript
// Subscribe to viral notes updates
ws.send(JSON.stringify({
    type: 'subscribe_viral'
}));

// Subscribe to trending notes updates
ws.send(JSON.stringify({
    type: 'subscribe_trending'
}));
```

#### Message Types

- `auth_success` - Authentication successful
- `feed_data` - User feed data
- `viral_notes` - Viral notes data
- `trending_notes` - Trending notes data
- `viral_notes_update` - Real-time viral notes update
- `trending_notes_update` - Real-time trending notes update
- `subscription_success` - Subscription confirmed
- `error` - Error message

#### Example Client

See `websocket-client-example.html` for a complete example of how to use the WebSocket API.

### Dashboard

Visit `/scraper-dashboard.html` to view:
- Real-time statistics of viral and trending notes
- Interactive dashboard with tabs for different note categories
- Auto-refreshing data every 30 seconds
- Detailed view of note content and scores

### Database Tables

The scraping system creates three new tables:
- `scraped_notes` - Stores all scraped notes with scores
- `viral_notes` - Tracks notes identified as viral (expires after 7 days)
- `trending_notes` - Tracks notes identified as trending (expires after 3 days)

## License

This project is licensed under the MIT License.
