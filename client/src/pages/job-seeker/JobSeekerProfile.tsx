import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI } from '../../services/api';
import PhoneInput from '../../components/ui/PhoneInput';

interface JobSeekerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  location: string;
  bio?: string;
  experience: string;
  skills: string[];
  education?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  isAvailable: boolean;
  preferredSalary?: string;
  industry?: string;
  jobTypes: string[];
}

export default function JobSeekerProfile() {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+233',
    location: '',
    bio: '',
    experience: '',
    skills: [] as string[],
    education: '',
    resumeUrl: '',
    portfolioUrl: '',
    linkedinUrl: '',
    isAvailable: true,
    preferredSalary: '',
    industry: '',
    jobTypes: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const profileData = response.data as JobSeekerProfile;
      setProfile(profileData);
      
      // Populate form with current data
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        countryCode: profileData.countryCode || '+233',
        location: profileData.location || '',
        bio: profileData.bio || '',
        experience: profileData.experience || '',
        skills: profileData.skills || [],
        education: profileData.education || '',
        resumeUrl: profileData.resumeUrl || '',
        portfolioUrl: profileData.portfolioUrl || '',
        linkedinUrl: profileData.linkedinUrl || '',
        isAvailable: profileData.isAvailable ?? true,
        preferredSalary: profileData.preferredSalary || '',
        industry: profileData.industry || '',
        jobTypes: profileData.jobTypes || [],
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await userAPI.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile(); // Refresh profile
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your professional information</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          {success}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">{profile?.firstName || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">{profile?.lastName || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <PhoneInput
                    countryCode={formData.countryCode}
                    phoneNumber={formData.phone}
                    onCountryCodeChange={(code) => setFormData({...formData, countryCode: code})}
                    onPhoneNumberChange={(phone) => setFormData({...formData, phone})}
                    label=""
                  />
                ) : (
                  <div className="text-gray-900">
                    {profile?.phone ? `${profile.countryCode || '+233'} ${profile.phone}` : 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., New York, NY or Remote"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">{profile?.location || 'Not specified'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level *
                </label>
                {isEditing ? (
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select experience level</option>
                    <option value="Entry Level">Entry Level (0-2 years)</option>
                    <option value="Mid Level">Mid Level (3-5 years)</option>
                    <option value="Senior Level">Senior Level (6-10 years)</option>
                    <option value="Executive">Executive (10+ years)</option>
                  </select>
                ) : (
                  <div className="text-gray-900">{profile?.experience || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g., Technology, Healthcare, Finance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">{profile?.industry || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Salary Range
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.preferredSalary}
                    onChange={(e) => setFormData({...formData, preferredSalary: e.target.value})}
                    placeholder="e.g., $60,000 - $80,000 or Negotiable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">{profile?.preferredSalary || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    placeholder="Tell us about yourself, your background, and what you're looking for..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900 whitespace-pre-wrap">{profile?.bio || 'Not specified'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            {isEditing ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={addSkill}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {skill}
                  </span>
                )) || <div className="text-gray-500">No skills added</div>}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Links & Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({...formData, resumeUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">
                    {profile?.resumeUrl ? (
                      <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View Resume
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">
                    {profile?.portfolioUrl ? (
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View Portfolio
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <div className="text-gray-900">
                    {profile?.linkedinUrl ? (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View LinkedIn
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="flex items-center">
              {isEditing ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I am currently available for new opportunities
                  </span>
                </label>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile?.isAvailable ? 'Available for opportunities' : 'Not currently looking'}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
