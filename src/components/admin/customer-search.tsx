'use client';

import { useCallback, useEffect, useState, startTransition } from 'react';
import { Check, ChevronsUpDown, Loader2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 300;

export type CustomerSearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string;
  booking_count: number;
};

export type SelectedCustomerPayload = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingCount: number;
};

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const t = name.trim();
  if (!t) return { firstName: '', lastName: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { firstName: t, lastName: '' };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1).trim() };
}

function toPayload(c: CustomerSearchResult): SelectedCustomerPayload {
  const { firstName, lastName } = splitFullName(c.name);
  return {
    id: c.id,
    name: c.name,
    firstName,
    lastName,
    email: c.email,
    phone: c.phone,
    bookingCount: c.booking_count,
  };
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type CustomerSearchProps = {
  /** When set, combobox shows linked customer */
  customerId?: string | null;
  /** Primary line shown when a customer is selected */
  selectionLabel?: string | null;
  onCustomerSelect: (payload: SelectedCustomerPayload) => void;
  onClear: () => void;
  /** Called when user picks “New customer” (manual entry) */
  onNewCustomerManual?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CustomerSearch({
  customerId,
  selectionLabel,
  onCustomerSelect,
  onClear,
  onNewCustomerManual,
  label = 'Customer',
  placeholder = 'Search by name, email, or phone…',
  disabled,
  className,
}: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const hasSelection = Boolean(customerId && selectionLabel);

  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery.trim();
    if (q.length < 1) {
      startTransition(() => {
        setResults([]);
        setFetchError(null);
        setLoading(false);
      });
      return;
    }

    const ac = new AbortController();
    startTransition(() => {
      setLoading(true);
      setFetchError(null);
    });

    fetch(`/api/admin/customers/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data: { ok?: boolean; customers?: CustomerSearchResult[]; error?: string }) => {
        if (!data.ok) throw new Error(data.error ?? 'Search failed');
        setResults(data.customers ?? []);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setFetchError(e instanceof Error ? e.message : 'Search failed');
        setResults([]);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [debouncedQuery, open]);

  const handleSelectResult = useCallback(
    (c: CustomerSearchResult) => {
      onCustomerSelect(toPayload(c));
      setOpen(false);
      setQuery('');
    },
    [onCustomerSelect],
  );

  const handleNewManual = useCallback(() => {
    onNewCustomerManual?.();
    onClear();
    setOpen(false);
    setQuery('');
  }, [onClear, onNewCustomerManual]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? <Label>{label}</Label> : null}
      <div className="flex gap-1">
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) setQuery('');
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="h-9 flex-1 justify-between font-normal px-2"
            >
              <span className="truncate text-left">
                {hasSelection ? (
                  <span className="font-medium">{selectionLabel}</span>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={placeholder}
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching…
                  </div>
                )}
                {!loading && fetchError && (
                  <div className="px-2 py-3 text-sm text-destructive">{fetchError}</div>
                )}
                {!loading && !fetchError && query.trim().length < 1 && (
                  <CommandEmpty>Type at least one character to search.</CommandEmpty>
                )}
                {!loading && !fetchError && query.trim().length >= 1 && (
                  <>
                    {results.length > 0 ? (
                      <CommandGroup heading="Customers">
                        {results.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.id}-${c.name}`}
                            onSelect={() => handleSelectResult(c)}
                            className="cursor-pointer"
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <Check
                                className={cn(
                                  'mt-0.5 size-4 shrink-0',
                                  customerId === c.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold leading-tight">{c.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                                <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
                              </div>
                              <Badge variant="secondary" className="shrink-0 tabular-nums">
                                {c.booking_count} {c.booking_count === 1 ? 'booking' : 'bookings'}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : (
                      <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                        No customers found.
                      </div>
                    )}
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value="__new_customer__"
                        onSelect={handleNewManual}
                        className="cursor-pointer text-primary"
                      >
                        <UserPlus className="mr-2 size-4" />
                        New customer (enter manually)
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {hasSelection && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 shrink-0"
            title="Clear customer"
            onClick={() => {
              onClear();
              setQuery('');
            }}
            disabled={disabled}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
