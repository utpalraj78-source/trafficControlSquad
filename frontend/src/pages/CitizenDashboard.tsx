import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { trafficApi } from '../services/api';
import { MapPin, Camera, AlertCircle, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// SVG marker for citizen exact location
const citizenIcon = new L.DivIcon({
  html: `<div class="relative w-8 h-8">
           <div class="absolute inset-0 bg-blue-500/30 border-2 border-blue-500 rounded-full animate-ping"></div>
           <div class="absolute top-1 left-1 w-6 h-6 bg-blue-500 border border-slate-900 rounded-full flex items-center justify-center shadow-lg">
             <div class="w-2.5 h-2.5 bg-slate-100 rounded-full"></div>
           </div>
         </div>`,
  className: 'custom-leaflet-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const tableBodyVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

export default function CitizenDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Fetch past reports submitted by this citizen
  const fetchMyReports = async () => {
    try {
      const data = await trafficApi.getCitizenReports();
      setReports(data);
    } catch (e) {
      console.error("Failed to fetch citizen reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Unable to retrieve exact location. Please allow GPS access in your browser settings to report.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || latitude === null || longitude === null) {
      setError("You must upload an image and share your exact location to submit a report.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await trafficApi.submitCitizenReport(file, latitude, longitude, description);
      setSuccess(true);
      // Reset form
      setFile(null);
      setPreviewUrl(null);
      setLatitude(null);
      setLongitude(null);
      setDescription('');
      
      // Reload reports
      fetchMyReports();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Citizen Assistance Portal</h1>
        <p className="text-sm text-slate-400">Report local traffic congestion or crowds. Submissions are instantly routed to the AI Command Center.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Form: Submit Report */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl border border-slate-800 space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-police-gold border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Camera className="w-4.5 h-4.5 text-police-gold" />
              <span>Report Incident</span>
            </h3>

            <AnimatePresence mode="wait">
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-center space-x-3 text-emerald-400 text-xs font-semibold"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                  <span>Report successfully submitted! The AI Command Center has been notified. Thank you for keeping Bengaluru safe!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg flex items-center space-x-3 text-red-400 text-xs font-semibold"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Geolocation Lock */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exact Geolocation Lock (Required)</label>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <motion.div 
                  animate={latitude !== null ? { scale: [1, 1.02, 1] } : {}}
                  className={`border p-2.5 rounded text-xs select-none transition-colors duration-300 ${latitude !== null ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-[#050B14] border-slate-800'}`}
                >
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Latitude</span>
                  <span className={`font-mono font-semibold ${latitude !== null ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {latitude !== null ? latitude.toFixed(6) : "Not shared"}
                  </span>
                </motion.div>
                <motion.div 
                  animate={longitude !== null ? { scale: [1, 1.02, 1] } : {}}
                  className={`border p-2.5 rounded text-xs select-none transition-colors duration-300 ${longitude !== null ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-[#050B14] border-slate-800'}`}
                >
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Longitude</span>
                  <span className={`font-mono font-semibold ${longitude !== null ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {longitude !== null ? longitude.toFixed(6) : "Not shared"}
                  </span>
                </motion.div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleShareLocation}
                disabled={locating}
                className={`w-full py-2.5 text-xs font-bold uppercase rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
                  latitude !== null 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 radar-beacon' 
                    : 'bg-[#0B132B] hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
              >
                {locating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-police-gold" />
                    <span>Locking GPS Signal...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>{latitude !== null ? "📍 GPS Location Locked" : "📍 Share Current Location"}</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Incident Photo (Required)</label>
              <div className="relative group border border-dashed border-slate-800 hover:border-police-gold/50 rounded-lg p-6 bg-[#050B14]/40 hover:bg-[#050B14]/70 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer">
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <AnimatePresence mode="wait">
                  {previewUrl ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-3"
                    >
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-40 rounded border border-slate-800 object-cover shadow hover-glow-gold transition-all duration-200"
                      />
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{file?.name}</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="uploader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Camera className="w-8 h-8 text-slate-500 mb-2.5 group-hover:text-police-gold transition-colors duration-200" />
                      <p className="text-xs font-semibold text-slate-400">Click or Drag Image here</p>
                      <span className="text-[9px] text-slate-500 mt-1 uppercase">Supports JPEG, PNG</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Comments (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., extreme water logging blocking two lanes..."
                rows={3}
                className="w-full bg-[#0B132B] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none resize-none focus:border-police-gold/50 transition-colors duration-250"
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={!(submitting || !file || latitude === null) ? { scale: 1.01 } : {}}
              whileTap={!(submitting || !file || latitude === null) ? { scale: 0.99 } : {}}
              disabled={submitting || !file || latitude === null}
              className="w-full py-3.5 bg-police-gold hover:bg-police-gold/90 disabled:opacity-40 disabled:hover:bg-police-gold text-[#0B132B] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-police-gold/5"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Right Side: Map & My Reports */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map showing current report location or past reports */}
          <div className="h-[250px] glass-panel rounded-xl overflow-hidden border border-slate-800 relative shadow-lg">
            <MapContainer center={[12.9234, 77.6412]} zoom={11} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* Active report marker */}
              {latitude !== null && longitude !== null && (
                <Marker position={[latitude, longitude]} icon={citizenIcon}>
                  <Popup>
                    <span className="text-slate-900 font-bold text-xs">Reporting Location</span>
                  </Popup>
                </Marker>
              )}

              {/* Past reports markers */}
              {reports.map((rep) => (
                <Marker key={rep.event_id} position={[rep.latitude, rep.longitude]}>
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <h4 className="font-bold text-xs uppercase">{rep.event_id}</h4>
                      <p className="text-[10px] text-slate-600 mt-1">{rep.junction}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{rep.description}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Submissions Table */}
          <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">My Reports History</h3>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 rounded">Total: {reports.length}</span>
            </div>

            {loadingReports ? (
              <div className="py-12 flex justify-center"><RefreshCw className="w-7 h-7 animate-spin text-police-gold" /></div>
            ) : reports.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                No reports submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[9px] uppercase text-slate-400 font-extrabold tracking-wider">
                      <th className="pb-3">Report ID</th>
                      <th className="pb-3">Junction / Location</th>
                      <th className="pb-3">GPS Coordinates</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    variants={tableBodyVariants}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-slate-800/60 text-xs font-semibold text-slate-300"
                  >
                    {reports.map((rep) => (
                      <motion.tr 
                        variants={rowVariants}
                        key={rep.event_id} 
                        className="hover:bg-slate-800/10"
                      >
                        <td className="py-3 font-mono text-[10px] text-slate-400">{rep.event_id}</td>
                        <td className="py-3 text-slate-200">{rep.junction}</td>
                        <td className="py-3 text-slate-400 font-mono text-[10px]">{rep.latitude.toFixed(4)}, {rep.longitude.toFixed(4)}</td>
                        <td className="py-3 text-slate-400">{new Date(rep.timestamp).toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded border ${
                            rep.status === 'cleared'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-police-red animate-pulse'
                          }`}>
                            {rep.status === 'cleared' ? 'Resolved' : 'Active'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
