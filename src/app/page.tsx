'use client'

import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { games } from '@/lib/games'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/ui/Header'

const Container = styled.div`
  min-height: 100vh;
  padding: 6rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PageHeader = styled.header`
  text-align: center;
  margin-bottom: 4rem;
`

const Title = styled.h1`
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(2rem, 5vw, 4rem);
  color: var(--neon-pink);
  text-shadow: 
    0 0 10px var(--neon-pink),
    0 0 20px var(--neon-pink),
    0 0 30px var(--neon-pink);
  margin-bottom: 1rem;
  animation: pulse 2s ease-in-out infinite;
`

const Subtitle = styled.p`
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: var(--neon-blue);
  animation: blink 2s infinite;
`

const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
`

const GameCard = styled(motion.div)<{ $bgColor: string; $isHovered: boolean }>`
  background: ${props => props.$isHovered ? props.$bgColor + '20' : 'var(--bg-secondary)'};
  border: 3px solid ${props => props.$bgColor};
  border-radius: 0;
  padding: 2rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$isHovered ? 
    `0 0 30px ${props.$bgColor}, inset 0 0 20px ${props.$bgColor}40` : 
    '4px 4px 0 rgba(0, 0, 0, 0.8)'};

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: ${props => props.$bgColor};
    opacity: ${props => props.$isHovered ? 0.2 : 0};
    animation: ${props => props.$isHovered ? 'pulse 1s infinite' : 'none'};
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
  }
`

const GameIcon = styled.div`
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
`

const GameName = styled.h3`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  text-align: center;
  position: relative;
  z-index: 1;
`

const GameDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  position: relative;
  z-index: 1;
  line-height: 1.5;
`

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  padding: 0.3rem 0.6rem;
  background: ${props => 
    props.$difficulty === 'easy' ? 'var(--neon-green)' :
    props.$difficulty === 'medium' ? 'var(--neon-yellow)' :
    'var(--neon-orange)'};
  color: var(--bg-primary);
  text-transform: uppercase;
`

const ComingSoonBadge = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  text-shadow: 2px 2px 0 var(--bg-primary);
  background: var(--bg-primary);
  padding: 0.5rem 1rem;
  border: 3px solid var(--neon-pink);
  z-index: 10;
`

export default function Home() {
  const router = useRouter()
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)

  const handleGameClick = (gameId: string, comingSoon?: boolean) => {
    if (!comingSoon) {
      router.push(`/games/${gameId}`)
    }
  }

  return (
    <>
      <Header />
      <Container>
        <PageHeader>
          <Title>VIBE ARCADE</Title>
          <Subtitle>Choose Your Game</Subtitle>
        </PageHeader>

      <GamesGrid>
        {games.map((game) => (
          <GameCard
            key={game.id}
            $bgColor={game.bgColor}
            $isHovered={hoveredGame === game.id}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
            onClick={() => handleGameClick(game.id, game.comingSoon)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DifficultyBadge $difficulty={game.difficulty}>
              {game.difficulty}
            </DifficultyBadge>
            <GameIcon>{game.icon}</GameIcon>
            <GameName>{game.name}</GameName>
            <GameDescription>{game.description}</GameDescription>
            {game.comingSoon && <ComingSoonBadge>COMING SOON</ComingSoonBadge>}
          </GameCard>
        ))}
      </GamesGrid>
    </Container>
    </>
  )
}