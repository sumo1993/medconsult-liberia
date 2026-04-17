import {
  Stethoscope,
  Heart,
  Microscope,
  LineChart,
  GraduationCap,
  ClipboardList,
  Hospital,
  ShieldAlert,
  School,
  Recycle,
  Syringe,
} from 'lucide-react';

const clinicalServices: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
}[] = [
  {
    icon: Stethoscope,
    title: 'General Consultations',
    description:
      'Comprehensive health assessments and personalized treatment plans for various medical conditions.',
  },
  {
    icon: Heart,
    title: 'Chronic Disease Management',
    description:
      'Specialized care for hypertension, diabetes, and other chronic conditions common in Liberia.',
  },
  {
    icon: Microscope,
    title: 'Medical Research',
    description:
      'Access to cutting-edge medical research and evidence-based treatment approaches.',
  },
];

const programServices: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
}[] = [
  {
    icon: LineChart,
    title: 'Monitoring & evaluation (M&E) systems',
    description:
      'Developing monitoring and evaluation system strengthening tools to track programs and outcomes.',
  },
  {
    icon: GraduationCap,
    title: 'Training on tropical diseases',
    description:
      'Training health workers on tropical diseases including malaria, sexually transmitted infections (STIs), and related conditions.',
  },
  {
    icon: ClipboardList,
    title: 'Survey design & implementation',
    description:
      'Conducting surveys of all kinds—household, health facility, KAP, and operational research.',
  },
  {
    icon: Hospital,
    title: 'Health facility data collection',
    description:
      'Structured data collection in health facilities to support quality improvement and reporting.',
  },
  {
    icon: ShieldAlert,
    title: 'Gender-based violence (GBV) tracking',
    description:
      'Supporting ethical tracking and referral pathways for gender-based violence within health and community programs.',
  },
  {
    icon: School,
    title: 'Community health education',
    description:
      'Health education in churches, schools, mosques, and other community settings.',
  },
  {
    icon: Recycle,
    title: 'Waste management & collection',
    description:
      'Planning and support for health-care waste management and safe collection practices.',
  },
  {
    icon: Syringe,
    title: 'Vaccination program planning',
    description:
      'Planning and coordination support for immunization and vaccination campaigns.',
  },
];

function ServiceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:-translate-y-2 transition-transform border border-gray-100">
      <div className="h-20 bg-emerald-50 flex items-center justify-center">
        <Icon className="text-emerald-700" size={48} />
      </div>
      <div className="px-5 py-6 sm:px-6 sm:py-7 text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 mb-3.5 text-balance leading-snug">
          {title}
        </h3>
        <p className="text-gray-600 text-base sm:text-[1.0625rem] leading-relaxed text-balance">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4 relative inline-block">
            Our Services &amp; Programs
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-20 h-1 bg-emerald-700" />
          </h2>
          <p className="text-gray-600 mt-6 max-w-3xl mx-auto">
            Clinical care and research, plus public health, monitoring, and community programs across Liberia.
          </p>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Clinical &amp; research
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {clinicalServices.map((service, index) => (
            <ServiceCard key={`clinical-${index}`} {...service} />
          ))}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Monitoring, public health &amp; community programs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {programServices.map((service, index) => (
            <ServiceCard key={`program-${index}`} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
