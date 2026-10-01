import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

const subscribe = (listener: () => void) => onlineManager.subscribe(listener)
const getOnline = () => onlineManager.isOnline()

/** Máy đang có mạng không (onlineManager nối NetInfo ở lib/queryClient.ts), như useOnline của web */
export const useOnline = () => useSyncExternalStore(subscribe, getOnline)
