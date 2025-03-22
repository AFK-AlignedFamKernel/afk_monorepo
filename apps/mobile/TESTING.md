# Testing Guide for Note Creation Features

This document provides instructions for testing the newly implemented note creation features.

## Quick Test with HTML Demo (Recommended)

We've created a standalone HTML demo to showcase the features without needing to run the full app:

```bash
cd /home/user/afk_monorepo/apps/mobile
./serve-test.sh
```

Then open http://localhost:8000/test-features.html in your browser.

This HTML page demonstrates all the implemented features:
- Emoji picker 
- User mentions with @
- Markdown support

## Running the Full App

If you want to test the full implementation in the app:

```bash
cd /home/user/afk_monorepo
pnpm install
cd apps/mobile
pnpm start
```

## Using the TestFeatures Page

If the main app runs successfully, use the dedicated TestFeatures page:

1. Run the app and navigate directly to:
   - In browser: http://localhost:19006/app/test-features
   - In app: Navigate to TestFeatures screen from the drawer menu

This page is specifically designed to test the emoji picker and user mentions without dependencies on other parts of the app.

## Testing Steps

### 1. Accessing the Note Creation Form

1. Open the app and navigate to the Feed screen.
2. Look for a floating action button (circular '+' icon) at the bottom right of the screen.
3. Tap on this button to navigate to the 'CreateForm' screen.
4. The note creation form should appear with a text input area, an emoji button, an MD button, image, and video buttons.

### 2. Testing Emoji Picker

1. In the note creation form, tap the emoji button (😀) in the toolbar below the text area.
2. A modal should slide up from the bottom showing a grid of emoji options.
3. Tap on an emoji to insert it into your note at the current cursor position.
4. Verify that the emoji appears in the text input field.
5. Try placing your cursor at different positions in your text and inserting emojis there.

### 3. Testing Markdown Support

1. Tap the "MD" button to see information about supported markdown syntax.
2. A toast notification should appear with details about the supported markdown.
3. Try typing some markdown in your note:
   ```
   **bold text**
   *italic text*
   [link text](https://example.com)
   # Heading
   ```
4. When you post the note, these should render with proper formatting.

### 4. Testing User Mentions

1. Start typing "@" followed by some letters in the note text area.
2. A user search panel should appear showing matching users.
3. Continue typing to refine the search.
4. Tap on a user from the results.
5. The user's name should be inserted in the note with the @ symbol.
6. Post the note and verify the mention works correctly.

### Troubleshooting

If you encounter a blank screen after running `pnpm start`:

1. Check if there are any errors in the console.
2. Ensure that all dependencies are correctly installed and compatible.
3. Try using `pnpm run web` instead of `pnpm start` to run the web version specifically.
4. If you're testing in a physical device, try using Expo Go app by running:
   ```
   cd /home/agnik/afk_monorepo/apps/mobile
   npx expo start
   ```
   Then scan the QR code with the Expo Go app.

### Checking Component Implementation

Even if the app isn't running correctly, you can verify that the components are 
implemented correctly by checking:

1. `/home/user/afk_monorepo/apps/mobile/src/screens/CreatePost/FormPost/index.tsx` - Contains the form UI with emoji picker, markdown support, and user mentions
2. `/home/user/afk_monorepo/apps/mobile/src/utils/nostr.ts` - Contains utility functions for nostr:nprofile format
3. `/home/user/afk_monorepo/apps/mobile/src/screens/CreatePost/FormPost/styles.ts` - Contains styles for the form components