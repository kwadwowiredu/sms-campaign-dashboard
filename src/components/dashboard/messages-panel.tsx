import { ChevronLeft, ChevronRight, Search, SearchX, X } from 'lucide-react'
import { useDeferredValue, useId, useMemo, useState } from 'react'

import { MessageList, MessagesTable } from '@/components/dashboard/messages-views'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE } from '@/config'
import { countByStatus, matchesSearch, STATUS_FILTERS, type StatusFilter } from '@/lib/filter-messages'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

interface MessagesPanelProps {
  messages: Message[]
  loading: boolean
  className?: string
}

export function MessagesPanel({ messages, loading, className }: MessagesPanelProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)

  // Keeps typing responsive while filtering thousands of rows.
  const deferredQuery = useDeferredValue(query)

  const searchResults = useMemo(
    () => messages.filter((message) => matchesSearch(message, deferredQuery)),
    [messages, deferredQuery],
  )
  // Tab counts reflect the current search, so they preview what each filter will show.
  const counts = useMemo(() => countByStatus(searchResults), [searchResults])
  const filtered = useMemo(
    () => (status === 'All' ? searchResults : searchResults.filter((message) => message.status === status)),
    [searchResults, status],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const isFiltering = query.trim() !== '' || status !== 'All'

  function changeQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function changeStatus(value: StatusFilter) {
    setStatus(value)
    setPage(1)
  }

  function clearFilters() {
    changeQuery('')
    changeStatus('All')
  }

  return (
    <Card className={cn('min-w-0 gap-0 py-0', className)}>
      <CardHeader className="gap-4 border-b py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <CardTitle className="text-base font-semibold">Sent messages</CardTitle>
          <CardDescription aria-live="polite">
            {loading
              ? 'Loading…'
              : `${formatNumber(filtered.length)} of ${formatNumber(messages.length)} shown`}
          </CardDescription>
        </div>

        <div className="flex flex-col gap-3 @container/toolbar xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor={`${id}-search`} className="sr-only">
              Search messages
            </label>
            <Input
              id={`${id}-search`}
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Search name, number, or text"
              className="h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => changeQuery('')}
                className="absolute top-1/2 right-1 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X />
              </Button>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="Filter by status"
            className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 sm:inline-flex sm:w-fit"
          >
            {STATUS_FILTERS.map((filter) => {
              const active = filter === status
              return (
                <button
                  key={filter}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={loading ? filter : `${filter} (${formatNumber(counts[filter])})`}
                  onClick={() => changeStatus(filter)}
                  className={cn(
                    'flex min-w-0 flex-col items-center justify-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:px-3 sm:text-sm',
                    active && 'bg-card text-foreground shadow-sm',
                  )}
                >
                  <span className="truncate">{filter}</span>
                  <span className={cn('tabular-nums', active ? 'text-primary' : 'text-muted-foreground/80')}>
                    {loading ? '–' : formatCompactNumber(counts[filter])}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </CardHeader>

      {/* Container query: the table only appears when the card itself is wide enough, so it never overflows. */}
      <div className="@container">
        {loading ? (
          <LoadingRows />
        ) : pageItems.length === 0 ? (
          <EmptyState isFiltering={isFiltering} onClear={clearFilters} />
        ) : (
          <>
            <div className="hidden @3xl:block">
              <MessagesTable messages={pageItems} />
            </div>
            <div className="@3xl:hidden">
              <MessageList messages={pageItems} />
            </div>
          </>
        )}
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:px-5"
        >
          <p className="text-muted-foreground tabular-nums">
            {formatNumber(pageStart + 1)}–{formatNumber(pageStart + pageItems.length)} of{' '}
            {formatNumber(filtered.length)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft />
              <span className="max-sm:sr-only">Previous</span>
            </Button>
            <span className="text-muted-foreground tabular-nums max-sm:sr-only">
              Page {currentPage} of {formatNumber(pageCount)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label="Next page"
            >
              <span className="max-sm:sr-only">Next</span>
              <ChevronRight />
            </Button>
          </div>
        </nav>
      )}
    </Card>
  )
}

function EmptyState({ isFiltering, onClear }: { isFiltering: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium">{isFiltering ? 'No messages match your filters' : 'No messages sent yet'}</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {isFiltering
          ? 'Try a different name, number, or status.'
          : 'Messages from your campaigns will show up here.'}
      </p>
      {isFiltering && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="divide-y" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="w-32 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
