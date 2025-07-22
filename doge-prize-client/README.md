# Doge Prize Client

A Next.js application for redeeming Dogecoin doge prizes.

## Features

- Enter redemption codes to win Dogecoin prizes
- Server IP validation with real-time connection testing
- Prize transfer: Provide a Dogecoin wallet address to receive the prize directly
- Real-time Dogecoin address validation
- Animated UI with confetti celebrations
- Responsive design with mobile support

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The client will run on [http://localhost:3643](http://localhost:3643).

## Configuration

The application uses environment-specific configuration files located in the `config/` directory. The configuration system allows you to customize the UI text, images, and behavior for different environments.

### Config Files

Configuration files are stored in `config/` with the following structure:
- `config.development.json` - Development environment settings
- `config.production.json` - Production environment settings  
- `config.test.json` - Test environment settings

### Environment Variable

To specify which configuration file to use, set the `CONFIG_ENV` environment variable:

```bash
# Use development config (default)
CONFIG_ENV=development

# Use production config
CONFIG_ENV=production

# Use test config
CONFIG_ENV=test
```

If `CONFIG_ENV` is not set, the application defaults to `development`.

### Configuration Options

The config files support the following options:

- `title` - Main application title
- `subtitle` - Application subtitle
- `pageTitle` - Browser page title
- `pageDescription` - Meta description for SEO
- `prizeHeading` - Heading text for the prize section
- `serverHeading` - Server address input label
- `serverPlaceholder` - Server address input placeholder
- `redemptionCodeHeading` - Redemption code input label
- `redemptionCodePlaceholder` - Redemption code input placeholder
- `redeemButtonText` - Text for the redeem button
- `footerText` - Footer text content
- `footerTextPosition` - Footer text position ("above" or "below")
- `footerImage` - Path to footer image
- `footerUrl` - URL for footer link (defaults to "https://dogecoin.com")
- `backgroundImage` - Path to background image
- `logoImage` - Path to logo image
- `showWave` - Whether to show the wave animation
- `panelAlignment` - Panel alignment ("left", "center", or "right")

## API Endpoints

The client communicates with the Doge Prize Server using the following endpoints:

- `GET /hello` - Validates server connectivity
- `POST /api/redeem` - Redeems a code and returns prize information
- `POST /api/transfer` - Transfers prize to a provided wallet address

### Building for Production

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.