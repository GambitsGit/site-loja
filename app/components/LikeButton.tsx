'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem('gm3d_vid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('gm3d_vid', id)
    }
    return id
  } catch {
    return ''
  }
}

export default function LikeButton({ produtoId }: { produtoId: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) return
    const supabase = createClient()

    Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('produto_id', produtoId),
      supabase.from('likes').select('id').eq('produto_id', produtoId).eq('visitor_id', visitorId).maybeSingle(),
    ]).then(([countRes, likedRes]) => {
      setCount(countRes.count ?? 0)
      setLiked(!!likedRes.data)
    })
  }, [produtoId])

  async function toggle() {
    const visitorId = getVisitorId()
    if (!visitorId) return

    const wasLiked = liked
    // Optimistic update
    setLiked(!wasLiked)
    setCount((c) => (c === null ? (wasLiked ? 0 : 1) : wasLiked ? Math.max(0, c - 1) : c + 1))
    setAnimating(true)
    setTimeout(() => setAnimating(false), 350)

    const supabase = createClient()
    if (wasLiked) {
      await supabase.from('likes').delete().eq('produto_id', produtoId).eq('visitor_id', visitorId)
    } else {
      await supabase.from('likes').insert({ produto_id: produtoId, visitor_id: visitorId })
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={liked ? 'Descurtir' : 'Curtir'}
      className="flex items-center gap-1.5 transition-all active:scale-90 select-none"
    >
      <Heart
        size={24}
        className={`transition-all duration-200 ${animating ? 'scale-125' : 'scale-100'} ${
          liked ? 'fill-rose-500 text-rose-500' : 'text-gray-800 dark:text-gray-200 hover:text-rose-400 dark:hover:text-rose-400'
        }`}
      />
      {count !== null && count > 0 && (
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none tabular-nums">{count}</span>
      )}
    </button>
  )
}
