import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Send,
  Loader2,
  LocateFixed,
  ImagePlus,
  X,
} from "lucide-react";
import { requestService } from "../../api/requestService";

const MAX_PHOTO_SIZE = 1800000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDimension = 1280;
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to process this image."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let quality = 0.8;

      const createDataUrl = () => {
        const result = canvas.toDataURL("image/jpeg", quality);

        if (result.length > MAX_PHOTO_SIZE && quality > 0.35) {
          quality -= 0.1;
          createDataUrl();
          return;
        }

        if (result.length > MAX_PHOTO_SIZE) {
          reject(new Error("Image is too large. Please choose a smaller image."));
          return;
        }

        resolve(result);
      };

      createDataUrl();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read this image."));
    };

    image.src = objectUrl;
  });

const BookService = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("Plumbing");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [lat, setLat] = useState("17.3850");
  const [lng, setLng] = useState("78.4867");
  const [photoData, setPhotoData] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toString());
        setLng(position.coords.longitude.toString());
        setLocating(false);
      },
      () => {
        setError("Location access failed. Please allow location permission or enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError("Original image must be smaller than 12 MB.");
      return;
    }

    setPhotoLoading(true);

    try {
      const compressed = await compressImage(file);
      setPhotoData(compressed);
      setPhotoName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process image.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = () => {
    setPhotoData("");
    setPhotoName("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!lat || !lng || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Please provide valid latitude and longitude using the location button or manual entry.");
      return;
    }

    setLoading(true);

    try {
      await requestService.create({
        category,
        description: description.trim(),
        address: address.trim(),
        location: { lat: latitude, lng: longitude },
        priority,
        ...(photoData ? { photoData } : {}),
      });

      navigate("/customer/requests");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content narrow-page">
      <button className="back-button" onClick={() => navigate("/customer")}>
        <ArrowLeft size={17} /> Back to dashboard
      </button>

      <div className="page-title">
        <span className="eyebrow">QUICK BOOKING</span>
        <h1>Book a home service</h1>
        <p>Tell us what happened. We'll find an available technician for you.</p>
      </div>

      <form className="form-card booking-form" onSubmit={handleSubmit}>
        <div className="form-section-title">
          <span>01</span>
          <div><h3>Service details</h3><p>Choose the type of help you need.</p></div>
        </div>

        <label>Service category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="AC Repair">AC Repair</option>
          <option value="Appliance Repair">Appliance Repair</option>
          <option value="Carpentry">Carpentry</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Other">Other</option>
        </select>

        <label>Describe the problem</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the issue and any details the technician should know..."
          rows={4}
          minLength={5}
          maxLength={2000}
          required
        />
        <small className="field-hint">At least 5 characters. Maximum 2000 characters.</small>

        <label>Urgency level</label>
        <div className="priority-options">
          {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((level) => (
            <button
              type="button"
              key={level}
              className={`priority-option ${priority === level ? "selected" : ""} priority-${level.toLowerCase()}`}
              onClick={() => setPriority(level)}
            >
              {level}
            </button>
          ))}
        </div>

        <label>Problem photo (optional)</label>
        <p className="field-hint">Upload a picture of the issue to help the technician understand the problem.</p>

        {photoData ? (
          <div className="booking-photo-preview">
            <img src={photoData} alt="Selected problem" />
            <div>
              <strong>{photoName}</strong>
              <small>Image compressed and ready to upload.</small>
              <button type="button" className="location-button" onClick={removePhoto}>
                <X size={15} /> Remove photo
              </button>
            </div>
          </div>
        ) : (
          <label className="location-button photo-upload-button">
            {photoLoading ? <Loader2 className="spin" size={17} /> : <ImagePlus size={17} />}
            {photoLoading ? "Processing image..." : "Choose problem photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={photoLoading || loading}
              hidden
            />
          </label>
        )}

        <div className="form-divider" />

        <div className="form-section-title">
          <span>02</span>
          <div><h3>Service location</h3><p>Where should our technician visit?</p></div>
        </div>

        <label>Full address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House/flat number, street, area, city, PIN code..."
          rows={3}
          minLength={5}
          maxLength={300}
          required
        />

        <button type="button" className="location-button" onClick={useCurrentLocation} disabled={locating}>
          {locating ? <Loader2 className="spin" size={17} /> : <LocateFixed size={17} />}
          {locating ? "Detecting location..." : "Use my current GPS location"}
        </button>

        <div className="coordinate-grid">
          <div>
            <label>Latitude</label>
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 17.3850" required />
          </div>
          <div>
            <label>Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 78.4867" required />
          </div>
        </div>

        <p className="location-note">
          <MapPin size={15} /> GPS coordinates help us find the nearest available technician. You can enter them manually if needed.
        </p>

        {error && <div className="form-error">{error}</div>}

        <button className="primary-button submit-button" type="submit" disabled={loading || photoLoading}>
          {loading
            ? <><Loader2 className="spin" size={18} /> Creating request...</>
            : <><Send size={17} /> Submit service request</>}
        </button>

        <p className="secure-note">Your request will be automatically sent through our technician dispatch system.</p>
      </form>
    </div>
  );
};

export default BookService;