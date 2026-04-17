import HealthNewsBoard from '@/components/HealthNewsBoard';

export default function HealthResourcesPage() {

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Health Resources</h1>
          <p className="text-gray-600 mt-2">
            Latest health headlines with trusted source links. Indicator cards are temporarily removed.
          </p>
        </header>

        <HealthNewsBoard />

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trusted Health Sources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.who.int/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">World Health Organization (WHO)</p>
              <p className="text-sm text-gray-600 mt-1">Global health guidance, data, and alerts.</p>
            </a>

            <a
              href="https://moh.gov.lr/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">Liberia Ministry of Health</p>
              <p className="text-sm text-gray-600 mt-1">Domestic health policies and ministry updates.</p>
            </a>

            <a
              href="https://feeds.bbci.co.uk/news/health/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">BBC Health</p>
              <p className="text-sm text-gray-600 mt-1">International health reporting and analysis.</p>
            </a>

            <a
              href="https://rss.cnn.com/rss/edition_health.rss"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">CNN Health</p>
              <p className="text-sm text-gray-600 mt-1">International health news feed.</p>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
