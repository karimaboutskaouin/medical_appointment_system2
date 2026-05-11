from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, DoctorProfile, PatientProfile, VitalSigns
from datetime import timedelta
from decimal import Decimal


class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')

    def test_patient_registration(self):
        data = {
            'username': 'patient1',
            'email': 'patient@test.com',
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'role': 'patient',
            'phone': '0601020304',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        user = User.objects.get(username='patient1')
        self.assertEqual(user.role, 'patient')
        self.assertTrue(hasattr(user, 'patient_profile'))

    def test_doctor_registration(self):
        data = {
            'username': 'doctor1',
            'email': 'doctor@test.com',
            'first_name': 'Sophie',
            'last_name': 'Bernard',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'role': 'doctor',
            'phone': '0601020304',
            'specialty': 'cardiologie',
            'license_number': 'LIC-12345',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='doctor1')
        self.assertEqual(user.role, 'doctor')
        self.assertTrue(hasattr(user, 'doctor_profile'))
        self.assertEqual(user.doctor_profile.specialty, 'cardiologie')

    def test_login(self):
        User.objects.create_user(username='testuser', password='pass123', role='patient')
        response = self.client.post(self.login_url, {'username': 'testuser', 'password': 'pass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_registration_duplicate_username(self):
        User.objects.create_user(username='taken', email='user1@test.com', password='pass', role='patient')
        data = {
            'username': 'taken',
            'email': 'user2@test.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'role': 'patient',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_mismatched_passwords(self):
        data = {
            'username': 'newuser',
            'email': 'test@test.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'Pass123!',
            'password2': 'DifferentPass123!',
            'role': 'patient',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_credentials(self):
        User.objects.create_user(username='testuser', password='correct123', role='patient')
        response = self.client.post(self.login_url, {'username': 'testuser', 'password': 'wrong123'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(self.login_url, {'username': 'noone', 'password': 'pass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_doctor_registration_missing_specialty(self):
        data = {
            'username': 'doctor2',
            'email': 'doctor2@test.com',
            'first_name': 'Marc',
            'last_name': 'Dupre',
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'role': 'doctor',
            'license_number': 'LIC-99999',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_authentication(self):
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserModelTests(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            username='patient', password='pass', role='patient',
            first_name='Jean', last_name='Dupont'
        )
        PatientProfile.objects.create(user=self.patient)
        self.doctor = User.objects.create_user(
            username='doctor', password='pass', role='doctor',
            first_name='Dr', last_name='House'
        )
        DoctorProfile.objects.create(
            user=self.doctor, specialty='cardiologie', license_number='LIC-001'
        )

    def test_user_str_representation(self):
        expected = "Jean Dupont (patient)"
        self.assertEqual(str(self.patient), expected)

    def test_doctor_profile_str_representation(self):
        expected = "Dr. Dr House - cardiologie"
        self.assertEqual(str(self.doctor.doctor_profile), expected)

    def test_patient_profile_str_representation(self):
        expected = "Patient: Jean Dupont"
        self.assertEqual(str(self.patient.patient_profile), expected)

    def test_vital_signs_bmi_calculation(self):
        vital = VitalSigns.objects.create(
            patient=self.patient,
            height=Decimal('170'),
            weight=Decimal('75')
        )
        expected_bmi = round(75 / (1.7 * 1.7), 1)
        self.assertEqual(vital.bmi, expected_bmi)

    def test_vital_signs_bmi_missing_height(self):
        vital = VitalSigns.objects.create(
            patient=self.patient,
            height=None,
            weight=Decimal('75')
        )
        self.assertIsNone(vital.bmi)

    def test_vital_signs_bmi_missing_weight(self):
        vital = VitalSigns.objects.create(
            patient=self.patient,
            height=Decimal('170'),
            weight=None
        )
        self.assertIsNone(vital.bmi)

    def test_vital_signs_bmi_zero_height(self):
        vital = VitalSigns.objects.create(
            patient=self.patient,
            height=Decimal('0'),
            weight=Decimal('75')
        )
        self.assertIsNone(vital.bmi)