# 🎮 Retro Vibes Arcade

A retro-style arcade platform featuring classic games with modern multiplayer capabilities. Built with Next.js, TypeScript, and Supabase.

🎯 **Live Demo**: [https://retro-vibes-arcade.vercel.app/](https://retro-vibes-arcade.vercel.app/)

## ✨ Features

### 🐍 Snake Game
- **Solo Mode**: Classic snake gameplay with increasing speed and difficulty
- **PvP Mode**: Play against AI opponents with 4 difficulty levels
  - Easy: Slower reactions, makes mistakes
  - Medium: Balanced gameplay
  - Hard: Quick reactions, smart pathfinding
  - Insane: Perfect play with prediction
- **Multiplayer**: Create/join rooms with 6-character codes (coming soon)
- **Power-ups**: Speed boost, ghost mode, shields, and more
- **Tournament Mode**: Admin-only competitive play for up to 6 players

### 🎨 Retro Aesthetic
- Neon color scheme with glowing effects
- Pixel-perfect rendering
- Authentic arcade sounds and feel
- Responsive design for all devices

### 🔐 Authentication & Security
- User accounts with Supabase Auth
- High score tracking
- Row Level Security (RLS) policies
- Secure multiplayer rooms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichaelCoxon2016/retro-vibes-arcade.git
   cd retro-vibes-arcade
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [https://supabase.com](https://supabase.com)
   - Follow the setup guide in `SUPABASE_SETUP.md`

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Then update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🗄️ Database Setup

Run the SQL scripts in your Supabase SQL editor in this order:

1. `/supabase/snake-tournament-schema.sql` - Core game tables
2. `/supabase/game-rooms-schema-fixed.sql` - Multiplayer room system

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Configure Supabase for Production

In your Supabase project settings:
1. Go to Authentication → URL Configuration
2. Add your production URL to redirect URLs:
   ```
   https://retro-vibes-arcade.vercel.app/*
   ```

## 🎮 How to Play

### Snake Controls
- **Arrow Keys** or **WASD**: Move snake
- **Space** or **P**: Pause game
- **Mobile**: Use on-screen arrow buttons

### Game Modes
1. **Solo Mode**: Score as many points as possible
2. **PvP vs AI**: Battle against computer opponents
3. **Multiplayer** (Coming Soon): Real-time battles with friends

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, React
- **Styling**: Styled Components, CSS Variables
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database, Realtime)
- **Game Engine**: Custom Canvas-based engine
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and services
│   ├── game-engines/  # Game logic
│   ├── realtime/      # Multiplayer services
│   └── supabase/      # Database client
├── store/           # Zustand stores
├── styles/          # Global styles and theme
└── types/           # TypeScript types
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎯 Roadmap

- [ ] Real-time multiplayer for Snake
- [ ] Parkour game implementation
- [ ] Pac-Man game
- [ ] Global leaderboards
- [ ] Friend system
- [ ] Custom game rooms with settings
- [ ] Mobile app versions

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- Font: Press Start 2P by CodeMan38

---

Made with ❤️ and lots of 🎮