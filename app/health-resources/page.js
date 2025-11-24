export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Health Resources & Research Data</h1>
        <p className="text-lg text-gray-600 mb-12">
          Stay informed with the latest health insights and medical news.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Research Resources</h2>
          <div className="grid gap-4">
            <a href="https://www.who.int/" target="_blank" rel="noopener noreferrer" 
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">World Health Organization (WHO)</h3>
              <p className="text-gray-600">Global health data and disease surveillance</p>
            </a>
            <a href="https://datatopics.worldbank.org/world-development-indicators/" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">World Development Indicators (WDI)</h3>
              <p className="text-gray-600">Development indicators including health metrics</p>
            </a>
            <a href="https://www.who.int/data/gho" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">Global Health Observatory (GHO)</h3>
              <p className="text-gray-600">WHO portal for health statistics</p>
            </a>
            <a href="https://dhsprogram.com/" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">Demographic and Health Surveys (DHS)</h3>
              <p className="text-gray-600">Household surveys on health and demographics</p>
            </a>
            <a href="https://www.healthdata.org/gbd" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">Global Burden of Disease (GBD)</h3>
              <p className="text-gray-600">Disease burden and mortality data</p>
            </a>
            <a href="https://data.unicef.org/" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">UNICEF Data</h3>
              <p className="text-gray-600">Child health and maternal health statistics</p>
            </a>
            <a href="https://www.lisgis.net/" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">Liberia Institute of Statistics (LISGIS)</h3>
              <p className="text-gray-600">Official statistics from Government of Liberia</p>
            </a>
            <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer"
               className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold text-blue-600">PubMed</h3>
              <p className="text-gray-600">Biomedical and life science literature</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}