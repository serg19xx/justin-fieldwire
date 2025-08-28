# FieldWire - Construction Project Management Application

A modern Vue.js application for construction project management, built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- **Dashboard**: Overview of projects, tasks, and recent activity
- **Project Management**: Create and manage construction projects
- **Task Management**: Track and assign tasks to team members
- **Contact Management**: Manage patients, drivers, pharmacies, physicians, and clinics
- **Reports**: Generate and view project reports
- **File Management**: Upload and organize project files
- **Photo Management**: Store and organize project photos
- **Form Management**: Create and manage project forms
- **Specifications**: Manage project specifications
- **Responsive Design**: Mobile-first approach with support for all screen sizes

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **UI Components**: Headless UI, Element Plus
- **Icons**: Heroicons (SVG)

## 📋 Prerequisites

- Node.js (version 20.19.0 or higher, or 22.12.0+)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd fieldwire
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## 🏗️ Project Structure

```
src/
├── assets/          # Static assets (CSS, images)
├── components/      # Reusable Vue components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores for state management
├── views/           # Page components
│   └── contacts/    # Contact-related pages
└── main.ts          # Application entry point
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=FieldWire
VITE_API_BASE_URL=your-api-base-url
```

### Vite Configuration

The build configuration is in `vite.config.ts`. Key settings:

- Base path configuration for deployment
- Alias configuration for `@` pointing to `src/`
- Vue plugin configuration

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deploy to GitHub Pages

1. Add GitHub Pages configuration to your repository
2. Set the source to GitHub Actions
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Deploy to WHC.ca

**🚀 Recommended: GitHub Actions (Automatic Deployment)**

For automatic deployment setup, see [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md).

**Setup once, deploy automatically:**
1. Add FTP credentials to GitHub Secrets
2. Push to main branch = automatic deployment
3. No manual uploads needed

**Manual deployment (alternative):**

For detailed manual deployment instructions, see [WHC_DEPLOYMENT.md](./WHC_DEPLOYMENT.md).

Quick manual steps:
1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload to WHC.ca:**
   - Connect via FTP/SFTP to your WHC.ca hosting
   - Upload contents of `dist/` folder to `public_html/`
   - Upload `.htaccess` file to `public_html/`

3. **Configure domain:**
   - Set up domain in WHC.ca cPanel
   - Enable SSL certificate
   - Configure DNS if needed

4. **Automatic upload script:**
   ```bash
   # Edit upload-to-whc.sh with your credentials
   nano upload-to-whc.sh
   
   # Run upload script
   ./upload-to-whc.sh
   ```

### Deploy to VPS

For detailed VPS deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick VPS deployment steps:

1. **Server Setup**:
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Deploy Application**:
   ```bash
   # Clone repository
   sudo mkdir -p /var/www/fieldwire
   cd /var/www/fieldwire
   git clone <your-repository-url> .
   
   # Install and build
   npm install
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Automatic Updates**:
   ```bash
   # Use the deployment script
   ./deploy.sh
   ```

4. **Access Application**:
   - Local: `http://localhost:3000`
   - External: `http://your-server-ip:3000`

## 🔐 Authentication

The application includes a mock authentication system. In production, you'll need to:

1. Replace the mock auth store with real authentication
2. Implement proper API calls for login/logout
3. Add proper session management
4. Configure CORS and security headers

## 📱 Responsive Design

The application is built with a mobile-first approach using Tailwind CSS:

- **Mobile**: Optimized for phones and tablets
- **Desktop**: Full-featured interface for larger screens
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🎨 Customization

### Styling

- Modify `tailwind.config.js` for theme customization
- Update `src/assets/main.css` for global styles
- Use Tailwind utility classes for component styling

### Components

- Create new components in `src/components/`
- Follow Vue 3 Composition API patterns
- Use TypeScript interfaces for props and emits

## 🐛 Troubleshooting

### Common Issues

1. **Node version**: Ensure you're using Node.js 20.19.0+ or 22.12.0+
2. **Dependencies**: Run `npm install` if you encounter module errors
3. **Build errors**: Check TypeScript errors with `npm run type-check`
4. **Styling issues**: Ensure Tailwind CSS is properly configured

### Development Tips

- Use Vue DevTools for debugging
- Check browser console for errors
- Use TypeScript for better development experience
- Follow ESLint rules for code quality

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.

---

**FieldWire** - Streamlining construction project management with modern web technology.
