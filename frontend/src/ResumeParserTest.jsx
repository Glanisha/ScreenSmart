import React, { useState } from 'react';
import axios from 'axios';

const ResumeParser = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('http://localhost:8000/send-data', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return {
          fileName: file.name,
          data: response.data
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      setResults(uploadResults);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process resumes');
      console.error('Error processing resumes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resume Processor</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Resume PDFs (Multiple)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              multiple
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isLoading}
            />
          </div>

          {files.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate max-w-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            type="submit"
            disabled={files.length === 0 || isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              files.length === 0 || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing {files.length} {files.length === 1 ? 'resume' : 'resumes'}...
              </span>
            ) : (
              `Process ${files.length} ${files.length === 1 ? 'Resume' : 'Resumes'}`
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {result.fileName}
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {index + 1} of {results.length}
              </span>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
                {result.data.processed_data.personal_info ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{result.data.processed_data.personal_info.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{result.data.processed_data.personal_info.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{result.data.processed_data.personal_info.phone || 'Not provided'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No personal information found</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Education</h3>
                {result.data.processed_data.education?.length > 0 ? (
                  <div className="space-y-3">
                    {result.data.processed_data.education.map((edu, eduIndex) => (
                      <div key={eduIndex} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-gray-600">
                          {edu.institution} • {edu.year || 'Year not specified'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No education information found</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Work Experience</h3>
                {result.data.processed_data.experience?.length > 0 ? (
                  <div className="space-y-4">
                    {result.data.processed_data.experience.map((exp, expIndex) => (
                      <div key={expIndex} className="border-l-4 border-green-500 pl-4 py-2">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-sm text-gray-600">
                          {exp.company} • {exp.duration}
                        </p>
                        {exp.description && (
                          <p className="mt-1 text-gray-700 text-sm">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No work experience found</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Skills</h3>
                {result.data.processed_data.skills?.technical?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.data.processed_data.skills.technical.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills listed</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Raw Data</h3>
                <div className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
                  <pre className="text-xs text-gray-800">
                    {JSON.stringify(result.data.processed_data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeParser;