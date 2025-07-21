# InfoFi Components

This directory contains the InfoFi UI components for the PWA application, adapted from the mobile app with modern web technologies.

## Components

### InfoFiComponent
The main component that orchestrates the entire InfoFi dashboard.

**Props:**
- `isButtonInstantiateEnable?: boolean` - Controls whether the subscription button is shown

**Features:**
- Subscription management
- AFK sub card display
- Expandable detailed view
- All subscriptions list

### AfkSubCard
Displays the main AFK subscription information in a card format.

**Props:**
- `subInfo?: SubInfo` - Subscription information
- `onPress?: () => void` - Click handler

### AfkSubMain
The detailed view that shows when the AFK sub card is expanded.

**Features:**
- Overview statistics
- Epoch states with horizontal scrolling
- Deposit rewards form
- User rankings

### UserCard
Displays individual user information with Nostr profile integration.

**Props:**
- `userInfo?: UserInfo` - User data
- `isButtonInstantiateEnable?: boolean` - Controls subscription button
- `contractAddress?: string` - Contract address for scoring

### UserNostrCard
Detailed user profile component with tipping functionality.

**Features:**
- Nostr profile display
- AI and Vote score statistics
- Tip form with amount input
- Profile navigation

### AllSubsComponent
Lists all available subscriptions.

**Features:**
- Subscription cards
- Loading and error states
- Refresh functionality

### SubCard
Individual subscription card component.

**Props:**
- `subInfo: SubInfo` - Subscription data
- `onPress?: () => void` - Click handler

## Styling

The components use a combination of:
- Tailwind CSS for utility classes
- SCSS modules for component-specific styles
- CSS variables for theme support (light/dark mode)

## Usage

```tsx
import { InfoFiComponent } from '@/components/Nostr/InfoFi';

function MyPage() {
  return (
    <InfoFiComponent isButtonInstantiateEnable={true} />
  );
}
```

## Data Integration

Currently, the components use mock data. To integrate with real APIs:

1. Replace mock data in each component with actual API calls
2. Implement proper error handling
3. Add loading states
4. Connect to real Nostr and StarkNet services

## TODO

- [ ] Implement real API integration
- [ ] Add proper error handling
- [ ] Implement navigation to profile pages
- [ ] Add real subscription logic
- [ ] Implement tipping functionality
- [ ] Add proper form validation
- [ ] Implement real-time updates
- [ ] Add accessibility improvements
- [ ] Add unit tests
- [ ] Add integration tests

## Dependencies

- `@starknet-react/core` - StarkNet wallet integration
- `afk_nostr_sdk` - Nostr functionality
- `viem` - Ethereum utilities
- `@nostr-dev-kit/ndk` - Nostr development kit
- Tailwind CSS - Styling
- SCSS - Component styles 