import { useState } from 'react';
import axios from 'axios';

const ResumeParserTest = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedData(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'http://localhost:8000/parse-resume/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setParsedData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse resume');
      console.error('Error parsing resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resume Parser Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Resume PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !file || isLoading
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
                Processing...
              </span>
            ) : (
              'Parse Resume'
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

      {parsedData && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{parsedData.name || 'Not found'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{parsedData.email || 'Not found'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{parsedData.phone || 'Not found'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Skills</h2>
            {parsedData.extracted_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedData.extracted_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills found</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Work Experience</h2>
            {parsedData.work_experience?.length > 0 ? (
              <div className="space-y-4">
                {parsedData.work_experience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-800">{exp.position}</h3>
                    <p className="text-sm text-gray-600">
                      {exp.company} • {exp.duration}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-gray-700">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No work experience found</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Education</h2>
            {parsedData.education?.length > 0 ? (
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="font-medium text-gray-800">{edu.degree}</h3>
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
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Raw Text</h2>
            <textarea
              readOnly
              value={parsedData.resume_text}
              className="w-full h-40 p-3 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeParserTest;