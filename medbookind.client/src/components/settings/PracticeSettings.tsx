import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { practiceService } from '@/services/practice.service';
import {
  Building2, Mail, Phone, Globe, MapPin, FileText, ImagePlus, Pencil, Save, X
} from 'lucide-react';

interface PracticeDetails {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  logo?: File | null;
  type?: string;
}

interface PracticeSettingsProps {
  userId?: string | null;
}

const iconClass = "w-5 h-5 text-cyan-500 shrink-0";

const PracticeSettings: React.FC<PracticeSettingsProps> = ({ userId }) => {
  const [practiceDetails, setPracticeDetails] = useState<PracticeDetails | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  React.useEffect(() => {
    if (!userId) {
      setError('No user ID found. Please contact support.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    practiceService.getPracticeByUserId(userId)
      .then(data => {
        if (!data) {
          setError('No practice found for your account. Please contact support.');
          setPracticeDetails(null);
        } else {
          setPracticeDetails(data);
          if (data.logo && typeof data.logo === 'string' && data.logo.length > 100) {
            setLogoPreview(`data:image/png;base64,${data.logo}`);
          } else if (data.logo && Array.isArray(data.logo)) {
            const uint8Array = new Uint8Array(data.logo);
            const base64String = btoa(
              Array.from(uint8Array)
                .map(byte => String.fromCharCode(byte))
                .join('')
            );
            setLogoPreview(`data:image/png;base64,${base64String}`);
          } else if (data.logo && typeof data.logo === 'string') {
            const logoUrl = data.logo.startsWith('http')
              ? data.logo
              : `${process.env.REACT_APP_API_URL || ''}${data.logo}`;
            setLogoPreview(logoUrl);
          }
        }
      })
      .catch(() => {
        setError('Failed to load practice details. Please contact support.');
        setPracticeDetails(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPracticeDetails((prev) => prev ? { ...prev, logo: file } : null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceDetails) return;
    try {
      const formData = new FormData();
      Object.entries(practiceDetails).forEach(([key, value]) => {
        if (key === 'logo' && value && value instanceof File) {
          formData.append('logo', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value as string);
        }
      });
      if (!practiceDetails.id) {
        toast.error('Practice ID is missing.');
        return;
      }
      await practiceService.updatePractice(practiceDetails.id, {
        ...practiceDetails,
        type: practiceDetails.type ?? ""
      });
      toast.success('Practice details updated successfully');
      setShowEdit(false);
    } catch (error) {
      toast.error('Failed to update practice details');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40 text-cyan-700">Loading practice details...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;
  if (!practiceDetails) return null;

  // --- VIEW MODE ---
  if (!showEdit) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-cyan-50 to-white flex justify-center items-start py-16">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-10 px-4">
          {/* Sidebar */}
          <div className="md:w-1/3 w-full sticky top-24 self-start">
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center animate-fade-in">
              <div className="mb-4 relative group">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Practice Logo"
                    className="w-32 h-32 rounded-full border-4 border-cyan-200 shadow object-cover bg-white transition-all duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-400 text-6xl shadow">
                    <Building2 className="w-16 h-16" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-cyan-100 rounded-full shadow transition"
                  aria-label="Edit Practice"
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="w-5 h-5 text-cyan-600" />
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-cyan-800">{practiceDetails.name}</h1>
              <div className="text-cyan-500 text-sm mt-1">{practiceDetails.type || "Practice"}</div>
              <div className="mt-6 flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full border-cyan-300 text-cyan-700 font-semibold shadow hover:bg-cyan-50 transition"
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-cyan-600" />
                <h2 className="text-xl font-bold text-cyan-700">About Practice</h2>
              </div>
              <div className="text-gray-700">{practiceDetails.description || "No description provided."}</div>
            </div>
            {practiceDetails.type && (
              <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                  <h2 className="text-xl font-bold text-cyan-700">Specialties</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {practiceDetails.type.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-cyan-600" />
                <h2 className="text-xl font-bold text-cyan-700">Contact Information</h2>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <Mail className="w-4 h-4 text-cyan-500" />
                  <a href={`mailto:${practiceDetails.email}`} className="hover:underline">{practiceDetails.email}</a>
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <Phone className="w-4 h-4 text-cyan-500" />
                  <span>{practiceDetails.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <MapPin className="w-4 h-4 text-cyan-500" />
                  <span>{practiceDetails.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <Globe className="w-4 h-4 text-cyan-500" />
                  <a
                    href={practiceDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {practiceDetails.website?.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EDIT MODE ---
  return (
    <form onSubmit={handleSubmit} className="w-full min-h-screen bg-gradient-to-br from-cyan-50 to-white pb-16">
      <div className="max-w-3xl mx-auto mt-12 bg-white/90 rounded-2xl shadow-xl p-8 md:p-12 border border-cyan-100 animate-fade-in">
        <h2 className="text-2xl font-bold text-cyan-700 mb-8 text-center">Edit Practice Details</h2>
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex flex-col items-center md:w-1/3 w-full">
            <div className="mb-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white transition-all duration-300" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-400 text-5xl shadow-lg">
                  <ImagePlus className="w-14 h-14" />
                </div>
              )}
            </div>
            <Label htmlFor="logo" className="block font-semibold text-cyan-700 mb-2">Practice Logo</Label>
            <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="w-64 bg-white/80 border border-cyan-200 rounded-full py-2 px-4 shadow" />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <Building2 className={iconClass} /> Practice Name
              </Label>
              <Input
                id="name"
                value={practiceDetails.name}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, name: e.target.value })}
                placeholder="Enter practice name"
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <Mail className={iconClass} /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={practiceDetails.email}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, email: e.target.value })}
                placeholder="Enter email address"
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <Phone className={iconClass} /> Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={practiceDetails.phone}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, phone: e.target.value })}
                placeholder="Enter phone number"
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <Label htmlFor="website" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <Globe className={iconClass} /> Website
              </Label>
              <Input
                id="website"
                type="url"
                value={practiceDetails.website}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, website: e.target.value })}
                placeholder="Enter website URL"
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <Label htmlFor="address" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <MapPin className={iconClass} /> Address
              </Label>
              <Textarea
                id="address"
                value={practiceDetails.address}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, address: e.target.value })}
                placeholder="Enter practice address"
                rows={3}
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <Label htmlFor="description" className="flex items-center gap-2 font-semibold text-cyan-700 mb-1">
                <FileText className={iconClass} /> Description
              </Label>
              <Textarea
                id="description"
                value={practiceDetails.description}
                onChange={(e) => setPracticeDetails({ ...practiceDetails, description: e.target.value })}
                placeholder="Enter practice description"
                rows={4}
                className="bg-cyan-50 border border-cyan-200 focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-10">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
            onClick={() => setShowEdit(false)}
          >
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-lg px-6 py-2 rounded-full transition"
          >
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PracticeSettings;