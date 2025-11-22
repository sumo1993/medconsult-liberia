'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';

export default function ApplyTeamPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    education: '',
    licenseNumber: '',
    availability: '',
    motivation: '',
    resume: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedFilename = null;

      // Upload resume file first if provided
      if (formData.resume) {
        console.log('Uploading resume file...');
        const fileFormData = new FormData();
        fileFormData.append('file', formData.resume);

        const uploadResponse = await fetch('/api/upload-resume', {
          method: 'POST',
          body: fileFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedFilename = uploadData.filename;
          console.log('Resume uploaded:', uploadedFilename);
        } else {
          let errorMessage = 'Unknown error';
          try {
            const errorData = await uploadResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = await uploadResponse.text();
          }
          console.error('Upload error:', errorMessage);
          alert(`Failed to upload resume: ${errorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Submit application with uploaded filename
      console.log('Submitting application...');
      const response = await fetch('/api/team-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          experience: formData.experience,
          education: formData.education,
          licenseNumber: formData.licenseNumber,
          availability: formData.availability,
          motivation: formData.motivation,
          resumeFilename: uploadedFilename
        }),
      });

      if (response.ok) {
        console.log('Application submitted successfully!');
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        console.error('Submission error:', errorData);
        alert(`Failed to submit application: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="text-green-600 mx-auto" size={64} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to join the MedConsult Liberia team. We have received your application 
            and will review it within 3-5 business days. You will receive an email notification regarding 
            the next steps.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push('/dashboard/general-consultation')}
              className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-semibold"
            >
              View Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Team</h1>
            <p className="text-gray-600">
              Fill out the application form below to become a part of MedConsult Liberia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+231 XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialty/Field *
                  </label>
                  <select
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Specialty</option>
                    <option value="general_medicine">General Medicine</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="surgery">Surgery</option>
                    <option value="obstetrics">Obstetrics & Gynecology</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="psychiatry">Psychiatry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Education & Qualifications *
                  </label>
                  <textarea
                    required
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="List your degrees, certifications, and relevant qualifications..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medical License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LIC-XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Availability *
                  </label>
                  <select
                    required
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Availability</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Why do you want to join MedConsult Liberia? *
                  </label>
                  <textarea
                    required
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                    placeholder="Tell us about your motivation and what you hope to achieve..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Resume/CV (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold">
                        Click to upload
                      </span>
                      <span className="text-gray-600"> or drag and drop</span>
                      <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX (max 25MB)</p>
                    </label>
                    {formData.resume && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {formData.resume.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
