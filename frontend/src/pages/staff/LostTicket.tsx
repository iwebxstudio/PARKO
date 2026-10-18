// ============================================
// PARKO — ໜ້າຈັດການແຈ້ງປີ້ລົດເສຍ (Lost Ticket Page)
// ໜ້າທີ່: ຈັດການການບັນທຶກກໍລະນີປີ້ລົດເສຍ, ຄົ້ນຫາຂໍ້ມູນລົດ, ຖ່າຍຮູບຫຼັກຖານ (ຄົນຂັບ, ບັດ, ເອກະສານ, ລົດ) ແລະ ຄິດໄລ່ຄ່າປັບໃໝ
// ============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Camera, Check, CheckCheck, Search, X,
  RefreshCw, Save, Ticket, PlusCircle, Car, Eye, Clock,
  FolderOpen, Smartphone, SwitchCamera, RotateCcw, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function LostTicket() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [multipleTickets, setMultipleTickets] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState<number | ''>('');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    ticketNumber: string;
    vehicleType: string;
    plateText: string;
    penaltyAmount: number;
    notes: string;
  } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  const search = async () => {
    const q = query.trim();
    if (!q) {
      toast.error('ກະລຸນາໃສ່ Ticket ID, ເລກປ້າຍ ຫຼື ໂຕອັກສອນ');
      return;
    }
    setLoadingSearch(true);
    setNotFound(false);
    try {
      const { data } = await api.get(`/parking/find/${q}`);
      const payload = data.data || data;

      if (payload.isMultiple) {
        setMultipleTickets(payload.data || []);
        setTicket(null);
        setNotFound(false);
        toast.success(`ພົບລົດ ${payload.data.length} ຄັນ, ກະລຸນາເລືອກ`);
      } else {
        const found = payload.isMultiple === false ? payload.data : payload;
        setTicket(found);
        setMultipleTickets([]);
        setNotFound(false);
        toast.success('ພົບຂໍ້ມູນລົດແລ້ວ!');
      }
    } catch (e: any) {
      setTicket(null);
      setMultipleTickets([]);
      setNotFound(true);
    } finally {
      setLoadingSearch(false);
    }
  };

  // ສະຖານະການເປີດກ້ອງຖ່າຍຮູບ ແລະ ເລືອກຮູບພາບ (Camera & Image Picker State)
  const [cameraSlot, setCameraSlot] = useState<{ key: string; label: string } | null>(null);
  const [choiceSlot, setChoiceSlot] = useState<{ key: string; label: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null);

  // ສະຖານະການສະແດງພາບສົດຈາກກ້ອງ (Live Camera Stream State)
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch { /* ignore */ }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = React.useCallback(async (mode?: 'environment' | 'user') => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);
    setCapturedDataUrl(null);
    setCapturedBlob(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('ບຣາວເຊີນີ້ບໍ່ຮອງຮັບການເປີດກ້ອງໂດຍກົງ ກະລຸນາເລືອກຮູບຈາກເຄື່ອງ ຫຼື ໃຊ້ກ້ອງມືຖື');
      setCameraLoading(false);
      return;
    }

    const currentMode = mode || facingMode;
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: currentMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch { /* play error */ }
      }
    } catch (err: any) {
      console.error('Camera open error:', err);
      let msg = 'ບໍ່ສາມາດເປີດກ້ອງໄດ້';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'ກະລຸນາອະນຸຍາດ (Allow) ການເຂົ້າເຖິງກ້ອງໃນບຣາວເຊີ';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'ບໍ່ພົບອຸປະກອນກ້ອງ (Webcam) ໃນເຄື່ອງນີ້';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'ກ້ອງກຳລັງຖືກໃຊ້ໂດຍໂປຣແກຣມອື່ນ ຫຼື ຖືກລັອກ';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  }, [facingMode, stopCamera]);

  React.useEffect(() => {
    if (cameraSlot) {
      const initialFacing = cameraSlot.key === 'face_photo' ? 'user' : 'environment';
      setFacingMode(initialFacing);
      startCamera(initialFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraSlot]);

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedDataUrl(dataUrl);
        }
      },
      'image/jpeg',
      0.92,
    );
  };

  const confirmCapturedPhoto = async () => {
    if (!capturedBlob || !cameraSlot) return;
    const file = new File([capturedBlob], `${cameraSlot.key}_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    const targetKey = cameraSlot.key;
    stopCamera();
    setCameraSlot(null);
    await uploadPhoto(file, targetKey);
  };

  const retakeSnapshot = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const switchFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const triggerDeviceUpload = (key: string) => {
    setChoiceSlot(null);
    const input = document.getElementById(`device-input-${key}`) as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const triggerNativeCamera = (key: string) => {
    setChoiceSlot(null);
    const input = document.getElementById(`native-camera-input-${key}`) as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const uploadPhoto = async (file: File, key: string) => {
    setLoadingPhoto(key);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = (data.data || data).url;
      setPhotos((prev) => ({ ...prev, [key]: url }));
      toast.success('ອັບໂຫລດຮູບສຳເລັດ');
    } catch {
      toast.error('ອັບໂຫລດຮູບລົ້ມເຫລວ');
    } finally {
      setLoadingPhoto(null);
    }
  };

  const removePhoto = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setPhotos((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const resetForm = () => {
    setDone(false);
    setTicket(null);
    setMultipleTickets([]);
    setNotFound(false);
    setNotes('');
    setPhotos({});
    setQuery('');
    setPenaltyAmount('');
    setSubmittedData(null);
    setCameraSlot(null);
    setChoiceSlot(null);
    setPreviewImage(null);
  };

  const handleSubmit = async () => {
    if (!ticket) {
      toast.error('ກະລຸນາຄົ້ນຫາ ແລະ ເລືອກ Ticket ກ່ອນ');
      return;
    }
    if (!notes.trim()) {
      toast.error('ກະລຸນາໃສ່ໝາຍເຫດ');
      return;
    }

    setLoadingSubmit(true);
    try {
      await api.post('/lost-tickets', {
        ticketId: ticket.id,
        notes: notes.trim(),
        penaltyAmount: Number(penaltyAmount) || 0,
        vehiclePhotoUrl: photos.vehicle_front_photo || photos.vehicle_doc_photo || '',
        driverPhotoUrl: photos.face_photo || '',
        idCardPhotoUrl: photos.id_card_photo || '',
      });

      const plateText = ticket.plateNumber
        ? `${ticket.plateProvince || ''} ${ticket.plateLetters || ''} ${ticket.plateNumber}`.trim()
        : 'ລົດບໍ່ມີປ້າຍ';

      setSubmittedData({
        ticketNumber: ticket.ticketNumber,
        vehicleType: ticket.vehicleType?.label || '-',
        plateText,
        penaltyAmount: Number(penaltyAmount) || 0,
        notes: notes.trim(),
      });

      setDone(true);
      toast.success('ບັນທຶກ Lost Ticket ສຳເລັດ');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ບັນທຶກບໍ່ສຳເລັດ');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    setTicket(null);
    setMultipleTickets([]);
    setQuery('');
    setNotes('');
    setPenaltyAmount('');
    setPhotos({});
    setNotFound(false);
    setCameraSlot(null);
    setChoiceSlot(null);
    setPreviewImage(null);
    toast.success('ຍົກເລີກການເລືອກແລ້ວ');
  };

  const photoSlots = [
    { key: 'face_photo', label: 'ຮູບໜ້າເຈົ້າຂອງລົດ' },
    { key: 'id_card_photo', label: 'ຮູບໃບຂັບຂີ່/ບັດປະຈຳຕົວ' },
    { key: 'vehicle_doc_photo', label: 'ຮູບເອກະສານລົດ' },
    { key: 'vehicle_front_photo', label: 'ຮູບໜ້າລົດ/ປ້າຍລົດ' },
  ];

  const getPhotoSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  if (done) {
    return (
      <div className="font-sans w-full flex flex-col">
        {/* ບັດຫຼັກສະແດງຜົນການບັນທຶກສຳເລັດ */}
        <div
          className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
          style={{ borderRadius: 0 }}
        >
          {/* ແຖບຫົວຂໍ້ດ້ານເທິງ — ສີເທົາເຂັ້ມ */}
          <div
            className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 rounded-none"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2.5 h-10 shrink-0">
              <AlertTriangle size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ແຈ້ງປີ້ລົດເສ່ຍ
              </h1>
            </div>
          </div>

          {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານເທິງ */}
          <div className="h-[2.5px] bg-[#B02019] w-full" />

          {/* ສ່ວນເນື້ອໃນ — ພື້ນຫຼັງສີສົ້ມ */}
          <div className="bg-[#F9A825] p-3 sm:p-6 py-8 sm:py-14 flex justify-center items-center">
            <div className="bg-white p-6 sm:p-9 text-center shadow-2xl max-w-lg w-full rounded-none border border-amber-200/80 animate-scale-in relative overflow-hidden">
              {/* ເສັ້ນແຖບສີຕົກແຕ່ງດ້ານເທິງສຸດຂອງບັດ */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

              {/* ໄອຄອນສະແດງຜົນສຳເລັດພ້ອມແອນິເມຊັນວົງແຫວນຄູ່ */}
              <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100/70 animate-ping opacity-40" />
                <div className="w-18 h-18 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-inner">
                  <div className="w-13 h-13 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                    <CheckCheck className="w-7 h-7 text-white stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* ຫົວຂໍ້ແຈ້ງເຕືອນຜົນສຳເລັດ */}
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1.5 tracking-tight">
                ບັນທຶກສຳເລັດ!
              </h2>
              <p className="text-gray-600 text-sm sm:text-base font-bold mb-6">
                ບັນທຶກກໍລະນີປີ້ລົດເສຍຮຽບຮ້ອຍແລ້ວ
              </p>

              {/* ບັດສະຫຼຸບຂໍ້ມູນໃບຮັບເງິນ / ກໍລະນີປີ້ເສຍ */}
              {submittedData && (
                <div className="bg-[#FFFAEE] border border-amber-200/80 p-4 sm:p-5 mb-6 text-left shadow-2xs divide-y divide-amber-200/60">
                  <div className="flex items-center justify-between pb-2.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket ID</span>
                    <span className="font-mono text-base sm:text-lg font-black text-black">#{submittedData.ticketNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs font-bold text-gray-500">ທະບຽນ & ປະເພດ</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      {submittedData.plateText} <span className="text-amber-800">({submittedData.vehicleType})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs font-bold text-gray-500">ຄ່າປັບໃໝ</span>
                    <span className="text-base sm:text-lg font-black text-[#B02019]">
                      {submittedData.penaltyAmount.toLocaleString()} ກີບ
                    </span>
                  </div>
                  {submittedData.notes && (
                    <div className="pt-2.5 text-xs sm:text-sm text-gray-700">
                      <span className="font-bold text-gray-500">ໝາຍເຫດ:</span> {submittedData.notes}
                    </div>
                  )}
                </div>
              )}

              {/* ປຸ່ມຄຳສັ່ງດຳເນີນການຕໍ່ */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-[#B02019] hover:bg-[#991B1B] text-white py-3.5 px-4 font-bold text-sm sm:text-base rounded-none shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlusCircle size={18} />
                  <span>ສ້າງ Case ໃໝ່</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/staff/lost-ticket-history')}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 py-3.5 px-4 font-bold text-sm sm:text-base rounded-none shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye size={18} className="text-gray-600" />
                  <span>ເບິ່ງປະຫວັດປີ້ເສຍ</span>
                </button>
              </div>
            </div>
          </div>

          {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານລຸ່ມ */}
          <div className="h-[2.5px] bg-[#B02019] w-full" />

          {/* ແຖບທ້າຍລຸ່ມສຸດ — ສີເທົາເຂັ້ມ */}
          <div
            className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16"
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>
    );
  }

  const plateText = ticket
    ? (ticket.plateNumber
        ? `${ticket.plateProvince || ''} ${ticket.plateLetters || ''} ${ticket.plateNumber}`.trim()
        : 'ລົດບໍ່ມີປ້າຍ')
    : '';

  return (
    <div className="font-sans w-full flex flex-col">
      {/* ບັດຫຼັກຂອງໜ້າແຈ້ງປີ້ລົດເສຍ */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວຂໍ້ດ້ານເທິງ — ສີເທົາເຂັ້ມ */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ແຖວເທິງໃນຈໍມືຖື / ສ່ວນຊ້າຍໃນຈໍຄອມພິວເຕີ: ໄອຄອນ ແລະ ຫົວຂໍ້ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <AlertTriangle size={20} className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white shrink-0" />
              <h1 className="text-sm sm:text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ແຈ້ງປີ້ລົດເສ່ຍ
              </h1>
            </div>
          </div>

          {/* ດ້ານຂວາ: ຊ່ອງປ້ອນຂໍ້ມູນຄົ້ນຫາປີ້ລົດ */}
          <div className="flex items-center gap-2 sm:gap-3 justify-end w-full md:w-auto shrink-0">
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="ticketSearchFilter"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາ Ticket ID,ເລກປ້າຍ"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (notFound) setNotFound(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setNotFound(false);
                  }}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={search}
                disabled={loadingSearch}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loadingSearch ? <RefreshCw size={16} className="animate-spin text-black" /> : 'ຄົ້ນຫາ'}
              </button>
            </div>
          </div>
        </div>

        {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານເທິງ */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* ສ່ວນເນື້ອໃນ — ພື້ນຫຼັງສີສົ້ມ/ເຫຼືອງ */}
        <div className="bg-[#F9A825] p-3 sm:p-4 md:p-5 flex flex-col justify-start">
          {/* ແຖບແຈ້ງເຕືອນກໍລະນີຄົ້ນຫາບໍ່ພົບຂໍ້ມູນ */}
          {notFound && (
            <div className="bg-white/95 border-l-4 border-[#B02019] p-3 sm:p-3.5 mb-3 sm:mb-3.5 shadow-md flex items-center justify-between text-black font-bold text-sm sm:text-base animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#B02019] shrink-0" />
                <span>ບໍ່ພົບ Ticket ທີ່ກຳລັງຈອດຢູ່ (ກະລຸນາກວດສອບ Ticket ID ຫຼື ປ້າຍລົດຄືນໃໝ່)</span>
              </div>
              <button
                type="button"
                onClick={() => setNotFound(false)}
                className="text-gray-500 hover:text-black p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ບັດສະແດງຂໍ້ມູນລົດ — ຈະສະແດງເມື່ອຄົ້ນພົບ Ticket ແລ້ວ */}
          {ticket && (
            <div className="bg-white shadow-md rounded-none w-full py-4 sm:py-5 px-3 sm:px-4 mb-3 sm:mb-4 animate-scale-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-center gap-3 sm:gap-2 lg:gap-0 lg:divide-x-2 divide-gray-700">
                {/* ຖັນ 1: ລະຫັດປີ້ (Ticket ID) */}
                <div className="flex items-center justify-center px-3 text-center">
                  <span className="text-base sm:text-[17px] md:text-lg font-bold text-black whitespace-nowrap">
                    Ticket ID : {ticket.ticketNumber || ticket.id}
                  </span>
                </div>

                {/* ຖັນ 2: ສະຖານະການຈອດ */}
                <div className="flex items-center justify-center px-3 text-center">
                  <span className="text-base sm:text-[17px] md:text-lg font-bold text-black whitespace-nowrap">
                    ສະຖານະ : {ticket.status === 'ACTIVE' ? 'ກຳລັງຈອດ' : (ticket.status || 'ກຳລັງຈອດ')}
                  </span>
                </div>

                {/* ຖັນ 3: ປະເພດລົດ */}
                <div className="flex items-center justify-center px-3 text-center">
                  <span className="text-base sm:text-[17px] md:text-lg font-bold text-black whitespace-nowrap">
                    ປະເພດ : {ticket.vehicleType?.label || '-'}
                  </span>
                </div>

                {/* ຖັນ 4: ປ້າຍທະບຽນລົດ */}
                <div className="flex items-center justify-center px-3 text-center">
                  <span className="text-base sm:text-[17px] md:text-lg font-bold text-black whitespace-nowrap">
                    ທະບຽນ : {plateText}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ສ່ວນເລືອກລົດ ກໍລະນີພົບລົດຫຼາຍກວ່າ 1 ຄັນ */}
          {multipleTickets.length > 0 && !ticket && (
            <div className="bg-white p-3 sm:p-3.5 mb-3 sm:mb-3.5 shadow-md rounded-none animate-fade-in">
              <p className="font-bold text-black text-sm sm:text-base mb-2 sm:mb-2.5">
                ພົບລົດຫຼາຍກວ່າ 1 ຄັນ, ກະລຸນາເລືອກ:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {multipleTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTicket(t);
                      setMultipleTickets([]);
                    }}
                    className="text-left p-3 border border-amber-300 hover:bg-amber-50 flex items-center justify-between transition-colors shadow-sm bg-white cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-black text-sm">{t.ticketNumber} ({t.vehicleType?.label})</p>
                      <p className="text-xs text-gray-600">{t.plateLetters || ''} {t.plateNumber || ''} {t.plateProvince || ''}</p>
                    </div>
                    <Check size={18} className="text-[#F9A825]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ສ່ວນອັບໂຫຼດຮູບຫຼັກຖານ (Evidence) */}
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <p className="text-sm sm:text-base md:text-[17px] font-bold text-black leading-tight">
              ຫຼັກຖານ
            </p>
          </div>

          {/* ກ່ອງອັບໂຫຼດຮູບພາບ 4 ຊ່ອງ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 mb-3.5 sm:mb-4">
            {photoSlots.map((slot) => {
              const photoUrl = photos[slot.key];
              const isLoading = loadingPhoto === slot.key;

              if (isLoading) {
                return (
                  <div
                    key={slot.key}
                    className="h-24 sm:h-26 md:h-28 flex flex-col items-center justify-center rounded-none border-0 bg-white text-gray-900 shadow-md p-2"
                    style={{ borderRadius: 0 }}
                  >
                    <RefreshCw size={24} className="animate-spin text-gray-900" />
                    <span className="text-[11px] sm:text-xs text-gray-600 font-bold mt-1.5">ກຳລັງອັບໂຫລດ...</span>
                  </div>
                );
              }

              if (photoUrl) {
                return (
                  <div
                    key={slot.key}
                    className="h-24 sm:h-26 md:h-28 relative overflow-hidden rounded-none shadow-md hover:shadow-lg border-0 bg-black group"
                    style={{ borderRadius: 0 }}
                  >
                    <img
                      src={getPhotoSrc(photoUrl)}
                      alt={slot.label}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setPreviewImage({ url: getPhotoSrc(photoUrl), label: slot.label })}
                    />
                    <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: getPhotoSrc(photoUrl), label: slot.label })}
                        className="bg-black/60 hover:bg-black/85 text-white p-1 transition-colors cursor-pointer rounded-none shadow-xs"
                        title="ເບິ່ງຮູບຂະໜາດເຕັມ"
                        style={{ borderRadius: 0 }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removePhoto(e, slot.key)}
                        className="bg-black/60 hover:bg-[#B02019] text-white p-1 transition-colors cursor-pointer rounded-none shadow-xs"
                        title="ລຶບຮູບ"
                        style={{ borderRadius: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white px-2 py-1 flex items-center justify-between text-[11px] sm:text-xs font-bold z-10">
                      <span className="truncate pr-1 text-white">{slot.label}</span>
                      <button
                        type="button"
                        onClick={() => setChoiceSlot(slot)}
                        className="bg-[#F9A825] hover:bg-amber-400 text-black px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-none shrink-0 cursor-pointer shadow-xs"
                        style={{ borderRadius: 0 }}
                      >
                        ປ່ຽນ
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setChoiceSlot(slot)}
                  className="h-24 sm:h-26 md:h-28 flex flex-col items-center justify-center transition-all rounded-none border-0 outline-none ring-0 bg-white text-gray-900 shadow-md hover:shadow-lg cursor-pointer select-none"
                  style={{ borderRadius: 0 }}
                  title="ກົດເພື່ອເລືອກວິທີເພີ່ມຮູບ"
                >
                  <div className="mb-1.5 transition-colors text-gray-900">
                    <Camera size={34} />
                  </div>
                  <span className="text-xs sm:text-sm md:text-[15px] font-bold text-center tracking-normal whitespace-nowrap transition-colors text-gray-900 px-1">
                    {slot.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ຊ່ອງເລືອກໄຟລ໌ທີ່ເຊື່ອງໄວ້ ສຳລັບອັບໂຫຼດຈາກເຄື່ອງ ຫຼື ເອີ້ນໃຊ້ກ້ອງລະບົບມືຖື */}
          {photoSlots.map((slot) => (
            <React.Fragment key={`inputs-${slot.key}`}>
              <input
                id={`device-input-${slot.key}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file, slot.key);
                  e.target.value = '';
                }}
              />
              <input
                id={`native-camera-input-${slot.key}`}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file, slot.key);
                  e.target.value = '';
                }}
              />
            </React.Fragment>
          ))}

          {/* ສ່ວນກຳນົດຄ່າປັບໃໝ ແລະ ໝາຍເຫດ (2 ຖັນ) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 mb-0">
            {/* ຖັນ 1: ຄ່າປັບໃໝ */}
            <div>
              <p className="text-sm sm:text-base md:text-[17px] font-bold text-black leading-tight mb-2 sm:mb-2.5">
                ຄ່າປັບໃໝ
              </p>
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                min="0"
                className="w-full bg-white h-14 md:h-16 px-4 text-center text-base md:text-[17px] font-bold text-black placeholder:text-gray-500 placeholder:font-bold focus:outline-none shadow-xs rounded-none border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* ຖັນ 2: ໝາຍເຫດ */}
            <div>
              <p className="text-sm sm:text-base md:text-[17px] font-bold text-black leading-tight mb-2 sm:mb-2.5">
                ໝາຍເຫດ
              </p>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ລາຍລະອຽດ ຫຼື ສາເຫດທີ່ປີ້ເສຍ..."
                className="w-full bg-white h-14 md:h-16 px-4 text-base md:text-[17px] font-bold text-black placeholder:text-gray-500 placeholder:font-bold focus:outline-none shadow-xs rounded-none border-0"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>
        </div>

        {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານລຸ່ມ */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ແຖບທ້າຍລຸ່ມສຸດ — ສີເທົາເຂັ້ມ ພ້ອມປຸ່ມບັນທຶກ ແລະ ຍົກເລີກ */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex items-center justify-center gap-3 sm:gap-4 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ປຸ່ມກົດບັນທຶກ */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loadingSubmit}
            className="flex-1 sm:flex-initial max-w-[180px] bg-[#8E8E8E] hover:bg-[#9E9E9E] active:bg-[#7D7D7D] text-[#212121] px-6 sm:px-8 h-10 sm:h-11 rounded-none font-bold transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer shadow-xs"
            style={{ borderRadius: 0 }}
          >
            {loadingSubmit ? (
              <RefreshCw size={18} className="animate-spin text-[#212121] shrink-0" />
            ) : (
              <Save size={18} className="text-[#212121] shrink-0" />
            )}
            <span className="whitespace-nowrap">ບັນທຶກ</span>
          </button>

          {/* ປຸ່ມກົດຍົກເລີກ */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={loadingSubmit}
            className="flex-1 sm:flex-initial max-w-[180px] bg-[#8E8E8E] hover:bg-[#9E9E9E] active:bg-[#7D7D7D] text-[#212121] px-6 sm:px-8 h-10 sm:h-11 rounded-none font-bold transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer shadow-xs"
            style={{ borderRadius: 0 }}
            title="ຍົກເລີກ"
          >
            <X size={18} className="text-[#212121] shrink-0 stroke-[2.5]" />
            <span className="whitespace-nowrap">ຍົກເລີກ</span>
          </button>
        </div>
      </div>

      {/* ── ໜ້າຕ່າງປັອບອັບຖ່າຍຮູບຜ່ານກ້ອງສົດ (Camera Capture Modal) ── */}
      {cameraSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div
            className="bg-white max-w-2xl w-full shadow-2xl rounded-none border-0 overflow-hidden flex flex-col"
            style={{ borderRadius: 0, border: 'none' }}
          >
            {/* ສ່ວນຫົວຂອງໜ້າຕ່າງຖ່າຍຮູບ */}
            <div
              className="bg-[#545454] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between text-white rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <Camera size={22} className="text-white shrink-0 stroke-[2]" />
                <h3 className="text-base sm:text-[17px] font-bold text-white tracking-wide">
                  ຖ່າຍຮູບ: {cameraSlot.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCameraSlot(null);
                }}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                title="ປິດ"
              >
                <X size={18} className="text-black stroke-[2.5]" />
              </button>
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານເທິງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ພື້ນທີ່ສະແດງພາບກ້ອງ (Camera Viewport) */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {capturedDataUrl ? (
                // ສະແດງພາບທີ່ຖ່າຍແລ້ວເພື່ອໃຫ້ຜູ້ໃຊ້ກວດສອບ
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <img
                    src={capturedDataUrl}
                    alt="Captured snapshot"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1 shadow-md">
                    ✓ ຖ່າຍຮູບແລ້ວ — ກວດສອບກ່ອນບັນທຶກ
                  </div>
                </div>
              ) : (
                // ສະແດງພາບສົດຈາກກ້ອງ (Live Stream View)
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* ກອບເສັ້ນປະແນະນຳຕຳແໜ່ງການວາງວັດຖຸ */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-white/60 pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-white" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-white" />
                    </div>
                    <div className="text-center">
                      <span className="bg-black/60 text-white text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-none backdrop-blur-xs">
                        ວາງ {cameraSlot.label} ໃຫ້ພໍດີໃນກອບ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-white" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-white" />
                    </div>
                  </div>

                  {/* ປຸ່ມສະຫຼັບກ້ອງໜ້າ ແລະ ກ້ອງຫຼັງ */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={switchFacingMode}
                      className="bg-black/60 hover:bg-black/85 text-white px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-none border border-white/20 shadow-md backdrop-blur-xs transition-colors"
                      title="ສະຫຼັບກ້ອງໜ້າ/ຫຼັງ"
                    >
                      <SwitchCamera size={15} />
                      <span className="hidden sm:inline">ສະຫຼັບກ້ອງ</span>
                    </button>
                  </div>
                </>
              )}

              {/* ສະຖານະກຳລັງເປີດກ້ອງ */}
              {cameraLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw size={32} className="animate-spin text-[#F9A825] mb-2" />
                  <p className="font-bold text-sm">ກຳລັງເປີດກ້ອງ...</p>
                </div>
              )}

              {/* ສະຖານະເກີດຂໍ້ຜິດພາດໃນການເປີດກ້ອງ */}
              {cameraError && !cameraLoading && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center text-white z-20">
                  <AlertCircle size={40} className="text-[#B02019] mb-3" />
                  <p className="font-bold text-sm sm:text-base text-red-200 mb-2">
                    {cameraError}
                  </p>
                  <p className="text-xs text-gray-300 mb-4 max-w-sm">
                    ຫາກບໍ່ສາມາດເປີດກ້ອງໄດ້ ທ່ານຍັງສາມາດເລືອກຮູບຈາກເຄື່ອງ ຫຼື ໃຊ້ກ້ອງລະບົບມືຖືໄດ້
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => triggerDeviceUpload(cameraSlot.key)}
                      className="bg-[#F9A825] hover:bg-amber-400 text-black px-4 py-2 font-bold text-xs flex items-center gap-1.5 cursor-pointer rounded-none shadow-md"
                    >
                      <FolderOpen size={15} />
                      <span>ເລືອກຮູບຈາກເຄື່ອງ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerNativeCamera(cameraSlot.key)}
                      className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 font-bold text-xs flex items-center gap-1.5 cursor-pointer rounded-none shadow-md"
                    >
                      <Smartphone size={15} />
                      <span>ກ້ອງລະບົບມືຖື</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານລຸ່ມ */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ແຖບທ້າຍຄວບຄຸມການຖ່າຍຮູບ */}
            <div className="bg-[#5D5D5D] px-4 py-3 flex items-center justify-between text-white">
              {capturedDataUrl ? (
                // ປຸ່ມຄຳສັ່ງຫຼັງຈາກຖ່າຍຮູບແລ້ວ: ຖ່າຍໃໝ່ ຫຼື ຕົກລົງໃຊ້ຮູບ
                <>
                  <button
                    type="button"
                    onClick={retakeSnapshot}
                    className="bg-white hover:bg-gray-100 text-[#232323] px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer rounded-none shadow-sm active:scale-95 transition-all"
                  >
                    <RotateCcw size={16} />
                    <span>ຖ່າຍໃໝ່</span>
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    disabled={loadingPhoto === cameraSlot.key}
                    className="bg-[#B02019] hover:bg-[#991B1B] text-white px-5 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer rounded-none shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loadingPhoto === cameraSlot.key ? (
                      <RefreshCw size={16} className="animate-spin text-white" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>ຕົກລົງໃຊ້ຮູບນີ້</span>
                  </button>
                </>
              ) : (
                // ປຸ່ມຄວບຄຸມຂະນະເປີດກ້ອງສົດ
                <>
                  <button
                    type="button"
                    onClick={() => triggerDeviceUpload(cameraSlot.key)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-none border border-gray-500 transition-colors"
                  >
                    <FolderOpen size={14} />
                    <span className="hidden sm:inline">ເລືອກໃນເຄື່ອງ</span>
                  </button>

                  {/* ປຸ່ມຊັດເຕີກົດຖ່າຍຮູບ (Circular Shutter Button) */}
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    disabled={cameraLoading || !!cameraError}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#B02019] hover:bg-[#991B1B] border-4 border-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                    title="ກົດເພື່ອຖ່າຍຮູບ"
                  >
                    <Camera size={22} className="text-white" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setCameraSlot(null);
                    }}
                    className="bg-white hover:bg-gray-100 text-[#232323] px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer rounded-none shadow-sm active:scale-95 transition-all"
                  >
                    <X size={16} />
                    <span>ປິດ</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ໜ້າຕ່າງປັອບອັບເລືອກວິທີເພີ່ມຮູບພາບ (Method Choice Modal) ── */}
      {choiceSlot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white max-w-md w-full shadow-2xl rounded-none border-0 overflow-hidden flex flex-col"
            style={{ borderRadius: 0, border: 'none' }}
          >
            {/* ສ່ວນຫົວຂອງໜ້າຕ່າງເລືອກວິທີເພີ່ມຮູບ */}
            <div
              className="bg-[#545454] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between text-white rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <Camera size={22} className="text-white shrink-0 stroke-[2]" />
                <h3 className="text-base sm:text-[17px] font-bold text-white tracking-wide">
                  ເລືອກວິທີເພີ່ມຮູບ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChoiceSlot(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                title="ປິດ"
              >
                <X size={18} className="text-black stroke-[2.5]" />
              </button>
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານເທິງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* ເນື້ອໃນ: ຕົວເລືອກວິທີການເພີ່ມຮູບ */}
            <div
              className="p-4 sm:p-5 bg-white flex flex-col gap-3 rounded-none"
              style={{ borderRadius: 0 }}
            >
              {/* ຕົວເລືອກ 1: ຖ່າຍຮູບສົດດ້ວຍກ້ອງ */}
              <button
                type="button"
                onClick={() => {
                  const slot = choiceSlot;
                  setChoiceSlot(null);
                  setCameraSlot(slot);
                }}
                className="w-full p-4 border-2 border-[#F9A825] bg-[#FFFDF5] hover:bg-[#FFFBEB] flex items-center gap-4 transition-all text-left cursor-pointer group rounded-none shadow-xs active:scale-[0.99]"
                style={{ borderRadius: 0 }}
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#F9A825] text-black flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Camera size={26} className="text-black stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base sm:text-[17px] leading-tight">
                    ຖ່າຍຮູບດ້ວຍກ້ອງ (Camera)
                  </h4>
                  <p className="text-xs sm:text-[13px] text-gray-700 font-normal mt-1 leading-normal">
                    ເປີດກ້ອງຖ່າຍຮູບສົດຜ່ານໜ້າຈໍຄອມ ຫຼື ມືຖື
                  </p>
                </div>
              </button>

              {/* ຕົວເລືອກ 2: ເລືອກຮູບຈາກເຄື່ອງ ຫຼື ຄັງຮູບ */}
              <button
                type="button"
                onClick={() => triggerDeviceUpload(choiceSlot.key)}
                className="w-full p-4 border-2 border-[#CBD5E1] bg-white hover:bg-gray-50 flex items-center gap-4 transition-all text-left cursor-pointer group rounded-none shadow-xs active:scale-[0.99]"
                style={{ borderRadius: 0 }}
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#2E3642] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <FolderOpen size={26} className="text-white stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base sm:text-[17px] leading-tight">
                    ເລືອກຮູບຈາກເຄື່ອງ (Device)
                  </h4>
                  <p className="text-xs sm:text-[13px] text-gray-700 font-normal mt-1 leading-normal">
                    ເລືອກໄຟລ໌ຮູບພາບທີ່ມີໃນຄອມພິວເຕີ ຫຼື ຄັງຮູບມືຖື
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ໜ້າຕ່າງສະແດງພາບຂະໜາດເຕັມ (Image Lightbox Modal) ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white max-w-3xl w-full shadow-2xl rounded-none border-0 overflow-hidden flex flex-col"
            style={{ borderRadius: 0, border: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ສ່ວນຫົວຂອງໜ້າຕ່າງສະແດງຮູບ */}
            <div
              className="bg-[#545454] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between text-white rounded-none"
              style={{ borderRadius: 0 }}
            >
              <h3 className="text-base sm:text-[17px] font-bold text-white tracking-wide">
                {previewImage.label}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                title="ປິດ"
              >
                <X size={18} className="text-black stroke-[2.5]" />
              </button>
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ກ່ອງສະແດງຮູບພາບເຕັມ */}
            <div className="bg-black flex items-center justify-center p-2 min-h-[300px] max-h-[75vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.label}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ສ່ວນທ້າຍພ້ອມປຸ່ມປິດ */}
            <div className="bg-[#5D5D5D] px-4 py-2.5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="bg-white hover:bg-gray-100 text-[#232323] px-5 py-1.5 font-bold text-xs sm:text-sm cursor-pointer rounded-none"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
