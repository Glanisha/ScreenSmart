import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IconUpload, IconX } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({
  onChange,
  maxFiles = 5,
}) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    // Convert newFiles to array if it's a FileList
    const fileArray = newFiles 
      ? Array.isArray(newFiles) 
        ? newFiles 
        : Array.from(newFiles)
      : [];

    // Limit the total number of files
    const updatedFiles = [...files, ...fileArray].slice(0, maxFiles);
    setFiles(updatedFiles);
    onChange && onChange(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onChange && onChange(updatedFiles);
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <div 
        onClick={handleClick}
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
            Upload files
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-400 mt-2">
            Drag or drop your files here or click to upload (Max {maxFiles} files)
          </p>

          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 && files.map((file, idx) => (
              <div 
                key={`file-${idx}`}
                className="bg-white dark:bg-neutral-900 flex flex-col p-4 mt-4 rounded-md shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <p className="text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-neutral-600 dark:bg-neutral-800 rounded-lg px-2 py-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-red-500 hover:bg-red-100 rounded-full p-1"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex text-sm mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                  <p className="px-1 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded-md">
                    {file.type}
                  </p>
                  <p>
                    modified {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {!files.length && (
              <div className="flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md bg-white dark:bg-neutral-900 shadow-md">
                {isDragActive ? (
                  <p className="text-neutral-600 flex flex-col items-center">
                    Drop it
                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </p>
                ) : (
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

