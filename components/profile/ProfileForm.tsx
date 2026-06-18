"use client";

import { useState, useTransition, useRef, ChangeEvent } from "react";
import { Camera, Save, Loader2, User, Mail, Phone, MapPin, Briefcase, Heart, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateProfileAction } from "@/features/profile/actions";
import { getPresignedUploadUrlAction } from "@/features/evidences/actions";

interface ProfileFormProps {
  initialData: {
    id: number;
    name: string;
    email: string;
    imageUrl?: string | null;
    roles: string[];
    volunteer?: {
      phone: string;
      nationality: string;
      profession: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      inmediateAvailability: boolean;
    } | null;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({ ...initialData });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVolunteer = formData.roles.includes("VOLUNTEER");

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith("volunteer.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        volunteer: {
          ...prev.volunteer!,
          [field]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      // 1. Get presigned URL
      const res = await getPresignedUploadUrlAction(file.name, file.type);
      
      if (!res.success || !res.data) {
        throw new Error(res.error || "No se pudo obtener la URL de subida");
      }

      // 2. Upload file
      const uploadRes = await fetch(res.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        // If fake URL fails, simulate success for development:
        if (res.data.uploadUrl.includes("fake-s3")) {
          console.warn("Using fake S3 upload");
        } else {
          throw new Error("Error al subir el archivo");
        }
      }

      // 3. Update state with new URL
      setFormData(prev => ({ ...prev, imageUrl: res.data!.fileUrl }));
      showMessage("success", "Imagen actualizada exitosamente. No olvides guardar los cambios.");
    } catch (error: any) {
      showMessage("error", error.message || "Error al actualizar la imagen");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await updateProfileAction({
        name: formData.name,
        imageUrl: formData.imageUrl || undefined,
        volunteerData: formData.volunteer ? formData.volunteer : undefined
      });
      if (res.success) {
        showMessage("success", "Perfil actualizado correctamente");
      } else {
        showMessage("error", res.error || "Error al actualizar el perfil");
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Messages */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-8 ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800" 
            : "bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Background Gradient Decorative */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 opacity-90"></div>
          
          <div className="relative px-8 pb-8 pt-16 sm:px-12">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Profile Avatar */}
              <div className="relative group">
                <div 
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 cursor-pointer`}
                  onClick={handleImageClick}
                >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  )}
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden" 
                />
              </div>

              {/* Basic Info Summary */}
              <div className="flex-1 text-center sm:text-left mt-2 sm:mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{formData.email}</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  {formData.roles.map(role => (
                    <span key={role} className="px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Información General
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Nombre Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="block w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed opacity-80"
                  />
                </div>
                <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
                  El correo no se puede cambiar por seguridad.
                </p>
              </div>
            </div>
          </div>

          {/* Volunteer Information Card */}
          {isVolunteer && formData.volunteer && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Datos de Voluntario
              </h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Teléfono</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="volunteer.phone"
                        value={formData.volunteer.phone}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Nacionalidad</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="volunteer.nationality"
                        value={formData.volunteer.nationality}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Profesión</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="volunteer.profession"
                      value={formData.volunteer.profession}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Nombre</label>
                      <input
                        type="text"
                        name="volunteer.emergencyContactName"
                        value={formData.volunteer.emergencyContactName}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Teléfono</label>
                      <input
                        type="text"
                        name="volunteer.emergencyContactPhone"
                        value={formData.volunteer.emergencyContactPhone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="volunteer.inmediateAvailability"
                        checked={formData.volunteer.inmediateAvailability}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-500" />
                        Disponibilidad Inmediata
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Estoy disponible para tareas urgentes</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
            onClick={() => setFormData({ ...initialData })}
          >
            Descartar Cambios
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Perfil
          </button>
        </div>
      </form>
    </div>
  );
}
