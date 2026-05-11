from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, DoctorProfile, PatientProfile
from .models import Appointment
from datetime import date, time, timedelta


class AppointmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(username='patient', password='pass', role='patient')
        PatientProfile.objects.create(user=self.patient)
        self.patient2 = User.objects.create_user(username='patient2', password='pass', role='patient')
        PatientProfile.objects.create(user=self.patient2)
        self.doctor = User.objects.create_user(username='doctor', password='pass', role='doctor',
                                               first_name='Sophie', last_name='Bernard')
        DoctorProfile.objects.create(user=self.doctor, specialty='cardiologie', license_number='LIC-001')
        self.doctor2 = User.objects.create_user(username='doctor2', password='pass', role='doctor',
                                                first_name='Marc', last_name='Dupre')
        DoctorProfile.objects.create(user=self.doctor2, specialty='dentiste', license_number='LIC-002')

    def test_create_appointment(self):
        self.client.force_authenticate(user=self.patient)
        data = {
            'doctor': self.doctor.id,
            'date': '2025-12-01',
            'time': '10:00:00',
            'reason': 'Consultation cardiologie',
        }
        response = self.client.post(reverse('appointment-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        appointment = Appointment.objects.first()
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.doctor, self.doctor)
        self.assertEqual(appointment.status, 'pending')

    def test_list_appointments(self):
        self.client.force_authenticate(user=self.patient)
        response = self.client.get(reverse('appointment-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patient_sees_only_own_appointments(self):
        apt1 = Appointment.objects.create(patient=self.patient, doctor=self.doctor, date='2025-12-01', time='10:00')
        apt2 = Appointment.objects.create(patient=self.patient2, doctor=self.doctor, date='2025-12-02', time='11:00')

        self.client.force_authenticate(user=self.patient)
        response = self.client.get(reverse('appointment-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], apt1.id)

    def test_doctor_sees_only_own_appointments(self):
        apt1 = Appointment.objects.create(patient=self.patient, doctor=self.doctor, date='2025-12-01', time='10:00')
        apt2 = Appointment.objects.create(patient=self.patient, doctor=self.doctor2, date='2025-12-02', time='11:00')

        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(reverse('appointment-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], apt1.id)

    def test_today_appointments_view(self):
        today = date.today()
        tomorrow = today + timedelta(days=1)

        apt_today = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=today, time='10:00'
        )
        apt_tomorrow = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=tomorrow, time='10:00'
        )

        self.client.force_authenticate(user=self.patient)
        response = self.client.get(reverse('today-appointments'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], apt_today.id)

    def test_dashboard_stats_patient(self):
        today = date.today()
        tomorrow = today + timedelta(days=1)

        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=tomorrow, time='10:00', status='confirmed'
        )
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor2,
            date=tomorrow, time='11:00', status='pending'
        )
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=today, time='09:00', status='cancelled'
        )

        self.client.force_authenticate(user=self.patient)
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['total_appointments'], 3)
        self.assertEqual(data['upcoming'], 1)
        self.assertEqual(data['pending'], 1)

    def test_dashboard_stats_doctor(self):
        today = date.today()

        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=today, time='10:00'
        )
        Appointment.objects.create(
            patient=self.patient2, doctor=self.doctor,
            date=today, time='11:00'
        )
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date=today, time='12:00', status='cancelled'
        )

        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['today_appointments'], 3)
        self.assertEqual(data['new_patients'], 2)
        self.assertAlmostEqual(data['cancellation_rate'], 33.3, places=1)

    def test_update_appointment_status(self):
        apt = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor,
            date='2025-12-01', time='10:00', status='pending'
        )

        self.client.force_authenticate(user=self.doctor)
        response = self.client.patch(
            reverse('appointment-detail', args=[apt.id]),
            {'status': 'confirmed'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        apt.refresh_from_db()
        self.assertEqual(apt.status, 'confirmed')

    def test_patient_cannot_see_other_patient_appointments(self):
        apt = Appointment.objects.create(
            patient=self.patient2, doctor=self.doctor,
            date='2025-12-01', time='10:00'
        )

        self.client.force_authenticate(user=self.patient)
        response = self.client.get(reverse('appointment-detail', args=[apt.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_doctor_cannot_see_other_doctor_appointments(self):
        apt = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor2,
            date='2025-12-01', time='10:00'
        )

        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(reverse('appointment-detail', args=[apt.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_appointment_requires_authentication(self):
        data = {
            'doctor': self.doctor.id,
            'date': '2025-12-01',
            'time': '10:00:00',
            'reason': 'Test',
        }
        response = self.client.post(reverse('appointment-list'), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)