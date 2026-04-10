import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import AppointmentList from './AppointmentList';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Tableau de Bord', icon: '⊞' },
  { key: 'agenda', label: 'Mon Agenda', icon: '📅' },
  { key: 'patients', label: 'Mes Patients', icon: '👥' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'analyses', label: 'Analyses', icon: '📊' },
  { key: 'settings', label: 'Paramètres', icon: '⚙️' },
];

export default function DashboardDoctor() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [todayApts, setTodayApts] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedApt, setSelectedApt] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    api.get('/appointments/').then(res => {
      const data = res.data.results || res.data;
      setAppointments(data);
      const today = new Date().toISOString().split('T')[0];
      setTodayApts(data.filter(a => a.date === today));
      if (data.length > 0) setSelectedApt(data[0]);
    });
    api.get('/appointments/stats/').then(res => setStats(res.data));
  }, []);

  const confirmAppointment = async (id) => {
    await api.patch(`/appointments/${id}/`, { status: 'confirmed' });
    const res = await api.get('/appointments/');
    setAppointments(res.data.results || res.data);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const adjustedFirst = (firstDay + 6) % 7;
    for (let i = 0; i < adjustedFirst; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="doctor-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-dot">✦</span>
          <span className="logo-text">Ma Santé</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}>
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="doctor-main">
        {/* Top Bar */}
        <header className="doctor-topbar">
          <div className="search-bar-doctor">
            <span>🔍</span>
            <input type="text" placeholder="Chercher par spécialité, médecin..." />
          </div>
          <div className="topbar-right">
            <button className="notif-btn">🔔</button>
            <div className="doctor-profile-btn" onClick={logout} title="Déconnexion">
              <div className="doc-avatar-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <span>Dr. {user?.first_name} {user?.last_name}</span>
              <span>▾</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="dashboard-title-row">
              <h1>Tableau de Bord</h1>
              <button className="btn-primary" onClick={() => setActiveTab('agenda')}>
                Modifier de RDV
              </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <p className="stat-label">RDV Aujourd'hui</p>
                  <p className="stat-value">{stats.today_appointments || todayApts.length}</p>
                </div>
                <span className="stat-icon">📅</span>
              </div>
              <div className="stat-card">
                <div>
                  <p className="stat-label">Nouveaux Patients</p>
                  <p className="stat-value">{stats.new_patients || 0}</p>
                </div>
                <span className="stat-icon">👥</span>
              </div>
              <div className="stat-card">
                <div>
                  <p className="stat-label">Taux de Confirmation</p>
                  <p className="stat-value">
                    {appointments.length > 0
                      ? Math.round(appointments.filter(a => a.status === 'confirmed').length / appointments.length * 100)
                      : 0}%
                  </p>
                </div>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-card">
                <div>
                  <p className="stat-label">Taux d'Annulation</p>
                  <p className="stat-value">{stats.cancellation_rate || 0}%</p>
                </div>
                <span className="stat-icon">%</span>
              </div>
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
              {/* Calendar */}
              <div className="dashboard-card calendar-card">
                <div className="calendar-header">
                  <span className="calendar-title">Calendar</span>
                  <div className="calendar-nav">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>‹</button>
                    <span>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>›</button>
                  </div>
                </div>
                <div className="calendar-grid">
                  {['Lu', 'Mu', 'Mu', 'Ju', 'Vv', 'Sa', 'Su'].map((d, i) => (
                    <div key={i} className="calendar-day-label">{d}</div>
                  ))}
                  {getDaysInMonth(currentMonth).map((day, i) => {
                    const today = new Date();
                    const isToday = day === today.getDate() &&
                      currentMonth.getMonth() === today.getMonth() &&
                      currentMonth.getFullYear() === today.getFullYear();
                    const hasApt = day && appointments.some(a =>
                      new Date(a.date).getDate() === day &&
                      new Date(a.date).getMonth() === currentMonth.getMonth()
                    );
                    return (
                      <div key={i}
                        className={`calendar-day ${day ? '' : 'empty'} ${isToday ? 'today' : ''} ${hasApt && !isToday ? 'has-apt' : ''}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="calendar-legend">
                  <span className="legend-item">
                    <span className="legend-dot confirmed"></span> Confirmé
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot pending"></span> Pendante
                  </span>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="dashboard-card today-card">
                <div className="today-header">
                  <span>Aujourd'hui</span>
                  <select className="status-filter">
                    <option>Confirmé</option>
                    <option>En attente</option>
                  </select>
                </div>
                <div className="today-list">
                  {todayApts.length === 0 ? (
                    <div className="empty-state">Aucun RDV aujourd'hui</div>
                  ) : (
                    todayApts.map(apt => (
                      <div key={apt.id}
                        className={`today-apt ${apt.status === 'pending' ? 'apt-pending' : 'apt-confirmed'}`}
                        onClick={() => setSelectedApt(apt)}>
                        <strong>{apt.time?.slice(0, 5)} - {apt.patient_detail?.first_name} {apt.patient_detail?.last_name}</strong>
                        <span>Consultation</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Patient Detail */}
              <div className="dashboard-card detail-card">
                <h4>Détails du Patient Prochain</h4>
                {selectedApt ? (
                  <>
                    <div className="patient-detail-header">
                      <div className="doc-avatar">
                        {selectedApt.patient_detail?.first_name?.[0]}
                        {selectedApt.patient_detail?.last_name?.[0]}
                      </div>
                      <div>
                        <strong>Dr. {selectedApt.patient_detail?.first_name} {selectedApt.patient_detail?.last_name}</strong>
                        <span>Age : {selectedApt.patient_detail?.date_of_birth
                          ? new Date().getFullYear() - new Date(selectedApt.patient_detail.date_of_birth).getFullYear()
                          : '—'}</span>
                      </div>
                    </div>
                    <div className="patient-detail-section">
                      <label>Raison de visite</label>
                      <p>{selectedApt.reason || 'Non spécifié'}</p>
                    </div>
                    <div className="patient-detail-section">
                      <label>Histoire médicale</label>
                      <p>{selectedApt.patient_detail?.patient_profile?.medical_history || 'Aucune information disponible'}</p>
                    </div>
                    <div className="detail-actions">
                      <label>Actions :</label>
                      <button className="btn-outline">Ouvrir Dossier</button>
                      {selectedApt.status === 'pending' && (
                        <button className="btn-outline" onClick={() => confirmAppointment(selectedApt.id)}>
                          Confirmer RDV
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Sélectionner un RDV</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="dashboard-content">
            <h1>Mon Agenda</h1>
            <AppointmentList appointments={appointments} role="doctor" />
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="dashboard-content">
            <h1>Mes Patients</h1>
            <div className="patients-grid">
              {[...new Map(appointments.map(a => [a.patient, a])).values()].map(apt => (
                <div key={apt.patient} className="patient-list-card">
                  <div className="doc-avatar">
                    {apt.patient_detail?.first_name?.[0]}{apt.patient_detail?.last_name?.[0]}
                  </div>
                  <div>
                    <strong>{apt.patient_detail?.first_name} {apt.patient_detail?.last_name}</strong>
                    <span>{apt.patient_detail?.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}