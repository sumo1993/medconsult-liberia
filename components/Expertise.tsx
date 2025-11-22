import { Building2, HandHeart, Landmark, GraduationCap } from 'lucide-react';

const expertiseAreas = [
  {
    icon: Building2,
    title: 'Clinic Setup & Management',
    description: 'Extensive experience establishing and operating healthcare facilities in Liberia.',
  },
  {
    icon: HandHeart,
    title: 'NGO Partnerships',
    description: 'Collaboration with international and local NGOs on healthcare initiatives.',
  },
  {
    icon: Landmark,
    title: 'Government Projects',
    description: 'Contributing to national healthcare policies and public health programs.',
  },
  {
    icon: GraduationCap,
    title: 'Medical Education',
    description: 'Training healthcare professionals and community health workers.',
  },
];

export default function Expertise() {
  return (
    <section id="research" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4 relative inline-block">
            Areas of Expertise
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-20 h-1 bg-emerald-700"></span>
          </h2>
          <p className="text-gray-600 mt-6">Leveraging diverse experience for better healthcare outcomes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {expertiseAreas.map((area, index) => (
            <div
              key={index}
              className="text-center p-8 bg-gray-50 rounded-lg shadow-md hover:-translate-y-1 transition-transform"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <area.icon className="text-emerald-700" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {area.title}
              </h3>
              <p className="text-gray-600 text-sm">{area.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
