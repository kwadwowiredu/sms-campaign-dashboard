import { StatusBadge } from '@/components/dashboard/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { billedCostMicros, isBillable } from '@/lib/billing'
import { formatMoney, formatPhone, formatSentAt } from '@/lib/format'
import type { Message } from '@/types'

function CostValue({ message }: { message: Message }) {
  if (!isBillable(message.status)) {
    return (
      <span className="text-muted-foreground" title="Failed messages are not billed">
        <span aria-hidden>—</span>
        <span className="sr-only">Not billed</span>
      </span>
    )
  }
  return <>{formatMoney(billedCostMicros(message), { precise: true })}</>
}

/**
 * Desktop view. `table-fixed` with explicit column widths means long
 * content truncates instead of pushing Cost and Sent off-screen.
 */
export function MessagesTable({ messages }: { messages: Message[] }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-44 pl-5 text-xs text-muted-foreground uppercase">Recipient</TableHead>
          <TableHead className="text-xs text-muted-foreground uppercase">Message</TableHead>
          <TableHead className="w-36 text-xs text-muted-foreground uppercase">Status</TableHead>
          <TableHead className="w-14 text-right text-xs text-muted-foreground uppercase">SMS</TableHead>
          <TableHead className="w-20 text-right text-xs text-muted-foreground uppercase">Cost</TableHead>
          <TableHead className="w-32 pr-5 text-right text-xs text-muted-foreground uppercase">Sent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow key={message.id}>
            <TableCell className="py-3 pl-5">
              <p className="truncate font-medium" title={message.recipientName}>
                {message.recipientName}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {formatPhone(message.recipientPhone)}
              </p>
            </TableCell>
            <TableCell className="py-3">
              <p className="truncate" title={message.body}>
                {message.body}
              </p>
              <p className="truncate text-xs text-muted-foreground">{message.campaignName}</p>
            </TableCell>
            <TableCell className="py-3">
              <StatusBadge status={message.status} />
              {message.statusDetail && (
                <p className="mt-1 truncate text-xs text-muted-foreground" title={message.statusDetail}>
                  {message.statusDetail}
                </p>
              )}
            </TableCell>
            <TableCell className="py-3 text-right tabular-nums">{message.segments}</TableCell>
            <TableCell className="py-3 text-right tabular-nums">
              <CostValue message={message} />
            </TableCell>
            <TableCell className="py-3 pr-5 text-right text-xs text-muted-foreground tabular-nums">
              <time dateTime={message.sentAt}>{formatSentAt(message.sentAt)}</time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Narrow view: one card per message instead of a squeezed table. */
export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <ul className="divide-y">
      {messages.map((message) => (
        <li key={message.id} className="space-y-2 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{message.recipientName}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(message.recipientPhone)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={message.status} />
              {message.statusDetail && (
                <p className="max-w-40 truncate text-xs text-muted-foreground">{message.statusDetail}</p>
              )}
            </div>
          </div>
          <p className="line-clamp-2 text-sm">{message.body}</p>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="truncate">
              {message.campaignName} · <time dateTime={message.sentAt}>{formatSentAt(message.sentAt)}</time>
            </span>
            <span className="tabular-nums">
              {message.segments} SMS · <CostValue message={message} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
