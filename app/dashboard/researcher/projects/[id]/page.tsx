'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Calendar, Target, Database, Clock,
  CheckCircle, AlertCircle, Upload, FileText, Users,
  TrendingUp
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Project {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending' | 'paused';
  location: string;
  deadline: string;
  data_collected: number;
  target_samples: number;
  created_at: string;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/researcher/projects/${params.id}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={24} />;
      case 'active': return <TrendingUp className="text-blue-500" size={24} />;
      case 'pending': return <Clock className="text-yellow-500" size={24} />;
      default: return <AlertCircle className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <button
            onClick={() => router.push('/dashboard/researcher/projects')}
            className="text-emerald-600 hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const progress = project.target_samples > 0 
    ? Math.round((project.data_collected / project.target_samples) * 100) 
    : 0;

  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/researcher/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Project Details</h1>
                <p className="text-sm text-gray-600">View project information</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${getStatusColor(project.status)}`}>
          {getStatusIcon(project.status)}
          <div>
            <p className="font-semibold capitalize">{project.status} Project</p>
            <p className="text-sm opacity-80">
              {project.status === 'active' && 'This project is currently in progress'}
              {project.status === 'completed' && 'This project has been completed'}
              {project.status === 'pending' && 'This project is awaiting start'}
              {project.status === 'paused' && 'This project is temporarily paused'}
            </p>
          </div>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
          <p className="text-gray-600 mb-6">{project.description}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{project.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="font-medium text-gray-900">
                  {project.deadline 
                    ? new Date(project.deadline).toLocaleDateString() 
                    : 'No deadline set'}
                  {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({daysUntilDeadline} days left)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Target className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Target Samples</p>
                <p className="font-medium text-gray-900">{project.target_samples}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Database className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Data Collected</p>
                <p className="font-medium text-gray-900">{project.data_collected} samples</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Progress</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : 
                  progress >= 50 ? 'bg-emerald-500' : 
                  'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{project.data_collected}</p>
              <p className="text-xs text-gray-500">Collected</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{project.target_samples - project.data_collected}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{project.target_samples}</p>
              <p className="text-xs text-gray-500">Target</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/researcher/submit-data')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Upload size={20} />
            Submit Data for This Project
          </button>
          <button
            onClick={() => router.push('/dashboard/researcher/data-entry')}
            className="flex items-center justify-center gap-2 px-6 py-4 border border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <FileText size={20} />
            Enter Field Data
          </button>
        </div>
      </main>
    </div>
  );
}


