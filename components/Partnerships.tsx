import { Handshake, DollarSign, Users } from 'lucide-react';

const partnerships = [
  {
    icon: Handshake,
    title: 'Government Collaboration',
    description: 'We are open to working with government agencies on public health initiatives, policy development, and healthcare infrastructure projects.',
    buttonText: 'Propose Collaboration',
    buttonStyle: 'bg-yellow-600 hover:bg-yellow-700 text-gray-900',
  },
  {
    icon: DollarSign,
    title: 'Donor Partnerships',
    description: 'We welcome support from donors and philanthropic organizations to fund medical equipment, community health programs, and clinic expansions.',
    buttonText: 'Discuss Donation',
    buttonStyle: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  {
    icon: Users,
    title: 'NGO Alliances',
    description: 'We seek partnerships with NGOs to implement health education programs, vaccination campaigns, and specialized medical services.',
    buttonText: 'Explore Partnership',
    buttonStyle: 'bg-yellow-600 hover:bg-yellow-700 text-gray-900',
  },
];

export default function Partnerships() {
  return (
    <section id="partnerships" className="py-20 bg-emerald-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4 relative inline-block">
            Partnership Opportunities
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-20 h-1 bg-emerald-700"></span>
          </h2>
          <p className="text-gray-600 mt-6">We welcome collaborations to expand healthcare access in Liberia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partnerships.map((partnership, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <partnership.icon className="text-emerald-700" size={36} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {partnership.title}
              </h3>
              <p className="text-gray-600 mb-6">{partnership.description}</p>
              <a
                href={partnership.buttonText === 'Discuss Donation' ? '/donate' : '#contact'}
                className={`inline-block px-6 py-3 font-semibold rounded-md transition-all ${partnership.buttonStyle}`}
              >
                {partnership.buttonText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
