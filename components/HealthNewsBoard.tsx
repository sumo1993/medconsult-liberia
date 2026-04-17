'use client';

import { useEffect, useMemo, useState } from 'react';

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

const ITEMS_PER_PAGE = 7;
const REFRESH_MS = 30000;

function itemKey(item: NewsItem) {
  return `${item.title}::${item.link}`.toLowerCase();
}

function NewsColumn({
  title,
  items,
  page,
  onPageChange,
}: {
  title: string;
  items: NewsItem[];
  page: number;
  onPageChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const current = items.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {current.length === 0 ? (
        <p className="text-sm text-gray-500">No headlines available right now.</p>
      ) : (
        <div className="space-y-3">
          {current.map((item, idx) => (
            <a
              key={`${item.link}-${idx}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <p className="font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {item.source} • {new Date(item.pubDate).toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {safePage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function HealthNewsBoard() {
  const [domestic, setDomestic] = useState<NewsItem[]>([]);
  const [international, setInternational] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [domesticPage, setDomesticPage] = useState(1);
  const [internationalPage, setInternationalPage] = useState(1);

  const knownKeys = useMemo(() => {
    return new Set([...domestic, ...international].map(itemKey));
  }, [domestic, international]);

  const fetchNews = async (isRefresh = false) => {
    try {
      const response = await fetch('/api/health-resources/news?limit=100', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const nextDomestic: NewsItem[] = data?.domestic || [];
      const nextInternational: NewsItem[] = data?.international || [];

      if (isRefresh) {
        const incoming = [...nextDomestic, ...nextInternational];
        const unseen = incoming.filter((item) => !knownKeys.has(itemKey(item))).length;
        if (unseen > 0) setNewCount(unseen);
      }

      setDomestic(nextDomestic);
      setInternational(nextInternational);
    } catch {
      // no-op for background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(false);
    const timer = setInterval(() => {
      fetchNews(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const domesticPages = Math.max(1, Math.ceil(domestic.length / ITEMS_PER_PAGE));
    const internationalPages = Math.max(1, Math.ceil(international.length / ITEMS_PER_PAGE));
    if (domesticPage > domesticPages) setDomesticPage(domesticPages);
    if (internationalPage > internationalPages) setInternationalPage(internationalPages);
  }, [domestic, international, domesticPage, internationalPage]);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Latest Health News</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Auto refresh: 30s</span>
          {newCount > 0 ? (
            <button
              onClick={() => setNewCount(0)}
              className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800"
            >
              {newCount} new
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading latest headlines...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <NewsColumn
            title="Domestic (Liberia)"
            items={domestic}
            page={domesticPage}
            onPageChange={setDomesticPage}
          />
          <NewsColumn
            title="International"
            items={international}
            page={internationalPage}
            onPageChange={setInternationalPage}
          />
        </div>
      )}
    </section>
  );
}
