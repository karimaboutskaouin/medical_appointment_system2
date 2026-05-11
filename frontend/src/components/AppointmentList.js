import React from 'react';

const STATUS_LABELS = {
  pending: 'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
};

const STATUS_COLORS = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  cancelled: 'status-cancelled',
  completed: 'status-completed',
};

export default function AppointmentList({ appointments, onCancel, onConfirm, role }) {
  if (!appointments?.length) {
    return <div className="empty-state">No appointments found</div>;
  }

  return (
    <div className="appointment-list">
      {appointments.map(apt => {
        // Support both API response format (patient_detail/doctor_detail) and test format (patient/doctor)
        const patientInfo = apt.patient_detail || apt.patient;
        const doctorInfo = apt.doctor_detail || apt.doctor;

        return (
          <div key={apt.id} className="appointment-card">
            <div className="apt-time">
              <span className="apt-hour">{apt.time?.slice(0, 5)}</span>
              <span className="apt-date">{apt.date}</span>
            </div>
            <div className="apt-info">
              <div className="apt-name">
                {role === 'doctor'
                  ? `${patientInfo?.first_name} ${patientInfo?.last_name}`
                  : `Dr. ${doctorInfo?.first_name} ${doctorInfo?.last_name}`}
              </div>
              <div className="apt-reason">{apt.reason || 'Consultation'}</div>
            </div>
            <div className="apt-actions">
              <span className={`status-badge ${STATUS_COLORS[apt.status]}`}>
                {STATUS_LABELS[apt.status]}
              </span>
              {apt.status === 'pending' && role === 'doctor' && onConfirm && (
                <button className="btn-confirm-small"
                  onClick={() => onConfirm(apt.id)}>✓ Confirm</button>
              )}
              {apt.status === 'pending' && role === 'patient' && onCancel && (
                <button className="btn-cancel-small"
                  onClick={() => onCancel(apt.id)}>Cancel</button>
              )}
              {apt.status === 'confirmed' && role === 'patient' && onCancel && (
                <button className="btn-cancel-small"
                  onClick={() => onCancel(apt.id)}>Cancel</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}