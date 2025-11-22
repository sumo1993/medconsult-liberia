import { Stethoscope, Heart, Microscope } from 'lucide-react';

const services = [
  {
    icon: Stethoscope,
    title: 'General Consultations',
    description: 'Comprehensive health assessments and personalized treatment plans for various medical conditions.',
  },
  {
    icon: Heart,
    title: 'Chronic Disease Management',
    description: 'Specialized care for hypertension, diabetes, and other chronic conditions common in Liberia.',
  },
  {
    icon: Microscope,
    title: 'Medical Research',
    description: 'Access to cutting-edge medical research and evidence-based treatment approaches.',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4 relative inline-block">
            Our Medical Services
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-20 h-1 bg-emerald-700"></span>
          </h2>
          <p className="text-gray-600 mt-6">Comprehensive healthcare solutions tailored to your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:-translate-y-2 transition-transform"
            >
              <div className="h-20 bg-emerald-50 flex items-center justify-center">
                <service.icon className="text-emerald-700" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-emerald-700 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
