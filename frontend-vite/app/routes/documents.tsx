import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { documentsAPI, filesAPI } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { hasPermission, cn, formatTime } from '../lib/utils';
import toast from 'react-hot-toast';

export function meta() {
  return [
    { title: "Quản lý tài liệu - Radar Hub Manager" },
    { name: "description", content: "Quản lý tài liệu và file trong hệ thống" },
  ];
}

interface DocumentFormData {
  title: string;
  description?: string;
  file?: FileList;
}

interface Document {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: number;
  updated_at: number;
}

export default function Documents() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<DocumentFormData>();

  const selectedFile = watch('file');

  useEffect(() => {
    if (!user) return;
    if (!hasPermission(user.role_id, ['ADMIN', 'HQ'])) {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getAll();
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      
      // The API response has the documents in response.data.data based on your example
      let documentsData;
      if (response.data && Array.isArray(response.data.data)) {
        documentsData = response.data.data;
        console.log('Using response.data.data:', documentsData);
      } else if (Array.isArray(response.data)) {
        documentsData = response.data;
        console.log('Using response.data:', documentsData);
      } else {
        documentsData = [];
        console.log('No valid documents found, using empty array');
      }
      
      console.log('Final documents to set:', documentsData);
      setDocuments(documentsData);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]); // Set empty array on error
      toast.error(error.response?.data?.error || 'Lỗi khi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (document?: Document) => {
    setEditingDocument(document || null);
    if (document) {
      reset({
        title: document.title,
        description: document.description,
      });
    } else {
      reset({
        title: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
    reset();
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await filesAPI.upload(formData);
    return response.data;
  };

  const onSubmit = async (data: DocumentFormData) => {
    setSubmitting(true);
    try {
      let fileInfo = null;
      
      // Upload file if provided (for new documents or file updates)
      if (data.file && data.file.length > 0) {
        setUploading(true);
        fileInfo = await uploadFile(data.file[0]);
        console.log('Uploaded file info:', fileInfo);
      }
      
      if (editingDocument) {
        // Update existing document
        const updateData: any = {
          title: data.title,
          description: data.description,
        };
        
        // Include file info if a new file was uploaded
        if (fileInfo) {
          updateData.file_name = fileInfo.data.file_name;
          updateData.file_type = fileInfo.data.file_type;
          updateData.file_size = fileInfo.data.file_size;
          updateData.file_url = fileInfo.data.file_url;
        }
        
        await documentsAPI.update(editingDocument.id, updateData);
        toast.success('Cập nhật tài liệu thành công');
      } else {
        // Create new document
        if (!fileInfo) {
          toast.error('Vui lòng chọn file để tải lên');
          return;
        }
        
        const createData = {
          title: data.title,
          description: data.description || '',
          file_name: fileInfo.data.file_name,
          file_type: fileInfo.data.file_type,
          file_size: fileInfo.data.file_size,
          file_url: fileInfo.data.file_url,
        };
        
        await documentsAPI.create(createData);
        toast.success('Tạo tài liệu thành công');
      }
      
      handleCloseModal();
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu tài liệu');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${document.title}"?`)) {
      return;
    }

    try {
      await documentsAPI.delete(document.id);
      toast.success('Xóa tài liệu thành công');
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa tài liệu');
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.file_url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    return '📁';
  };

  // Debug logging for render state
  console.log('Render - documents state:', documents);
  console.log('Render - documents length:', documents.length);
  console.log('Render - loading:', loading);

  if (!user || !hasPermission(user.role_id, ['ADMIN', 'HQ'])) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Bạn không có quyền truy cập trang này</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý tài liệu</h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý tài liệu và file trong hệ thống
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Tải lên tài liệu
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {Array.isArray(documents) && documents.map((document) => (
                  <li key={document.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getFileIcon(document.file_type)}</span>
                            <div>
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {document.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {document.file_name} • {formatFileSize(document.file_size)} • {formatTime(document.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {document.description && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700">{document.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(document)}
                          className="text-green-600 hover:text-green-900"
                          title="Tải xuống"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(document)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {(!Array.isArray(documents) || documents.length === 0) && (
                <div className="text-center py-8">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Chưa có tài liệu nào được tải lên</p>
                </div>
              )}
            </div>
          )}

          {/* Document Form Modal */}
          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900"
                        >
                          {editingDocument ? 'Chỉnh sửa tài liệu' : 'Tải lên tài liệu mới'}
                        </Dialog.Title>
                        <button
                          onClick={handleCloseModal}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tiêu đề *
                          </label>
                          <input
                            {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                            type="text"
                            className={cn(
                              'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                              errors.title && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Mô tả
                          </label>
                          <textarea
                            {...register('description')}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {editingDocument ? 'File mới (tùy chọn)' : 'File *'}
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                >
                                  <span>Chọn file</span>
                                  <input
                                    {...register('file', { 
                                      required: editingDocument ? false : 'Vui lòng chọn file' 
                                    })}
                                    id="file-upload"
                                    name="file"
                                    type="file"
                                    className="sr-only"
                                  />
                                </label>
                                <p className="pl-1">hoặc kéo thả</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF, DOC, XLS, PPT, hình ảnh tối đa 10MB
                              </p>
                              {selectedFile && selectedFile.length > 0 && (
                                <p className="text-sm text-green-600">
                                  Đã chọn: {selectedFile[0].name}
                                </p>
                              )}
                            </div>
                          </div>
                          {errors.file && (
                            <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
                          )}
                        </div>

                        {editingDocument && (
                          <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>File hiện tại:</strong> {editingDocument.file_name}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Chọn file mới để thay thế hoặc để trống để giữ file hiện tại
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || uploading}
                            className={cn(
                              'inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                              (submitting || uploading) && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {uploading ? 'Đang tải lên...' : submitting ? 'Đang lưu...' : editingDocument ? 'Cập nhật' : 'Tải lên'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>
    </Layout>
  );
}