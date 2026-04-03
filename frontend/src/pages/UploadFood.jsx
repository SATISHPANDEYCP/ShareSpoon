import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import api from '../utils/api';
import MapPicker from '../components/MapPicker';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { isValidQuantityUnit } from '../utils/validation';

const foodTypes = [
  'Cooked Meal',
  'Raw Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Bakery',
  'Packaged Food',
  'Other',
];

const DONATE_FORM_STORAGE_KEY = 'sharespoon-donate-form-v1';

const INITIAL_FORM_DATA = {
  title: '',
  description: '',
  foodType: 'Cooked Meal',
  totalQuantity: '',
  quantityUnit: '',
  servingsPerUnit: '',
  expiryTime: '',
  pickupTimeStart: '',
  pickupTimeEnd: '',
  pickupLocation: null,
  allergenInfo: '',
  hygieneChecklist: {
    freshFood: false,
    properStorage: false,
    allergenFree: false,
    noContamination: false,
  },
};

const getLocalDateTimeInputValue = (date = new Date()) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

/**
 * Upload Food Page
 */
const UploadFood = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const minDateTime = getLocalDateTimeInputValue();

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DONATE_FORM_STORAGE_KEY);
      if (!saved) return INITIAL_FORM_DATA;

      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_FORM_DATA,
        ...parsed,
        hygieneChecklist: {
          ...INITIAL_FORM_DATA.hygieneChecklist,
          ...(parsed?.hygieneChecklist || {}),
        },
      };
    } catch {
      return INITIAL_FORM_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem(DONATE_FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('hygiene-')) {
      const checklistKey = name.replace('hygiene-', '');
      setFormData({
        ...formData,
        hygieneChecklist: {
          ...formData.hygieneChecklist,
          [checklistKey]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    // Generate previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleLocationChange = (location) => {
    setFormData({
      ...formData,
      pickupLocation: location,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pickupLocation) {
      toast.error('Please select a pickup location on the map');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    if (!isValidQuantityUnit(formData.quantityUnit)) {
      toast.error('Unit must contain letters, e.g. plates, boxes, kg');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      // Append other data
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('foodType', formData.foodType);
      submitData.append('totalQuantity', String(formData.totalQuantity));
      submitData.append('quantityUnit', formData.quantityUnit);
      submitData.append('servingsPerUnit', String(formData.servingsPerUnit));
      submitData.append('quantity', `${formData.totalQuantity} ${formData.quantityUnit}`);
      submitData.append('expiryTime', formData.expiryTime);
      submitData.append('pickupTimeStart', formData.pickupTimeStart);
      submitData.append('pickupTimeEnd', formData.pickupTimeEnd);
      submitData.append('allergenInfo', formData.allergenInfo);
      submitData.append('pickupLocation', JSON.stringify(formData.pickupLocation));
      submitData.append('hygieneChecklist', JSON.stringify(formData.hygieneChecklist));

      await api.post('/posts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Food post created successfully!');
      localStorage.removeItem(DONATE_FORM_STORAGE_KEY);
      setFormData(INITIAL_FORM_DATA);
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      const validationErrors = error.response?.data?.errors;
      const message = validationErrors?.length
        ? `${validationErrors[0].field}: ${validationErrors[0].message}`
        : (error.response?.data?.message || 'Failed to create post');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Donate Food
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your extra food with people in need
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="label">Food Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              className="input"
              placeholder="e.g., Fresh Homemade Pizza"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={1000}
              rows={4}
              className="input resize-none"
              placeholder="Describe the food, ingredients, preparation method, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Food Type and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Food Type *</label>
              <select
                name="foodType"
                value={formData.foodType}
                onChange={handleChange}
                required
                className="input"
              >
                {foodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Total Quantity *</label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleChange}
                required
                min={1}
                className="input"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="label">Unit *</label>
              <input
                type="text"
                name="quantityUnit"
                value={formData.quantityUnit}
                onChange={handleChange}
                required
                maxLength={30}
                className="input"
                placeholder="e.g., plates, boxes, kg"
              />
            </div>

            <div>
              <label className="label">Servings per Unit *</label>
              <input
                type="number"
                name="servingsPerUnit"
                value={formData.servingsPerUnit}
                onChange={handleChange}
                required
                min={1}
                className="input"
                placeholder="e.g., 3"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-3">
            Example: 10 boxes, and each box serves 3 people.
          </p>

          {/* Expiry Time */}
          <div>
            <label className="label">Expiry Time *</label>
            <input
              type="datetime-local"
              name="expiryTime"
              value={formData.expiryTime}
              onChange={handleChange}
              required
              min={minDateTime}
              className="input"
            />
          </div>

          {/* Pickup Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Pickup Start Time</label>
              <input
                type="datetime-local"
                name="pickupTimeStart"
                value={formData.pickupTimeStart}
                onChange={handleChange}
                min={minDateTime}
                className="input"
              />
            </div>

            <div>
              <label className="label">Pickup End Time</label>
              <input
                type="datetime-local"
                name="pickupTimeEnd"
                value={formData.pickupTimeEnd}
                onChange={handleChange}
                min={formData.pickupTimeStart || minDateTime}
                className="input"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="label">Food Images * (Max 5)</label>
            {images.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                Note: If you refresh this page, selected images need to be added again.
              </p>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Location Picker */}
          <div>
            <MapPicker
              location={formData.pickupLocation}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Allergen Info */}
          <div>
            <label className="label">Allergen Information</label>
            <input
              type="text"
              name="allergenInfo"
              value={formData.allergenInfo}
              onChange={handleChange}
              maxLength={200}
              className="input"
              placeholder="e.g., Contains gluten, dairy, nuts"
            />
          </div>

          {/* Hygiene Checklist */}
          <div>
            <label className="label">Hygiene & Safety Checklist</label>
            <div className="space-y-2 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hygiene-freshFood"
                  checked={formData.hygieneChecklist.freshFood}
                  onChange={handleChange}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Food is fresh and properly cooked
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hygiene-properStorage"
                  checked={formData.hygieneChecklist.properStorage}
                  onChange={handleChange}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Food was stored at proper temperature
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hygiene-noContamination"
                  checked={formData.hygieneChecklist.noContamination}
                  onChange={handleChange}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  No contamination or spoilage
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hygiene-allergenFree"
                  checked={formData.hygieneChecklist.allergenFree}
                  onChange={handleChange}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Free from common allergens (or listed above)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? <Loader size="sm" color="white" /> : 'Publish Food Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFood;
