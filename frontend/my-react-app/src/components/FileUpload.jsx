import React, { useRef, useState } from 'react';
import './FileUpload.css';

const FileUpload = ({ onChange, label = "Upload New", multiple = false, accept }) => {
    const fileInputRef = useRef(null);
    const [displayText, setDisplayText] = useState('No file chosen');

    const handlePickClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (files.length === 1) {
                setDisplayText(files[0].name);
            } else {
                setDisplayText(`${files.length} files selected`);
            }
        } else {
            setDisplayText('No file chosen');
        }
        if (onChange) onChange(e);
    };

    return (
        <div className="file-upload-container">
            <div className="file-upload-header">
                <span className="file-icon-folder">📂</span>
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '16px', height: '16px', background: '#0052CC', borderRadius: '3px', marginLeft: '4px'
                }}>
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>↑</span>
                </span>
                <span style={{ marginLeft: '6px' }}>{label}</span>
            </div>

            <div className="file-upload-control" onClick={handlePickClick} title="Click to select files">
                <button type="button" className="choose-file-btn">
                    Choose File
                </button>
                <span className="file-name-display">{displayText}</span>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden-file-input"
                onChange={handleFileChange}
                multiple={multiple}
                accept={accept}
            />
        </div>
    );
};

export default FileUpload;
