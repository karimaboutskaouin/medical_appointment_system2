import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';

const SPECIALTIES = [
  { label: 'Cardiologie', icon: '❤️', value: 'cardiologie' },
  { label: 'Dentiste', icon: '🦷', value: 'dentiste' },
  { label: 'Pédiatrie', icon: '👶', value: 'pediatrie' },
  { label: 'Généraliste', icon: '🩺', value: 'generaliste' },
  { label: 'Dermatologie', icon: '🔬', value: 'dermatologie' },
  { label: 'Ophtalmologie', icon: '👁️', value: 'ophtalmologie' },
];

export default function DashboardPatient() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [search, setSearch] = useState('');

  const fetchAppointments = () => {
    api.get('/appointments/').then(res => setAppointments(res.data.results || res.data));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const cancelAppointment = async (id) => {
    if (window.confirm('Annuler ce rendez-vous ?')) {
      await api.patch(`/appointments/${id}/`, { status: 'cancelled' });
      fetchAppointments();
    }
  };

  const upcoming = appointments.filter(a =>
    ['confirmed', 'pending'].includes(a.status) && new Date(a.date) >= new Date()
  ).slice(0, 3);

  return (
    <div className="patient-app">
      {/* Header */}
      <div className="patient-header">
        <span className="app-title">MA SANTÉ</span>
        <button className="avatar-btn" onClick={logout} title="Déconnexion">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </button>
      </div>

      {/* Content */}
      <div className="patient-content">
        {activeTab === 'home' && (
          <>
            {/* Hero Search */}
            <div className="hero-search">
              <h2>PRENDRE UN RENDEZ-VOUS</h2>
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Chercher par spécialité, médecin..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Top Specialties */}
            <section className="section">
              <h3 className="section-title">Top Spécialités</h3>
              <div className="specialty-grid">
                {SPECIALTIES.slice(0, 3).map(s => (
                  <button key={s.value} className="specialty-card"
                    onClick={() => setShowForm(true)}>
                    <span className="specialty-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Upcoming Appointments */}
            <section className="section">
              <h3 className="section-title">Mes Prochains Rendez-vous</h3>
              {upcoming.length === 0 ? (
                <div className="empty-card">
                  <p>Aucun rendez-vous à venir</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Prendre un RDV
                  </button>
                </div>
              ) : (
                <div className="upcoming-grid">
                  {upcoming.map(apt => (
                    <div key={apt.id} className="upcoming-card">
                      <div className="doc-avatar">
                        {apt.doctor_detail?.first_name?.[0]}{apt.doctor_detail?.last_name?.[0]}
                      </div>
                      <div className="upcoming-info">
                        <strong>Dr. {apt.doctor_detail?.first_name} {apt.doctor_detail?.last_name}</strong>
                        <span>📅 {new Date(apt.date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short'
                        })}, {apt.time?.slice(0, 5)}</span>
                        <span className={`status-badge status-${apt.status}`}>
                          {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'agenda' && (
          <section className="section">
            <div className="section-header">
              <h3 className="section-title">Mon Agenda</h3>
              <button className="btn-primary-sm" onClick={() => setShowForm(true)}>+ Nouveau</button>
            </div>
            <AppointmentList appointments={appointments} onCancel={cancelAppointment} role="patient" />
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="section">
            <h3 className="section-title">Mon Profil</h3>
            <div className="profile-card">
              <div className="profile-avatar large">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <h4>{user?.first_name} {user?.last_name}</h4>
              <p>{user?.email}</p>
              <p>{user?.phone}</p>
              <button className="btn-danger" onClick={logout}>Se déconnecter</button>
            </div>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {[
          { key: 'home', icon: '🏠', label: 'Accueil' },
          { key: 'agenda', icon: '📅', label: 'Agenda' },
          { key: 'messages', icon: '💬', label: 'Messages' },
          { key: 'profile', icon: '👤', label: 'Profil' },
        ].map(tab => (
          <button key={tab.key}
            className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* New Appointment Modal */}
      {showForm && (
        <AppointmentForm
          onSuccess={fetchAppointments}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)}>+</button>
    </div>
  );
}