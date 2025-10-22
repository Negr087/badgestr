<img width="986" height="897" alt="Screenshot_3" src="https://github.com/user-attachments/assets/3910d289-e741-4faa-a28c-438e6630f8ae" />

# Badgestr - Nostr Badges Platform

A decentralized badge management system built on the Nostr protocol. Create, award, and display badges across the Nostr network.


## Features

- 🎨 **Create Custom Badges** - Design badges with images and descriptions
- 🏆 **Award Badges** - Grant badges to users on the Nostr network
- 📱 **Profile Integration** - Display your earned badges on your profile
- 🔐 **Multiple Login Methods** - Browser extensions, Nsec Bunker, Amber (Android), or read-only
- 📊 **Badge Discovery** - Explore badges created by the community

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Protocol**: Nostr (NIP-58 Badges)
- **Styling**: Tailwind CSS + shadcn/ui
- **Nostr Library**: @nostr-dev-kit/ndk

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Negr087/badgestr.git
cd badgestr

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Usage

### Connect to Nostr

Choose your preferred authentication method:
- **Browser Extensions** (Alby, nos2x, etc.)
- **Nsec Bunker** (Remote signing)
- **Amber** (Android only)
- **Read-only** (View badges without signing)

### Create a Badge

1. Click "Create Badge"
2. Add name, description, and image
3. Publish to Nostr relays

### Award Badges

1. Find a badge you created
2. Click "Award Badge"
3. Enter recipient's npub or NIP-05
4. Sign and publish the award

### Display Badges

Go to "My Awards" to see badges you've received and choose which ones to display on your Nostr profile.

## Nostr Implementation

This app implements:
- **NIP-58**: Badge Definitions (kind 30009) and Awards (kind 8)
- **NIP-07**: Browser extension signing
- **NIP-46**: Remote signing (Nsec Bunker)
- **NIP-05**: Identifier verification

## Default Relays

- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol
- wss://relay.snort.social
- wss://nostr.wine
- wss://relay.primal.net

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

Built with 💜 for the Nostr community
