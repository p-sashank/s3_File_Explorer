import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';


const AuthContext = createContext(null);


const API_BASE_URL = process.env.REACT_APP_DJANGO_API_URL || 'http://localhost:8090';

const API_PREFIX = '/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`, 
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/user/'); 
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password }); 
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('/auth/register/', { username, email, password }); 
      return true;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/'); 
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  let bgColor = 'bg-blue-100';
  let textColor = 'text-blue-800';
  if (type === 'success') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (type === 'error') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
  }

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} z-50 flex items-center justify-between animate-fade-in-down`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-lg font-bold">&times;</button>
    </div>
  );
};


const AuthForms = ({ onAuthSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    let success = false;
    if (isLogin) {
      success = await login(username, password);
      if (success) {
        setMessage('Login successful!');
        setMessageType('success');
        onAuthSuccess();
      } else {
        setMessage('Login failed. Please check your credentials.');
        setMessageType('error');
      }
    } else {
      success = await register(username, email, password);
      if (success) {
        setMessage('Registration successful! Please log in.');
        setMessageType('success');
        setIsLogin(true); 
      } else {
        setMessage('Registration failed. Username or email might already be taken.');
        setMessageType('error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-semibold text-lg"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

const FileExplorer = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [modifying, setModifying] = useState(false);

  const [modificationType, setModificationType] = useState('');
  const [columnName, setColumnName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [rowIndex, setRowIndex] = useState('');


  const fetchFiles = async () => {
    try {
      const response = await api.get('/files/list/'); 
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error.response?.data || error.message);
      setMessage('Failed to load files.');
      setMessageType('error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xls' && fileExtension !== 'xlsx') {
      setMessage('Only XLS and XLSX files are allowed.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload/', formData, { 
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('File uploaded successfully!');
      setMessageType('success');
      fetchFiles(); 
    } catch (error) {
      console.error('File upload failed:', error.response?.data || error.message);
      setMessage(`File upload failed: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    setMessage('');
    setMessageType('');
    try {
      
      const response = await api.get(`/files/download/${fileId}/`, { 
        responseType: 'blob', 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('File downloaded successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('File download failed:', error.response?.data || error.message);
      setMessage(`File download failed: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    }
  };

  const handleFileModify = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file to modify.');
      setMessageType('error');
      return;
    }

    setModifying(true);
    setMessage('');
    setMessageType('');

    const payload = {
      modification_type: modificationType,
      column_name: columnName,
      new_value: newValue,
      row_index: rowIndex !== '' ? parseInt(rowIndex, 10) : undefined, 
    };

    try {
      const response = await api.post(`/files/modify/${selectedFile.id}/`, payload); 
      setMessage(response.data.detail || 'File modified successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('File modification failed:', error.response?.data || error.message);
      setMessage(`File modification failed: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setModifying(false);
      setModificationType('');
      setColumnName('');
      setNewValue('');
      setRowIndex('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-inter">
      <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

      <header className="flex justify-between items-center py-4 px-6 bg-white shadow-md rounded-xl mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">S3 Explorer</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg text-gray-700">Welcome, <span className="font-semibold text-blue-600">{user?.username}</span>!</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition duration-200 font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Section */}
        <section className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload File</h2>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition duration-200">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
              accept=".xls,.xlsx"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer bg-blue-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-200 font-semibold text-lg flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{uploading ? 'Uploading...' : 'Choose XLS/XLSX File'}</span>
            </label>
            {uploading && (
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>
        </section>

        {/* File List Section */}
        <section className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Files</h2>
          {files.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No files uploaded yet. Upload one to get started!</p>
          ) : (
            <ul className="space-y-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition duration-200 ${
                    selectedFile?.id === file.id ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 0 01-2-2V5a2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-800 text-lg">{file.file_name}</span>
                      <p className="text-sm text-gray-500">Uploaded: {new Date(file.upload_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleFileDownload(file.id, file.file_name)}
                      className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-sm hover:bg-green-600 transition duration-200 text-sm font-semibold"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedFile(file)}
                      className={`py-2 px-4 rounded-lg shadow-sm transition duration-200 text-sm font-semibold ${
                        selectedFile?.id === file.id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedFile?.id === file.id ? 'Selected' : 'Select for Modify'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* File Modification Section */}
        <section className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Modify Selected XLS File</h2>
          {selectedFile ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Selected file: <span className="font-semibold text-blue-600">{selectedFile.file_name}</span>
              </p>
              <form onSubmit={handleFileModify} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modificationType" className="block text-gray-700 text-sm font-semibold mb-2">
                    Modification Type
                  </label>
                  <select
                    id="modificationType"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    value={modificationType}
                    onChange={(e) => setModificationType(e.target.value)}
                    required
                  >
                    <option value="">Select a type</option>
                    <option value="add_column">Add Column</option>
                    <option value="update_cell">Update Cell</option>
                    <option value="delete_column">Delete Column</option>
                  </select>
                </div>

                {modificationType && (
                  <>
                    <div>
                      <label htmlFor="columnName" className="block text-gray-700 text-sm font-semibold mb-2">
                        Column Name
                      </label>
                      <input
                        type="text"
                        id="columnName"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        value={columnName}
                        onChange={(e) => setColumnName(e.target.value)}
                        required
                      />
                    </div>

                    {(modificationType === 'add_column' || modificationType === 'update_cell') && (
                      <div>
                        <label htmlFor="newValue" className="block text-gray-700 text-sm font-semibold mb-2">
                          New Value
                        </label>
                        <input
                          type="text"
                          id="newValue"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {modificationType === 'update_cell' && (
                      <div>
                        <label htmlFor="rowIndex" className="block text-gray-700 text-sm font-semibold mb-2">
                          Row Index (0-based)
                        </label>
                        <input
                          type="number"
                          id="rowIndex"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          value={rowIndex}
                          onChange={(e) => setRowIndex(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200 font-semibold text-lg flex items-center justify-center space-x-2"
                    disabled={modifying || !modificationType || !columnName || ((modificationType === 'add_column' || modificationType === 'update_cell') && newValue === '') || (modificationType === 'update_cell' && rowIndex === '')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 0 00-2 2v11a2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{modifying ? 'Modifying...' : 'Apply Modification'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Select a file from "Your Files" to enable modification.</p>
          )}
        </section>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('auth'); 
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView('explorer');
      } else {
        setCurrentView('auth');
      }
    }
  }, [user, loading]);

  const handleAuthSuccess = () => {
    setCurrentView('explorer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  switch (currentView) {
    case 'auth':
      return <AuthForms onAuthSuccess={handleAuthSuccess} />;
    case 'explorer':
      return <FileExplorer />;
    default:
      return <AuthForms onAuthSuccess={handleAuthSuccess} />;
  }
}

// Wrap the App with AuthProvider
export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
