import React from 'react';
import './ConfirmationModal.css';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", type = "danger" }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-title">
                    {type === 'danger' && <span style={{ color: '#FF5630' }}>⚠️</span>}
                    {title}
                </div>
                <div className="confirm-message">{message}</div>
                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button
                        className={type === 'danger' ? "btn-confirm-danger" : "btn-primary"}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
