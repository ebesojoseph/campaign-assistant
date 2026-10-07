import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/utils';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>{formatNumber(total)} results</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page" />
        <span>
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" icon={ChevronRight} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page" />
      </div>
    </div>
  );
}
