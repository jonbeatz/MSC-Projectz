'use client'

import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type MscManualProjectMove = {
  canUp: boolean
  canDown: boolean
  onUp: () => void | Promise<void>
  onDown: () => void | Promise<void>
  busy: boolean
}

type Props = {
  manualMove: MscManualProjectMove
  /** `card` = grid card (hover on md+; ellipsis on small). `row` = list item. */
  layout: 'card' | 'row'
  isDark?: boolean
}

export function MscManualProjectMoveControls({ manualMove, layout, isDark }: Props) {
  const { canUp, canDown, onUp, onDown, busy } = manualMove

  const upBtn = (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={!canUp || busy}
      className={cn(
        'h-8 w-8 border border-border',
        isDark ? 'bg-background/90' : 'bg-card',
      )}
      title="Move up"
      aria-label="Move project up"
      onClick={(e) => {
        e.stopPropagation()
        void onUp()
      }}
    >
      <ChevronUp className="h-4 w-4" />
    </Button>
  )
  const downBtn = (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={!canDown || busy}
      className={cn(
        'h-8 w-8 border border-border',
        isDark ? 'bg-background/90' : 'bg-card',
      )}
      title="Move down"
      aria-label="Move project down"
      onClick={(e) => {
        e.stopPropagation()
        void onDown()
      }}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  )

  if (layout === 'row') {
    return (
      <>
        <div className="hidden items-center gap-0.5 sm:flex" onClick={(e) => e.stopPropagation()}>
          {upBtn}
          {downBtn}
        </div>
        <div className="sm:hidden" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                disabled={busy}
                aria-label="Move project"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem disabled={!canUp || busy} onSelect={() => void onUp()}>
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canDown || busy} onSelect={() => void onDown()}>
                Move down
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    )
  }

  // card: md+ = hover chevrons on left; below md = bottom-right ellipsis (above z-10 image overlay)
  return (
    <>
      <div
        className={cn(
          'absolute left-2 top-1/2 z-30 -translate-y-1/2 flex-col gap-0.5',
          // Always visible on md+ when manual reorder is on (hover-only hid arrows on many cards).
          'hidden md:flex md:opacity-90 md:transition-opacity md:group-hover:opacity-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {upBtn}
        {downBtn}
      </div>
      <div
        className="absolute bottom-2 right-2 z-30 md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 border border-border"
              disabled={busy}
              aria-label="Move project"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem disabled={!canUp || busy} onSelect={() => void onUp()}>
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canDown || busy} onSelect={() => void onDown()}>
              Move down
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
