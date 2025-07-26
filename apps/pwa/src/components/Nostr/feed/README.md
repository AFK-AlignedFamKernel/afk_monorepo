# Algorithmic Feed Components

This directory contains React components for displaying Nostr content with algorithmic ranking and filtering, powered by the algo-relay backend.

## Components

### AlgoFeed
A simple algorithmic feed component that displays trending notes and top authors.

**Props:**
- `className?: string` - Additional CSS classes
- `limit?: number` - Number of items to display (default: 20)
- `showTrending?: boolean` - Show trending notes tab (default: true)
- `showTopAuthors?: boolean` - Show top authors tab (default: true)

**Usage:**
```tsx
import { AlgoFeed } from '@/components/Nostr/feed';

<AlgoFeed 
  limit={15}
  showTrending={true}
  showTopAuthors={true}
/>
```

### AdvancedAlgoFeed
A full-featured algorithmic feed with multiple tabs, advanced filtering, and real-time updates.

**Props:**
- `className?: string` - Additional CSS classes
- `limit?: number` - Number of items to display (default: 20)
- `showTrending?: boolean` - Show trending notes tab (default: true)
- `showViral?: boolean` - Show viral content tab (default: true)
- `showScraped?: boolean` - Show scraped notes tab (default: true)
- `showTopAuthors?: boolean` - Show top authors tab (default: true)
- `enableRealTime?: boolean` - Enable WebSocket real-time updates (default: false)

**Usage:**
```tsx
import { AdvancedAlgoFeed } from '@/components/Nostr/feed';

<AdvancedAlgoFeed 
  limit={20}
  showTrending={true}
  showViral={true}
  showScraped={true}
  showTopAuthors={true}
  enableRealTime={true}
/>
```

## Features

### 🔥 Trending Notes
Algorithmically ranked content based on engagement metrics including:
- Reaction count
- Zap count
- Reply count
- Time decay
- Author reputation

### 🚀 Viral Content
Content that's rapidly gaining traction across the Nostr network, identified by:
- High velocity of engagement
- Cross-relay propagation
- Exponential growth patterns

### 📊 Scraped Notes
Comprehensive data from the algo-relay scraper with advanced filtering:
- Time-based filtering (1h, 24h, 7d, 30d)
- Content type filtering (text, articles, reposts, reactions)
- Multiple sorting options (score, reactions, zaps, replies, created)

### 👥 Top Authors
Authors you interact with most, calculated based on:
- Reaction interactions
- Zap interactions
- Reply interactions
- Follow relationships

### ⚡ Real-time Updates
Live updates via WebSocket connection to the algo-relay backend:
- New trending notes
- Updated engagement metrics
- Real-time scoring changes

### 🔍 Advanced Filtering
Comprehensive filtering and sorting options:
- **Time Filters:** Last hour, 24 hours, 7 days, 30 days
- **Content Types:** Text notes, articles, reposts, reactions
- **Sort Options:** Score, reactions, zaps, replies, creation time
- **Author Filtering:** Specific authors or author lists

## Backend Integration

These components integrate with the algo-relay backend which provides:

### API Endpoints
- `/api/trending-notes` - Get trending notes
- `/api/viral-notes` - Get viral content
- `/api/viral-notes-scraper` - Get viral notes from scraper
- `/api/scraped-notes` - Get scraped notes with filters
- `/api/top-authors` - Get top authors for a user
- `/api/user-metrics` - Get user engagement metrics

### WebSocket Support
- Real-time updates for new content
- Live engagement metric updates
- Connection status monitoring

### Data Processing
- Real-time Nostr event processing
- Algorithmic scoring and ranking
- User interaction tracking
- Content scraping and analysis

## Styling

The components use CSS modules with theme variables for consistent styling:

### CSS Variables Used
- `--primary-color` - Primary brand color
- `--primary-color-hover` - Primary color hover state
- `--primary-color-alpha` - Primary color with transparency
- `--background` - Page background
- `--card-bg` - Card background
- `--border` - Border color
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color

### Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interactions
- Adaptive layouts

### Dark Mode Support
- Automatic theme detection
- Consistent color schemes
- Smooth transitions

## Usage Examples

### Basic Implementation
```tsx
import { AlgoFeed } from '@/components/Nostr/feed';

function MyPage() {
  return (
    <div>
      <h1>My Nostr Feed</h1>
      <AlgoFeed limit={10} />
    </div>
  );
}
```

### Advanced Implementation
```tsx
import { AdvancedAlgoFeed } from '@/components/Nostr/feed';

function MyAdvancedPage() {
  return (
    <div>
      <h1>Advanced Nostr Feed</h1>
      <AdvancedAlgoFeed 
        limit={20}
        showTrending={true}
        showViral={true}
        showScraped={false}
        showTopAuthors={true}
        enableRealTime={true}
      />
    </div>
  );
}
```

### Custom Styling
```tsx
import { AlgoFeed } from '@/components/Nostr/feed';
import styles from './MyStyles.module.scss';

function MyCustomPage() {
  return (
    <div>
      <AlgoFeed 
        className={styles.customFeed}
        limit={15}
      />
    </div>
  );
}
```

## Demo Page

Visit `/algo-feed-demo` to see all components in action with different configurations.

## Environment Variables

Set the following environment variable to configure the backend URL:

```env
NEXT_PUBLIC_ALGO_RELAY_URL=http://localhost:3334
```

## Dependencies

- `afk_nostr_sdk` - Nostr authentication and utilities
- `@/lib/analytics` - Analytics tracking
- `@/services/algoRelayService` - Backend API service

## Browser Support

- Modern browsers with ES6+ support
- WebSocket support for real-time features
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming 