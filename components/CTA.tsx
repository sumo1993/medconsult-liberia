export default function CTA() {
  return (
    <section
      className="py-20 text-center text-white"
      style={{
        background: 'linear-gradient(rgba(46, 139, 87, 0.9), rgba(46, 139, 87, 0.9)), url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Improve Healthcare in Liberia?
        </h2>
        <p className="text-lg max-w-3xl mx-auto mb-8">
          Whether you need medical consultation, want to partner with us, or support our mission, we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#contact"
            className="inline-block px-8 py-3 bg-white text-emerald-700 font-semibold rounded-md hover:bg-gray-100 transition-all"
          >
            Contact Us Today
          </a>
          <a
            href="#partnerships"
            className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-emerald-700 transition-all"
          >
            Explore Partnerships
          </a>
        </div>
      </div>
    </section>
  );
}
