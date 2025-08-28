# FieldWire - Construction Project Management

A modern web application for construction project management, built with Vue.js 3, TypeScript, and Tailwind CSS.

## Features

- 📊 **Dashboard** - Overview of projects and key metrics
- 🏗️ **Projects Management** - Create, view, and manage construction projects
- 📋 **Tasks & Forms** - Task management and form handling
- 👥 **People Management** - Manage contacts, patients, drivers, physicians
- 🏥 **Healthcare Integration** - Clinics, pharmacies, and medical records
- 📁 **File Management** - Document and file organization
- 📈 **Reports** - Analytics and reporting tools
- ⚙️ **Account Settings** - User profile and preferences

## Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **UI Components**: Custom components with Tailwind
- **Development**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/serg19xx/justin-fieldwire.git
   cd fieldwire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── views/              # Page components
├── router/             # Vue Router configuration
├── stores/             # Pinia stores
├── assets/             # Static assets
└── types/              # TypeScript type definitions
```

## Deployment

### Manual Deployment to WHC.ca

Due to FTP connection issues with GitHub Actions, we recommend using manual deployment:

#### Prerequisites
1. Install `lftp`:
   ```bash
   # macOS
   brew install lftp
   
   # Ubuntu/Debian
   sudo apt-get install lftp
   ```

2. **Configure FTP credentials**:
   ```bash
   # Copy the example config
   cp ftp-config.example .env
   
   # Edit .env with your WHC.ca credentials
   nano .env
   ```

#### Deploy
```bash
# Make the script executable
chmod +x upload-to-whc.sh

# Run deployment
./upload-to-whc.sh
```

#### Alternative Deployment Methods

**Method 1: cPanel File Manager**
1. Build locally: `npm run build`
2. Zip the `dist/` folder
3. Upload via cPanel File Manager
4. Extract in `public_html/`

**Method 2: FTP Client (FileZilla, etc.)**
1. Build locally: `npm run build`
2. Connect via FTP client
3. Upload contents of `dist/` to `public_html/`

### Troubleshooting

See [FTP_TROUBLESHOOTING.md](./FTP_TROUBLESHOOTING.md) for detailed troubleshooting guide.

## Development

### Code Style
- Use TypeScript for all code
- Follow Vue.js 3 Composition API patterns
- Use Tailwind CSS for styling
- Follow ESLint configuration

### Adding New Features
1. Create components in `src/components/`
2. Add routes in `src/router/index.ts`
3. Create views in `src/views/`
4. Update navigation in `src/App.vue`

## License

This project is proprietary software for construction project management.
