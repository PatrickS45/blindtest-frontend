'use client'

import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { TypedSocket } from '@/types/socket-events'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

interface UseSocketReturn {
  socket: TypedSocket | null
  isConnected: boolean
  error: string | null
}

/**
 * Custom hook for managing Socket.IO connection with type safety
 */
export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create socket connection
    const socketInstance: TypedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    // Connection handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)

      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, try to reconnect manually
        socketInstance.connect()
      }
    })

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message)
      setError(`Connection error: ${err.message}`)
      setIsConnected(false)
    })

    socketInstance.on('error', (data) => {
      console.error('❌ Socket error:', data.message)
      setError(data.message)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket...')
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected, error }
}

/**
 * Helper hook for reconnection with saved state
 */
export function useSocketReconnect(roomCode?: string, playerId?: string) {
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!socket || !isConnected || !roomCode) return

    // Try to rejoin game on reconnection
    const savedState = localStorage.getItem('game_state')
    if (savedState) {
      try {
        const { roomCode: savedRoom, playerName } = JSON.parse(savedState)
        if (savedRoom === roomCode && playerName) {
          console.log('🔄 Attempting to rejoin game...')
          socket.emit('join_game', { roomCode, playerName })
        }
      } catch (err) {
        console.error('Failed to parse saved state:', err)
      }
    }
  }, [socket, isConnected, roomCode])

  return { socket, isConnected }
}
